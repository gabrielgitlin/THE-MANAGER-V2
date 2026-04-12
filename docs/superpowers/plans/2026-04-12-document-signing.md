# Document Signing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained document signing system in the Legal tab — send documents for signature, verify signer identity via email OTP, capture signatures, flatten into PDF with audit certificate.

**Architecture:** Supabase-native. New DB tables for signing state, Edge Functions for email/OTP/PDF operations, a public `/sign/:accessToken` route for external signers, and refactored existing modals to persist real data.

**Tech Stack:** Supabase (DB + Edge Functions + Storage), Resend (email), pdf-lib (PDF manipulation), pdfjs-dist (PDF rendering in browser), React Router (public signing route)

**Spec:** `docs/superpowers/specs/2026-04-12-document-signing-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|---|---|
| `supabase/migrations/XXXXXX_create_signing_tables.sql` | 5 new tables + RLS policies + indexes |
| `src/lib/signingService.ts` | All signing CRUD operations and Edge Function calls |
| `src/lib/signingTypes.ts` | TypeScript interfaces for signing data models |
| `src/pages/Sign.tsx` | Public signing page — OTP flow, document viewer, field completion |
| `src/components/signing/SigningDocumentViewer.tsx` | PDF renderer with field overlays (reusable by both sender preview and signer page) |
| `src/components/signing/SignatureCanvas.tsx` | Extracted signature drawing component |
| `src/components/signing/OTPVerification.tsx` | OTP entry form with attempt tracking |
| `src/components/signing/SigningFieldRenderer.tsx` | Renders interactive/read-only fields on document pages |
| `supabase/functions/create-signing-request/index.ts` | Creates request + recipients + fields, triggers emails |
| `supabase/functions/send-signing-email/index.ts` | Email dispatch via Resend (5 template types) |
| `supabase/functions/verify-signing-otp/index.ts` | OTP generation, verification, attempt tracking |
| `supabase/functions/finalize-signing/index.ts` | PDF flattening, audit certificate, completion emails |

### Modified Files
| File | Changes |
|---|---|
| `src/App.tsx` | Add public `/sign/:accessToken` route |
| `src/pages/Legal.tsx` | Add signing status column, status detail panel |
| `src/components/legal/SignaturePreparationModal.tsx` | Wire to real DB, add signing order + expiration |
| `src/lib/legalService.ts` | Add signing status helpers |
| `package.json` | Add pdf-lib, pdfjs-dist dependencies |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install pdf-lib and pdfjs-dist**

```bash
cd "/Users/gabrielgitlin/Downloads/The Manager V2"
npm install pdf-lib pdfjs-dist
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('pdf-lib'); console.log('pdf-lib OK')"
node -e "require('pdfjs-dist'); console.log('pdfjs-dist OK')"
```

Expected: Both print OK without errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add pdf-lib and pdfjs-dist for document signing"
```

---

## Task 2: Database Migration — Signing Tables

**Files:**
- Create: `supabase/migrations/XXXXXX_create_signing_tables.sql`

- [ ] **Step 1: Write the migration file**

Generate a timestamp for the filename (format: `YYYYMMDDHHMMSS`). Create the migration at `supabase/migrations/<timestamp>_create_signing_tables.sql`:

```sql
-- signing_requests: Core signing envelope
CREATE TABLE public.signing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'completed', 'voided', 'expired')),
  signing_order text NOT NULL DEFAULT 'parallel' CHECK (signing_order IN ('parallel', 'sequential')),
  current_order_step integer DEFAULT 0,
  subject text NOT NULL,
  message text,
  expires_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  signed_pdf_path text
);

CREATE INDEX idx_signing_requests_document_id ON public.signing_requests(document_id);
CREATE INDEX idx_signing_requests_created_by ON public.signing_requests(created_by);
CREATE INDEX idx_signing_requests_status ON public.signing_requests(status);

-- signing_recipients: Each person who needs to sign
CREATE TABLE public.signing_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signing_request_id uuid NOT NULL REFERENCES public.signing_requests(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role text,
  order_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'viewed', 'signed', 'declined')),
  access_token uuid NOT NULL DEFAULT gen_random_uuid(),
  otp_code text,
  otp_expires_at timestamptz,
  otp_verified boolean NOT NULL DEFAULT false,
  otp_attempts integer NOT NULL DEFAULT 0,
  signed_at timestamptz,
  ip_address text,
  user_agent text,
  user_id uuid REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX idx_signing_recipients_access_token ON public.signing_recipients(access_token);
CREATE INDEX idx_signing_recipients_request_id ON public.signing_recipients(signing_request_id);
CREATE INDEX idx_signing_recipients_email ON public.signing_recipients(email);

-- signing_fields: Field definitions placed on document pages
CREATE TABLE public.signing_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signing_request_id uuid NOT NULL REFERENCES public.signing_requests(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.signing_recipients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('signature', 'initial', 'date', 'text', 'checkbox')),
  page integer NOT NULL,
  x numeric NOT NULL,
  y numeric NOT NULL,
  width numeric NOT NULL,
  height numeric NOT NULL,
  required boolean NOT NULL DEFAULT true,
  label text
);

CREATE INDEX idx_signing_fields_request_id ON public.signing_fields(signing_request_id);
CREATE INDEX idx_signing_fields_recipient_id ON public.signing_fields(recipient_id);

-- signing_field_responses: Completed field values
CREATE TABLE public.signing_field_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES public.signing_fields(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.signing_recipients(id) ON DELETE CASCADE,
  value text,
  signature_data text,
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_signing_field_responses_field_id ON public.signing_field_responses(field_id);

-- signing_audit_logs: Immutable event trail
CREATE TABLE public.signing_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signing_request_id uuid NOT NULL REFERENCES public.signing_requests(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES public.signing_recipients(id),
  event text NOT NULL CHECK (event IN ('created', 'sent', 'viewed', 'otp_verified', 'field_completed', 'signed', 'completed', 'voided', 'reminder_sent', 'expired')),
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_signing_audit_logs_request_id ON public.signing_audit_logs(signing_request_id);
CREATE INDEX idx_signing_audit_logs_event ON public.signing_audit_logs(event);

-- RLS Policies

ALTER TABLE public.signing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signing_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signing_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signing_field_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signing_audit_logs ENABLE ROW LEVEL SECURITY;

-- signing_requests: authenticated users can manage
CREATE POLICY "Users can view signing requests they created"
  ON public.signing_requests FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create signing requests"
  ON public.signing_requests FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their signing requests"
  ON public.signing_requests FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- signing_recipients: authenticated users can manage recipients for their requests
CREATE POLICY "Users can view recipients for their requests"
  ON public.signing_recipients FOR SELECT TO authenticated
  USING (signing_request_id IN (SELECT id FROM public.signing_requests WHERE created_by = auth.uid()));

CREATE POLICY "Users can add recipients to their requests"
  ON public.signing_recipients FOR INSERT TO authenticated
  WITH CHECK (signing_request_id IN (SELECT id FROM public.signing_requests WHERE created_by = auth.uid()));

CREATE POLICY "Users can update recipients for their requests"
  ON public.signing_recipients FOR UPDATE TO authenticated
  USING (signing_request_id IN (SELECT id FROM public.signing_requests WHERE created_by = auth.uid()));

-- signing_fields: same pattern as recipients
CREATE POLICY "Users can view fields for their requests"
  ON public.signing_fields FOR SELECT TO authenticated
  USING (signing_request_id IN (SELECT id FROM public.signing_requests WHERE created_by = auth.uid()));

CREATE POLICY "Users can add fields to their requests"
  ON public.signing_fields FOR INSERT TO authenticated
  WITH CHECK (signing_request_id IN (SELECT id FROM public.signing_requests WHERE created_by = auth.uid()));

-- signing_field_responses: authenticated can read, inserts via Edge Functions
CREATE POLICY "Users can view responses for their requests"
  ON public.signing_field_responses FOR SELECT TO authenticated
  USING (field_id IN (
    SELECT sf.id FROM public.signing_fields sf
    JOIN public.signing_requests sr ON sf.signing_request_id = sr.id
    WHERE sr.created_by = auth.uid()
  ));

-- signing_audit_logs: insert-only, authenticated can read their own
CREATE POLICY "Users can view audit logs for their requests"
  ON public.signing_audit_logs FOR SELECT TO authenticated
  USING (signing_request_id IN (SELECT id FROM public.signing_requests WHERE created_by = auth.uid()));

CREATE POLICY "System can insert audit logs"
  ON public.signing_audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);
```

- [ ] **Step 2: Apply the migration to the Supabase project**

Use the Supabase MCP tool `apply_migration` with name `create_signing_tables` and the SQL above. Get the project ID from `list_projects` first.

- [ ] **Step 3: Verify tables exist**

Use `list_tables` with schemas `["public"]` and `verbose: true` to confirm all 5 tables were created with correct columns.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add signing tables migration (signing_requests, recipients, fields, responses, audit_logs)"
```

---

## Task 3: TypeScript Types for Signing

**Files:**
- Create: `src/lib/signingTypes.ts`

- [ ] **Step 1: Create the types file**

```typescript
export type SigningStatus = 'draft' | 'pending' | 'completed' | 'voided' | 'expired';
export type SigningOrder = 'parallel' | 'sequential';
export type RecipientStatus = 'pending' | 'notified' | 'viewed' | 'signed' | 'declined';
export type FieldType = 'signature' | 'initial' | 'date' | 'text' | 'checkbox';
export type AuditEvent = 'created' | 'sent' | 'viewed' | 'otp_verified' | 'field_completed' | 'signed' | 'completed' | 'voided' | 'reminder_sent' | 'expired';

export interface SigningRequest {
  id: string;
  document_id: string;
  status: SigningStatus;
  signing_order: SigningOrder;
  current_order_step: number;
  subject: string;
  message: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  completed_at: string | null;
  signed_pdf_path: string | null;
}

export interface SigningRecipient {
  id: string;
  signing_request_id: string;
  name: string;
  email: string;
  role: string | null;
  order_index: number;
  status: RecipientStatus;
  access_token: string;
  otp_verified: boolean;
  otp_attempts: number;
  signed_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  user_id: string | null;
}

export interface SigningField {
  id: string;
  signing_request_id: string;
  recipient_id: string;
  type: FieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  label: string | null;
}

export interface SigningFieldResponse {
  id: string;
  field_id: string;
  recipient_id: string;
  value: string | null;
  signature_data: string | null;
  completed_at: string;
}

export interface SigningAuditLog {
  id: string;
  signing_request_id: string;
  recipient_id: string | null;
  event: AuditEvent;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Input types for creating signing requests
export interface CreateSigningRequestInput {
  document_id: string;
  signing_order: SigningOrder;
  subject: string;
  message?: string;
  expires_at?: string;
  recipients: CreateRecipientInput[];
  fields: CreateFieldInput[];
}

export interface CreateRecipientInput {
  name: string;
  email: string;
  role?: string;
  order_index: number;
  temp_id: string; // Client-side ID for mapping fields to recipients before DB IDs exist
}

export interface CreateFieldInput {
  recipient_temp_id: string; // Maps to CreateRecipientInput.temp_id
  type: FieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  label?: string;
}

// Enriched types for display
export interface SigningRequestWithRecipients extends SigningRequest {
  recipients: SigningRecipient[];
}

export interface SigningRequestFull extends SigningRequest {
  recipients: (SigningRecipient & { fields: SigningField[] })[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/signingTypes.ts
git commit -m "feat: add TypeScript types for signing data models"
```

---

## Task 4: Signing Service Layer

**Files:**
- Create: `src/lib/signingService.ts`

- [ ] **Step 1: Create the service file with all CRUD operations**

```typescript
import { supabase } from './supabase';
import type {
  SigningRequest,
  SigningRecipient,
  SigningField,
  SigningFieldResponse,
  SigningAuditLog,
  SigningRequestWithRecipients,
  CreateSigningRequestInput,
} from './signingTypes';

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

async function callEdgeFunction(name: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Edge function call failed');
  }
  return response.json();
}

// --- Signing Requests ---

export async function createSigningRequest(input: CreateSigningRequestInput): Promise<SigningRequest> {
  return callEdgeFunction('create-signing-request', input);
}

export async function getSigningRequestsForDocument(documentId: string): Promise<SigningRequestWithRecipients[]> {
  const { data, error } = await supabase
    .from('signing_requests')
    .select('*, recipients:signing_recipients(*)')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as SigningRequestWithRecipients[];
}

export async function getSigningRequest(id: string): Promise<SigningRequestWithRecipients> {
  const { data, error } = await supabase
    .from('signing_requests')
    .select('*, recipients:signing_recipients(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as SigningRequestWithRecipients;
}

export async function voidSigningRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from('signing_requests')
    .update({ status: 'voided' })
    .eq('id', id);
  if (error) throw error;

  // Notify recipients via Edge Function
  await callEdgeFunction('send-signing-email', {
    type: 'voided',
    signing_request_id: id,
  });
}

// --- Reminders ---

export async function sendReminder(signingRequestId: string, recipientId: string): Promise<void> {
  await callEdgeFunction('send-signing-email', {
    type: 'reminder',
    signing_request_id: signingRequestId,
    recipient_id: recipientId,
  });
}

// --- Fields & Responses ---

export async function getFieldsForRequest(signingRequestId: string): Promise<SigningField[]> {
  const { data, error } = await supabase
    .from('signing_fields')
    .select('*')
    .eq('signing_request_id', signingRequestId);
  if (error) throw error;
  return (data || []) as SigningField[];
}

export async function getFieldResponses(signingRequestId: string): Promise<SigningFieldResponse[]> {
  const { data, error } = await supabase
    .from('signing_field_responses')
    .select('*')
    .in('field_id', (
      await supabase
        .from('signing_fields')
        .select('id')
        .eq('signing_request_id', signingRequestId)
    ).data?.map(f => f.id) || []);
  if (error) throw error;
  return (data || []) as SigningFieldResponse[];
}

// --- Audit Logs ---

export async function getAuditLogs(signingRequestId: string): Promise<SigningAuditLog[]> {
  const { data, error } = await supabase
    .from('signing_audit_logs')
    .select('*')
    .eq('signing_request_id', signingRequestId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as SigningAuditLog[];
}

// --- Public Signing (called from /sign/:accessToken page, no auth required) ---

export async function getSigningDataByToken(accessToken: string): Promise<{
  request: SigningRequest;
  recipient: SigningRecipient;
  fields: SigningField[];
  responses: SigningFieldResponse[];
  documentTitle: string;
  senderName: string;
}> {
  return callPublicEdgeFunction('verify-signing-otp', {
    action: 'get_signing_data',
    access_token: accessToken,
  });
}

export async function requestOTP(accessToken: string, email: string): Promise<{ success: boolean; message: string }> {
  return callPublicEdgeFunction('verify-signing-otp', {
    action: 'request_otp',
    access_token: accessToken,
    email,
  });
}

export async function verifyOTP(accessToken: string, code: string): Promise<{ success: boolean; message: string; remaining_attempts?: number }> {
  return callPublicEdgeFunction('verify-signing-otp', {
    action: 'verify_otp',
    access_token: accessToken,
    code,
  });
}

export async function submitFieldResponse(
  accessToken: string,
  fieldId: string,
  value: string | null,
  signatureData: string | null
): Promise<void> {
  await callPublicEdgeFunction('verify-signing-otp', {
    action: 'submit_field',
    access_token: accessToken,
    field_id: fieldId,
    value,
    signature_data: signatureData,
  });
}

export async function completeSigning(accessToken: string): Promise<void> {
  await callPublicEdgeFunction('verify-signing-otp', {
    action: 'complete_signing',
    access_token: accessToken,
  });
}

// Public edge function calls don't need auth token
async function callPublicEdgeFunction(name: string, body: Record<string, unknown>) {
  const url = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const response = await fetch(`${url}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Edge function call failed');
  }
  return response.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/signingService.ts
git commit -m "feat: add signing service layer with CRUD and Edge Function calls"
```

---

## Task 5: Edge Function — `verify-signing-otp`

This is the main Edge Function for the public signing page. It handles multiple actions: get signing data, request OTP, verify OTP, submit field responses, and complete signing.

**Files:**
- Create: `supabase/functions/verify-signing-otp/index.ts`

- [ ] **Step 1: Create the Edge Function**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { action, access_token, ...params } = await req.json();

    // Look up recipient by access token
    const { data: recipient, error: recipientError } = await supabase
      .from('signing_recipients')
      .select('*, signing_requests(*)')
      .eq('access_token', access_token)
      .single();

    if (recipientError || !recipient) {
      return new Response(JSON.stringify({ message: 'Invalid or expired signing link' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const signingRequest = recipient.signing_requests;

    // Check if request is still active
    if (signingRequest.status === 'voided') {
      return new Response(JSON.stringify({ message: 'This signing request has been voided' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (signingRequest.status === 'expired' || (signingRequest.expires_at && new Date(signingRequest.expires_at) < new Date())) {
      // Update status if it hasn't been updated yet
      if (signingRequest.status !== 'expired') {
        await supabase.from('signing_requests').update({ status: 'expired' }).eq('id', signingRequest.id);
      }
      return new Response(JSON.stringify({ message: 'This signing request has expired' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (recipient.status === 'signed') {
      return new Response(JSON.stringify({ message: 'You have already signed this document' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'get_signing_data': {
        // Only return data if OTP is verified
        if (!recipient.otp_verified) {
          // Return minimal info for landing page
          const { data: doc } = await supabase
            .from('legal_documents')
            .select('title, created_by')
            .eq('id', signingRequest.document_id)
            .single();

          const { data: sender } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', signingRequest.created_by)
            .single();

          return new Response(JSON.stringify({
            needs_otp: true,
            document_title: doc?.title || 'Document',
            sender_name: sender?.full_name || 'Unknown',
            message: signingRequest.message,
            recipient_email_hint: recipient.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // OTP verified — return full signing data
        const { data: fields } = await supabase
          .from('signing_fields')
          .select('*')
          .eq('signing_request_id', signingRequest.id);

        const { data: responses } = await supabase
          .from('signing_field_responses')
          .select('*')
          .in('field_id', (fields || []).map(f => f.id));

        const { data: doc } = await supabase
          .from('legal_documents')
          .select('title, file_url, created_by')
          .eq('id', signingRequest.document_id)
          .single();

        const { data: sender } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', signingRequest.created_by)
          .single();

        // Log viewed event
        if (recipient.status === 'notified') {
          await supabase.from('signing_recipients').update({ status: 'viewed' }).eq('id', recipient.id);
          await supabase.from('signing_audit_logs').insert({
            signing_request_id: signingRequest.id,
            recipient_id: recipient.id,
            event: 'viewed',
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent'),
          });
        }

        return new Response(JSON.stringify({
          needs_otp: false,
          request: signingRequest,
          recipient: { id: recipient.id, name: recipient.name, email: recipient.email, role: recipient.role },
          fields: fields || [],
          responses: responses || [],
          document_title: doc?.title || 'Document',
          document_url: doc?.file_url,
          sender_name: sender?.full_name || 'Unknown',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'request_otp': {
        const { email } = params;

        // Verify email matches
        if (email.toLowerCase() !== recipient.email.toLowerCase()) {
          return new Response(JSON.stringify({ success: false, message: 'Email does not match our records' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check rate limit (1 OTP per minute)
        if (recipient.otp_expires_at) {
          const lastSent = new Date(recipient.otp_expires_at).getTime() - 10 * 60 * 1000; // OTP expires in 10min, so sent = expires - 10min
          if (Date.now() - lastSent < 60 * 1000) {
            return new Response(JSON.stringify({ success: false, message: 'Please wait before requesting a new code' }), {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Generate 6-digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // Store OTP (plain text for now — in production, hash with bcrypt)
        await supabase.from('signing_recipients').update({
          otp_code: otp,
          otp_expires_at: expiresAt,
          otp_attempts: 0,
          otp_verified: false,
        }).eq('id', recipient.id);

        // Send OTP email via send-signing-email
        const emailUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-signing-email`;
        await fetch(emailUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            type: 'otp',
            recipient_id: recipient.id,
            signing_request_id: signingRequest.id,
            otp_code: otp,
          }),
        });

        return new Response(JSON.stringify({ success: true, message: 'Verification code sent to your email' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'verify_otp': {
        const { code } = params;

        // Check if locked out
        if (recipient.otp_attempts >= 3) {
          return new Response(JSON.stringify({ success: false, message: 'Too many attempts. Request a new code.', remaining_attempts: 0 }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check expiry
        if (!recipient.otp_code || !recipient.otp_expires_at || new Date(recipient.otp_expires_at) < new Date()) {
          return new Response(JSON.stringify({ success: false, message: 'Code has expired. Request a new one.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify code
        if (code !== recipient.otp_code) {
          const newAttempts = recipient.otp_attempts + 1;
          await supabase.from('signing_recipients').update({ otp_attempts: newAttempts }).eq('id', recipient.id);
          return new Response(JSON.stringify({
            success: false,
            message: 'Incorrect code',
            remaining_attempts: 3 - newAttempts,
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Success — mark verified
        await supabase.from('signing_recipients').update({
          otp_verified: true,
          otp_code: null,
          otp_expires_at: null,
          otp_attempts: 0,
        }).eq('id', recipient.id);

        await supabase.from('signing_audit_logs').insert({
          signing_request_id: signingRequest.id,
          recipient_id: recipient.id,
          event: 'otp_verified',
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent'),
        });

        return new Response(JSON.stringify({ success: true, message: 'Verified successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'submit_field': {
        if (!recipient.otp_verified) {
          return new Response(JSON.stringify({ message: 'OTP verification required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { field_id, value, signature_data } = params;

        // Verify field belongs to this recipient
        const { data: field } = await supabase
          .from('signing_fields')
          .select('*')
          .eq('id', field_id)
          .eq('recipient_id', recipient.id)
          .single();

        if (!field) {
          return new Response(JSON.stringify({ message: 'Field not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Upsert response
        const { data: existing } = await supabase
          .from('signing_field_responses')
          .select('id')
          .eq('field_id', field_id)
          .eq('recipient_id', recipient.id)
          .maybeSingle();

        if (existing) {
          await supabase.from('signing_field_responses').update({
            value,
            signature_data,
            completed_at: new Date().toISOString(),
          }).eq('id', existing.id);
        } else {
          await supabase.from('signing_field_responses').insert({
            field_id,
            recipient_id: recipient.id,
            value,
            signature_data,
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'complete_signing': {
        if (!recipient.otp_verified) {
          return new Response(JSON.stringify({ message: 'OTP verification required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify all required fields are completed
        const { data: myFields } = await supabase
          .from('signing_fields')
          .select('id, required')
          .eq('recipient_id', recipient.id)
          .eq('signing_request_id', signingRequest.id);

        const requiredFieldIds = (myFields || []).filter(f => f.required).map(f => f.id);

        if (requiredFieldIds.length > 0) {
          const { data: myResponses } = await supabase
            .from('signing_field_responses')
            .select('field_id')
            .eq('recipient_id', recipient.id)
            .in('field_id', requiredFieldIds);

          const completedFieldIds = new Set((myResponses || []).map(r => r.field_id));
          const missing = requiredFieldIds.filter(id => !completedFieldIds.has(id));

          if (missing.length > 0) {
            return new Response(JSON.stringify({ message: `${missing.length} required field(s) not completed` }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
        const userAgent = req.headers.get('user-agent');

        // Mark recipient as signed
        await supabase.from('signing_recipients').update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          ip_address: ipAddress,
          user_agent: userAgent,
        }).eq('id', recipient.id);

        // Log signed event
        await supabase.from('signing_audit_logs').insert({
          signing_request_id: signingRequest.id,
          recipient_id: recipient.id,
          event: 'signed',
          ip_address: ipAddress,
          user_agent: userAgent,
        });

        // Check if all recipients have signed
        const { data: allRecipients } = await supabase
          .from('signing_recipients')
          .select('id, status, order_index')
          .eq('signing_request_id', signingRequest.id);

        const allSigned = (allRecipients || []).every(r => r.status === 'signed');

        if (allSigned) {
          // Trigger finalization
          const finalizeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/finalize-signing`;
          await fetch(finalizeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({ signing_request_id: signingRequest.id }),
          });
        } else if (signingRequest.signing_order === 'sequential') {
          // Notify next recipient
          const nextStep = signingRequest.current_order_step + 1;
          const nextRecipient = (allRecipients || []).find(r => r.order_index === nextStep);

          if (nextRecipient) {
            await supabase.from('signing_requests').update({ current_order_step: nextStep }).eq('id', signingRequest.id);

            const emailUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-signing-email`;
            await fetch(emailUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                type: 'signing_request',
                recipient_id: nextRecipient.id,
                signing_request_id: signingRequest.id,
              }),
            });
          }
        }

        return new Response(JSON.stringify({ success: true, all_signed: allSigned }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ message: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 2: Deploy the Edge Function**

Use the Supabase MCP tool `deploy_edge_function` with name `verify-signing-otp`, entrypoint `index.ts`, `verify_jwt: false` (this function handles its own auth via access tokens), and the file content above.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/verify-signing-otp/
git commit -m "feat: add verify-signing-otp Edge Function (OTP, field submission, signing completion)"
```

---

## Task 6: Edge Function — `send-signing-email`

**Files:**
- Create: `supabase/functions/send-signing-email/index.ts`

- [ ] **Step 1: Create the Edge Function**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = Deno.env.get('SIGNING_FROM_EMAIL') || 'signing@themanager.app';
const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173';

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Resend error: ${err}`);
  }
  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { type, recipient_id, signing_request_id, otp_code } = await req.json();

    // Fetch signing request
    const { data: signingRequest } = await supabase
      .from('signing_requests')
      .select('*, legal_documents(title)')
      .eq('id', signing_request_id)
      .single();

    if (!signingRequest) throw new Error('Signing request not found');
    const docTitle = signingRequest.legal_documents?.title || 'Document';

    // Fetch sender name
    const { data: sender } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', signingRequest.created_by)
      .single();
    const senderName = sender?.full_name || 'Someone';

    switch (type) {
      case 'signing_request': {
        const { data: recipient } = await supabase
          .from('signing_recipients')
          .select('*')
          .eq('id', recipient_id)
          .single();
        if (!recipient) throw new Error('Recipient not found');

        const signUrl = `${APP_URL}/sign/${recipient.access_token}`;

        await sendEmail(recipient.email, signingRequest.subject || `Please sign: ${docTitle}`, `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">Signature Requested</h2>
            <p style="color: #4a4a4a; font-size: 16px;">${senderName} has requested your signature on <strong>${docTitle}</strong>.</p>
            ${signingRequest.message ? `<p style="color: #4a4a4a; background: #f5f5f5; padding: 12px; border-radius: 8px;">${signingRequest.message}</p>` : ''}
            ${signingRequest.expires_at ? `<p style="color: #888; font-size: 14px;">This request expires on ${new Date(signingRequest.expires_at).toLocaleDateString()}.</p>` : ''}
            <a href="${signUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">Review & Sign</a>
            <p style="color: #888; font-size: 13px;">If the button doesn't work, copy this link: ${signUrl}</p>
          </div>
        `);

        // Update recipient status
        await supabase.from('signing_recipients').update({ status: 'notified' }).eq('id', recipient.id);

        // Audit log
        await supabase.from('signing_audit_logs').insert({
          signing_request_id,
          recipient_id,
          event: 'sent',
          metadata: { email_type: 'signing_request' },
        });
        break;
      }

      case 'otp': {
        const { data: recipient } = await supabase
          .from('signing_recipients')
          .select('email, name')
          .eq('id', recipient_id)
          .single();
        if (!recipient) throw new Error('Recipient not found');

        await sendEmail(recipient.email, `Your verification code: ${otp_code}`, `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">Verification Code</h2>
            <p style="color: #4a4a4a; font-size: 16px;">Your code to sign <strong>${docTitle}</strong>:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 16px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${otp_code}</span>
            </div>
            <p style="color: #888; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
          </div>
        `);
        break;
      }

      case 'reminder': {
        const { data: recipient } = await supabase
          .from('signing_recipients')
          .select('*')
          .eq('id', recipient_id)
          .single();
        if (!recipient) throw new Error('Recipient not found');

        const signUrl = `${APP_URL}/sign/${recipient.access_token}`;
        const daysPending = Math.floor((Date.now() - new Date(signingRequest.created_at).getTime()) / (1000 * 60 * 60 * 24));

        await sendEmail(recipient.email, `Reminder: ${docTitle} awaits your signature`, `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">Signature Reminder</h2>
            <p style="color: #4a4a4a; font-size: 16px;"><strong>${docTitle}</strong> has been waiting for your signature for ${daysPending} day${daysPending !== 1 ? 's' : ''}.</p>
            ${signingRequest.expires_at ? `<p style="color: #e53e3e; font-size: 14px;">Expires: ${new Date(signingRequest.expires_at).toLocaleDateString()}</p>` : ''}
            <a href="${signUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">Review & Sign</a>
          </div>
        `);

        await supabase.from('signing_audit_logs').insert({
          signing_request_id,
          recipient_id,
          event: 'reminder_sent',
        });
        break;
      }

      case 'completed': {
        // Send to all recipients
        const { data: recipients } = await supabase
          .from('signing_recipients')
          .select('email, name')
          .eq('signing_request_id', signing_request_id);

        for (const r of recipients || []) {
          await sendEmail(r.email, `Completed: ${docTitle} — all parties have signed`, `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a1a;">Signing Complete</h2>
              <p style="color: #4a4a4a; font-size: 16px;">All parties have signed <strong>${docTitle}</strong>.</p>
              <p style="color: #4a4a4a;">A copy of the signed document with an audit certificate is attached to this email.</p>
            </div>
          `);
        }
        break;
      }

      case 'voided': {
        const { data: recipients } = await supabase
          .from('signing_recipients')
          .select('email, name')
          .eq('signing_request_id', signing_request_id);

        for (const r of recipients || []) {
          await sendEmail(r.email, `Voided: ${docTitle}`, `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a1a;">Signing Request Voided</h2>
              <p style="color: #4a4a4a; font-size: 16px;">The signing request for <strong>${docTitle}</strong> has been voided by ${senderName}.</p>
              <p style="color: #888;">No further action is needed.</p>
            </div>
          `);
        }

        await supabase.from('signing_audit_logs').insert({
          signing_request_id,
          event: 'voided',
          metadata: { voided_by: signingRequest.created_by },
        });
        break;
      }

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 2: Deploy**

Deploy via `deploy_edge_function` with name `send-signing-email`, `verify_jwt: true`.

Note: You must set the `RESEND_API_KEY`, `SIGNING_FROM_EMAIL`, and `APP_URL` environment variables in the Supabase dashboard under Edge Function secrets.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/send-signing-email/
git commit -m "feat: add send-signing-email Edge Function with 5 email templates via Resend"
```

---

## Task 7: Edge Function — `create-signing-request`

**Files:**
- Create: `supabase/functions/create-signing-request/index.ts`

- [ ] **Step 1: Create the Edge Function**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Get user from JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  try {
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { document_id, signing_order, subject, message, expires_at, recipients, fields } = await req.json();

    // Validate document exists
    const { data: doc, error: docError } = await supabaseAdmin
      .from('legal_documents')
      .select('id')
      .eq('id', document_id)
      .single();

    if (docError || !doc) {
      return new Response(JSON.stringify({ message: 'Document not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create signing request
    const { data: signingRequest, error: reqError } = await supabaseAdmin
      .from('signing_requests')
      .insert({
        document_id,
        signing_order: signing_order || 'parallel',
        subject: subject || 'Please sign this document',
        message: message || null,
        expires_at: expires_at || null,
        created_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (reqError) throw reqError;

    // Create recipients
    const tempIdToDbId: Record<string, string> = {};
    for (const r of recipients) {
      // Check if recipient is an internal user
      const { data: internalUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', r.email.toLowerCase())
        .maybeSingle();

      const { data: recipient, error: recError } = await supabaseAdmin
        .from('signing_recipients')
        .insert({
          signing_request_id: signingRequest.id,
          name: r.name,
          email: r.email.toLowerCase(),
          role: r.role || null,
          order_index: r.order_index,
          user_id: internalUser?.id || null,
        })
        .select()
        .single();

      if (recError) throw recError;
      tempIdToDbId[r.temp_id] = recipient.id;
    }

    // Create fields
    for (const f of fields) {
      const recipientId = tempIdToDbId[f.recipient_temp_id];
      if (!recipientId) throw new Error(`No recipient found for temp_id: ${f.recipient_temp_id}`);

      const { error: fieldError } = await supabaseAdmin
        .from('signing_fields')
        .insert({
          signing_request_id: signingRequest.id,
          recipient_id: recipientId,
          type: f.type,
          page: f.page,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          required: f.required,
          label: f.label || null,
        });

      if (fieldError) throw fieldError;
    }

    // Log creation
    await supabaseAdmin.from('signing_audit_logs').insert({
      signing_request_id: signingRequest.id,
      event: 'created',
      metadata: { recipient_count: recipients.length, field_count: fields.length },
    });

    // Send emails based on signing order
    const { data: dbRecipients } = await supabaseAdmin
      .from('signing_recipients')
      .select('*')
      .eq('signing_request_id', signingRequest.id)
      .order('order_index');

    const emailUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-signing-email`;
    const recipientsToNotify = signing_order === 'sequential'
      ? [dbRecipients![0]] // Only first recipient
      : dbRecipients!;     // All recipients

    for (const r of recipientsToNotify) {
      await fetch(emailUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          type: 'signing_request',
          recipient_id: r.id,
          signing_request_id: signingRequest.id,
        }),
      });
    }

    return new Response(JSON.stringify(signingRequest), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 2: Deploy**

Deploy via `deploy_edge_function` with name `create-signing-request`, `verify_jwt: true`.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/create-signing-request/
git commit -m "feat: add create-signing-request Edge Function"
```

---

## Task 8: Edge Function — `finalize-signing`

**Files:**
- Create: `supabase/functions/finalize-signing/index.ts`

- [ ] **Step 1: Create the Edge Function**

This function uses `pdf-lib` to flatten signatures into the PDF and generate an audit certificate page. Note: `pdf-lib` works in Deno via esm.sh.

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { decode as base64Decode } from 'https://deno.land/std@0.177.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { signing_request_id } = await req.json();

    // Fetch all data
    const { data: signingRequest } = await supabase
      .from('signing_requests')
      .select('*')
      .eq('id', signing_request_id)
      .single();

    if (!signingRequest) throw new Error('Signing request not found');

    const { data: doc } = await supabase
      .from('legal_documents')
      .select('title, file_url, file_name')
      .eq('id', signingRequest.document_id)
      .single();

    const { data: recipients } = await supabase
      .from('signing_recipients')
      .select('*')
      .eq('signing_request_id', signing_request_id)
      .order('order_index');

    const { data: fields } = await supabase
      .from('signing_fields')
      .select('*')
      .eq('signing_request_id', signing_request_id);

    const { data: responses } = await supabase
      .from('signing_field_responses')
      .select('*')
      .in('field_id', (fields || []).map(f => f.id));

    // Download original PDF
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('legal-documents')
      .download(doc!.file_url.replace(/.*legal-documents\//, ''));

    if (downloadError) throw downloadError;

    const pdfBytes = await fileData!.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Build response lookup
    const responseByFieldId: Record<string, typeof responses[0]> = {};
    for (const r of responses || []) {
      responseByFieldId[r.field_id] = r;
    }

    // Overlay fields onto PDF pages
    const pages = pdfDoc.getPages();

    for (const field of fields || []) {
      const response = responseByFieldId[field.id];
      if (!response) continue;

      const pageIndex = field.page - 1; // 0-indexed
      if (pageIndex >= pages.length) continue;

      const page = pages[pageIndex];
      const pageHeight = page.getHeight();

      // Convert from top-left origin (web) to bottom-left origin (PDF)
      const pdfY = pageHeight - field.y - field.height;

      if (field.type === 'signature' || field.type === 'initial') {
        if (response.signature_data) {
          // Embed signature image
          const base64Data = response.signature_data.replace(/^data:image\/png;base64,/, '');
          const imageBytes = base64Decode(base64Data);
          const pngImage = await pdfDoc.embedPng(imageBytes);
          page.drawImage(pngImage, {
            x: field.x,
            y: pdfY,
            width: field.width,
            height: field.height,
          });
        }
      } else if (field.type === 'checkbox') {
        if (response.value === 'true') {
          page.drawText('X', {
            x: field.x + 2,
            y: pdfY + 2,
            size: Math.min(field.width, field.height) * 0.8,
            font: fontBold,
            color: rgb(0, 0, 0),
          });
        }
      } else {
        // Text or date
        const text = response.value || '';
        page.drawText(text, {
          x: field.x + 4,
          y: pdfY + field.height / 2 - 5,
          size: 11,
          font: font,
          color: rgb(0, 0, 0),
        });
      }
    }

    // Generate audit certificate page
    const auditPage = pdfDoc.addPage([612, 792]); // US Letter
    let y = 740;
    const lineHeight = 18;

    auditPage.drawText('AUDIT CERTIFICATE', { x: 72, y, size: 18, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    y -= lineHeight * 2;

    auditPage.drawText(`Document: ${doc!.title}`, { x: 72, y, size: 11, font, color: rgb(0.3, 0.3, 0.3) });
    y -= lineHeight;

    auditPage.drawText(`Signing Request ID: ${signing_request_id}`, { x: 72, y, size: 11, font, color: rgb(0.3, 0.3, 0.3) });
    y -= lineHeight;

    // Compute SHA-256 hash of original PDF
    const hashBuffer = await crypto.subtle.digest('SHA-256', pdfBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    auditPage.drawText(`Document Fingerprint (SHA-256): ${hashHex}`, { x: 72, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
    y -= lineHeight * 2;

    // Signing timeline
    auditPage.drawText('SIGNING TIMELINE', { x: 72, y, size: 14, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    y -= lineHeight * 1.5;

    // Table header
    const cols = { name: 72, email: 180, role: 320, signed: 400, ip: 490 };
    auditPage.drawText('Name', { x: cols.name, y, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
    auditPage.drawText('Email', { x: cols.email, y, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
    auditPage.drawText('Role', { x: cols.role, y, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
    auditPage.drawText('Signed At', { x: cols.signed, y, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
    auditPage.drawText('IP Address', { x: cols.ip, y, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
    y -= lineHeight;

    for (const r of recipients || []) {
      auditPage.drawText(r.name, { x: cols.name, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
      auditPage.drawText(r.email, { x: cols.email, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
      auditPage.drawText(r.role || '', { x: cols.role, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
      auditPage.drawText(r.signed_at ? new Date(r.signed_at).toISOString() : 'N/A', { x: cols.signed, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
      auditPage.drawText(r.ip_address || 'N/A', { x: cols.ip, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
      y -= lineHeight;
    }

    y -= lineHeight;
    auditPage.drawText('Verification Method: Email OTP', { x: 72, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
    y -= lineHeight;
    auditPage.drawText(`Completed: ${new Date().toISOString()}`, { x: 72, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
    y -= lineHeight;
    auditPage.drawText('Generated by The Manager', { x: 72, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) });

    // Save PDF
    const signedPdfBytes = await pdfDoc.save();
    const signedPath = `signed/${signing_request_id}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('legal-documents')
      .upload(signedPath, signedPdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Update signing request
    const completedAt = new Date().toISOString();
    await supabase.from('signing_requests').update({
      status: 'completed',
      completed_at: completedAt,
      signed_pdf_path: signedPath,
    }).eq('id', signing_request_id);

    // Audit log
    await supabase.from('signing_audit_logs').insert({
      signing_request_id,
      event: 'completed',
      metadata: { signed_pdf_path: signedPath, document_hash: hashHex },
    });

    // Send completion emails
    const emailUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-signing-email`;
    await fetch(emailUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        type: 'completed',
        signing_request_id,
      }),
    });

    return new Response(JSON.stringify({ success: true, signed_pdf_path: signedPath }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

- [ ] **Step 2: Deploy**

Deploy via `deploy_edge_function` with name `finalize-signing`, `verify_jwt: true`.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/finalize-signing/
git commit -m "feat: add finalize-signing Edge Function (PDF flattening + audit certificate)"
```

---

## Task 9: Signature Canvas Component (Extracted)

**Files:**
- Create: `src/components/signing/SignatureCanvas.tsx`

Extract the signature drawing canvas from SignatureEmailPreview.tsx (lines 40-111) into a reusable component.

- [ ] **Step 1: Create the extracted component**

```tsx
import React, { useRef, useState, useEffect } from 'react';

interface SignatureCanvasProps {
  onSignatureChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
  initialData?: string | null;
}

export default function SignatureCanvas({ onSignatureChange, width = 400, height = 150, initialData }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a1a1a';

    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasDrawn(true);
      };
      img.src = initialData;
    }
  }, [width, height, initialData]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (hasDrawn && canvasRef.current) {
      onSignatureChange(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSignatureChange(null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{
          border: '1px solid var(--border)',
          borderRadius: '8px',
          cursor: 'crosshair',
          touchAction: 'none',
          width: '100%',
          height: `${height}px`,
          background: 'white',
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      {hasDrawn && (
        <button
          onClick={clear}
          style={{
            marginTop: '8px',
            padding: '6px 12px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--t2)',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/signing/SignatureCanvas.tsx
git commit -m "feat: extract SignatureCanvas component from SignatureEmailPreview"
```

---

## Task 10: OTP Verification Component

**Files:**
- Create: `src/components/signing/OTPVerification.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface OTPVerificationProps {
  onVerified: () => void;
  onRequestOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  onVerifyOTP: (code: string) => Promise<{ success: boolean; message: string; remaining_attempts?: number }>;
  emailHint: string;
  recipientEmail?: string;
}

export default function OTPVerification({ onVerified, onRequestOTP, onVerifyOTP, emailHint, recipientEmail }: OTPVerificationProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState(recipientEmail || '');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 'code') {
      setCanResend(true);
    }
  }, [resendTimer, step]);

  const handleRequestOTP = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await onRequestOTP(email);
      if (result.success) {
        setStep('code');
        setResendTimer(60);
        setCanResend(false);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    }
    setLoading(false);
  };

  const handleCodeInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    const fullCode = newCode.join('');
    if (fullCode.length === 6) {
      handleVerifyOTP(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (fullCode: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await onVerifyOTP(fullCode);
      if (result.success) {
        onVerified();
      } else {
        setError(result.message);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setCode(['', '', '', '', '', '']);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setCanResend(false);
    setResendTimer(60);
    setCode(['', '', '', '', '', '']);
    setError('');
    await onRequestOTP(email);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center', padding: '40px 20px' }}>
      <ShieldCheck size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />

      {step === 'email' ? (
        <>
          <h2 style={{ color: 'var(--t1)', marginBottom: '8px' }}>Verify Your Identity</h2>
          <p style={{ color: 'var(--t2)', marginBottom: '24px', fontSize: '14px' }}>
            Enter your email address to receive a verification code.
            {emailHint && <><br />Expected: {emailHint}</>}
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--t1)',
              fontSize: '16px',
              marginBottom: '16px',
              boxSizing: 'border-box',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleRequestOTP()}
          />
          {error && <p style={{ color: '#e53e3e', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
          <button
            onClick={handleRequestOTP}
            disabled={loading || !email}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading || !email ? 'not-allowed' : 'pointer',
              opacity: loading || !email ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Send Verification Code
          </button>
        </>
      ) : (
        <>
          <h2 style={{ color: 'var(--t1)', marginBottom: '8px' }}>Enter Verification Code</h2>
          <p style={{ color: 'var(--t2)', marginBottom: '24px', fontSize: '14px' }}>
            We sent a 6-digit code to {email}
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={{
                  width: '48px',
                  height: '56px',
                  textAlign: 'center',
                  fontSize: '24px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--t1)',
                }}
              />
            ))}
          </div>
          {error && <p style={{ color: '#e53e3e', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
          {loading && <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)', margin: '12px auto' }} />}
          <p style={{ color: 'var(--t3)', fontSize: '13px', marginTop: '16px' }}>
            {canResend ? (
              <button onClick={handleResend} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}>
                Resend code
              </button>
            ) : resendTimer > 0 ? (
              `Resend in ${resendTimer}s`
            ) : null}
          </p>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/signing/OTPVerification.tsx
git commit -m "feat: add OTP verification component for signing page"
```

---

## Task 11: Public Signing Page + Route

**Files:**
- Create: `src/pages/Sign.tsx`
- Modify: `src/App.tsx` (add route)

- [ ] **Step 1: Create the public signing page**

Create `src/pages/Sign.tsx`. This is the main page external signers interact with. It handles the full flow: landing, OTP verification, document viewing with field completion, review, and confirmation.

The page should:
1. Read `accessToken` from URL params via `useParams()`
2. Call `getSigningDataByToken(accessToken)` on mount — if `needs_otp` is true, show `OTPVerification` component
3. After OTP verified, re-fetch signing data to get full document info
4. Render document pages (initially as placeholder divs — PDF rendering comes in a later task)
5. Overlay the signer's fields using absolute positioning
6. For signature/initial fields, open `SignatureCanvas` in a modal
7. Track field completion progress
8. Show "Finish Signing" button when all required fields are done
9. On finish, call `completeSigning(accessToken)` and show confirmation

The component should use the existing app's CSS variables for theming and be self-contained (no sidebar, no navigation — just the signing flow).

Write this as a complete React component using the `signingService` functions from Task 4, `OTPVerification` from Task 10, and `SignatureCanvas` from Task 9. Follow the patterns in the existing codebase: `useState` for state, inline styles using CSS variables, lucide-react for icons.

- [ ] **Step 2: Add the public route to App.tsx**

In `src/App.tsx`, add the route. Import the page lazily following the existing pattern (line ~20 area):

```typescript
const Sign = React.lazy(() => import('./pages/Sign'));
```

Add the route inside the `<Routes>` block, BEFORE the catch-all or protected routes. This route must NOT be wrapped in `<ProtectedRoute>`:

```tsx
<Route path="/sign/:accessToken" element={
  <Suspense fallback={<LoadingSpinner />}>
    <Sign />
  </Suspense>
} />
```

This follows the same pattern as the existing `SharedPlaylist` public route.

- [ ] **Step 3: Verify the route works**

Start the dev server and navigate to `http://localhost:5173/sign/test-token`. It should render the signing page (will show an error since `test-token` isn't a real token, but the page should load without crashes).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Sign.tsx src/App.tsx
git commit -m "feat: add public signing page and route (/sign/:accessToken)"
```

---

## Task 12: Wire Up SignaturePreparationModal to Real Data

**Files:**
- Modify: `src/components/legal/SignaturePreparationModal.tsx`

- [ ] **Step 1: Update the modal to use real signing service**

The existing modal at `src/components/legal/SignaturePreparationModal.tsx` (927 lines) has the full 4-step UI already built. The key changes:

1. **Import the signing service** — Add `import * as signingService from '../../lib/signingService'` and types from `signingTypes.ts`

2. **Add signing order toggle** — In the recipients step, add a toggle between "parallel" and "sequential" using a simple button group. Add state: `const [signingOrder, setSigningOrder] = useState<'parallel' | 'sequential'>('parallel')`

3. **Add expiration date** — In the message step, add an optional date input for `expires_at`

4. **Replace the simulated send** — Replace the `handleSendForSignature` function (lines 157-165 which use `setTimeout`) with a real call:

```typescript
const handleSendForSignature = async () => {
  setIsSending(true);
  try {
    await signingService.createSigningRequest({
      document_id: document?.id?.toString() || '',
      signing_order: signingOrder,
      subject: emailSubject,
      message: emailMessage,
      expires_at: expiresAt || undefined,
      recipients: signers.map((s, i) => ({
        name: s.name,
        email: s.email,
        role: s.role,
        order_index: i,
        temp_id: s.id,
      })),
      fields: signers.flatMap(signer =>
        signer.fields.map(f => ({
          recipient_temp_id: signer.id,
          type: f.type,
          page: f.page,
          x: f.position.x,
          y: f.position.y,
          width: f.position.width,
          height: f.position.height,
          required: f.required,
          label: f.label,
        }))
      ),
    });
    setSendComplete(true);
  } catch (err: any) {
    console.error('Failed to send signing request:', err);
    alert('Failed to send signing request: ' + err.message);
  } finally {
    setIsSending(false);
  }
};
```

5. **Keep existing UI intact** — Do NOT restructure the steps, field placement UI, or recipient management. Only change the data flow.

- [ ] **Step 2: Test the modal**

Open the app, navigate to Legal tab, select a document with a PDF file, click "Prepare for Signature." Walk through all 4 steps and confirm:
- Recipients can be added
- Signing order toggle works
- Fields can be placed
- Message and expiration can be set
- Sending calls the Edge Function (check network tab)

- [ ] **Step 3: Commit**

```bash
git add src/components/legal/SignaturePreparationModal.tsx
git commit -m "feat: wire SignaturePreparationModal to real signing service"
```

---

## Task 13: Add Signing Status to Legal.tsx

**Files:**
- Modify: `src/pages/Legal.tsx`
- Modify: `src/lib/legalService.ts`

- [ ] **Step 1: Add signing status helper to legalService.ts**

Add at the end of `src/lib/legalService.ts`:

```typescript
// Signing status helpers
export async function getLatestSigningStatus(documentId: string): Promise<{
  status: string;
  signed_count: number;
  total_count: number;
  signing_request_id: string;
} | null> {
  const { data, error } = await supabase
    .from('signing_requests')
    .select('id, status, signing_recipients(id, status)')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const recipients = (data as any).signing_recipients || [];
  return {
    status: data.status,
    signed_count: recipients.filter((r: any) => r.status === 'signed').length,
    total_count: recipients.length,
    signing_request_id: data.id,
  };
}
```

- [ ] **Step 2: Add signing status display to Legal.tsx**

In the document list in `Legal.tsx`, add a signing status badge next to each document. After fetching documents, also fetch signing status for each document. Show a badge like:
- "2/3 Signed" (amber) for pending
- "Completed" (green) for completed
- "Voided" (red) for voided
- Nothing for documents with no signing requests

Also add a "Signing Details" section when a document is selected that shows:
- Per-recipient status table (name, email, status, signed timestamp)
- "Send Reminder" button per unsigned recipient
- "Void" button to cancel the request
- "Download Signed PDF" button when completed
- "View Audit Log" expandable section

Use the existing patterns in Legal.tsx for styling (CSS variables, lucide-react icons, inline styles).

- [ ] **Step 3: Commit**

```bash
git add src/pages/Legal.tsx src/lib/legalService.ts
git commit -m "feat: add signing status display and management to Legal page"
```

---

## Task 14: End-to-End Testing

- [ ] **Step 1: Verify the full sender flow**

1. Open the app, go to Legal tab
2. Upload a PDF document
3. Click "Prepare for Signature" on the document
4. Add 2 recipients with real email addresses you control
5. Place signature and text fields for each recipient
6. Set signing order to "parallel"
7. Write a custom message
8. Review and send
9. Verify: signing request appears in database, emails are received

- [ ] **Step 2: Verify the signer flow**

1. Open the signing link from the email (or construct it: `http://localhost:5173/sign/<access_token>`)
2. Verify landing page shows document title and sender name
3. Enter email, receive OTP
4. Enter OTP, verify access to document
5. Complete all assigned fields
6. Click "Finish Signing"
7. Verify: recipient status updates to "signed" in database

- [ ] **Step 3: Verify completion flow**

1. Complete signing as the second recipient
2. Verify: signing request status updates to "completed"
3. Verify: flattened PDF with audit certificate is generated in storage
4. Verify: completion email is sent to all parties
5. Verify: Legal page shows "Completed" status

- [ ] **Step 4: Verify edge cases**

1. Test expired link (set `expires_at` to past)
2. Test voided request (void from dashboard, then try to sign)
3. Test wrong email on OTP step
4. Test 3 failed OTP attempts (should lock out)
5. Test sequential signing (second signer shouldn't get email until first signs)

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during end-to-end signing testing"
```
