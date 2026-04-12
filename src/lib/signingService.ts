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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// ─── Edge Function Helpers ────────────────────────────────────────────────────

async function callEdgeFunction<T = unknown>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, {
    body,
  });

  if (error) {
    throw new Error(`Edge function '${name}' failed: ${error.message}`);
  }

  return data as T;
}

async function callPublicEdgeFunction<T = unknown>(name: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey ?? '',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Edge function '${name}' failed (${res.status}): ${errorText}`);
  }

  return res.json() as Promise<T>;
}

// ─── Signing Request Operations ───────────────────────────────────────────────

export async function createSigningRequest(input: CreateSigningRequestInput): Promise<SigningRequest> {
  return callEdgeFunction<SigningRequest>('create-signing-request', input as unknown as Record<string, unknown>);
}

export async function getSigningRequestsForDocument(documentId: string): Promise<SigningRequestWithRecipients[]> {
  const { data, error } = await supabase
    .from('signing_requests')
    .select(`
      *,
      recipients:signing_recipients(*)
    `)
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as SigningRequestWithRecipients[];
}

export async function getSigningRequest(id: string): Promise<SigningRequestWithRecipients | null> {
  const { data, error } = await supabase
    .from('signing_requests')
    .select(`
      *,
      recipients:signing_recipients(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as SigningRequestWithRecipients | null;
}

export async function voidSigningRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from('signing_requests')
    .update({ status: 'voided' })
    .eq('id', id);

  if (error) throw error;

  await callEdgeFunction('send-signing-email', { signing_request_id: id, action: 'voided' });
}

// ─── Recipient / Reminder Operations ─────────────────────────────────────────

export async function sendReminder(signingRequestId: string, recipientId: string): Promise<void> {
  await callEdgeFunction('send-signing-email', {
    signing_request_id: signingRequestId,
    recipient_id: recipientId,
    action: 'reminder',
  });
}

// ─── Field & Response Queries ─────────────────────────────────────────────────

export async function getFieldsForRequest(signingRequestId: string): Promise<SigningField[]> {
  const { data, error } = await supabase
    .from('signing_fields')
    .select('*')
    .eq('signing_request_id', signingRequestId);

  if (error) throw error;
  return (data ?? []) as SigningField[];
}

export async function getFieldResponses(signingRequestId: string): Promise<SigningFieldResponse[]> {
  // First fetch field IDs for this request
  const { data: fields, error: fieldsError } = await supabase
    .from('signing_fields')
    .select('id')
    .eq('signing_request_id', signingRequestId);

  if (fieldsError) throw fieldsError;
  if (!fields || fields.length === 0) return [];

  const fieldIds = fields.map((f: { id: string }) => f.id);

  const { data, error } = await supabase
    .from('signing_field_responses')
    .select('*')
    .in('field_id', fieldIds);

  if (error) throw error;
  return (data ?? []) as SigningFieldResponse[];
}

// ─── Audit Log Queries ────────────────────────────────────────────────────────

export async function getAuditLogs(signingRequestId: string): Promise<SigningAuditLog[]> {
  const { data, error } = await supabase
    .from('signing_audit_logs')
    .select('*')
    .eq('signing_request_id', signingRequestId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as SigningAuditLog[];
}

// ─── Public Signing Operations (token-based, no auth) ────────────────────────

export async function getSigningDataByToken(accessToken: string): Promise<unknown> {
  return callPublicEdgeFunction('verify-signing-otp', {
    action: 'get_signing_data',
    access_token: accessToken,
  });
}

export async function requestOTP(accessToken: string, email: string): Promise<unknown> {
  return callPublicEdgeFunction('verify-signing-otp', {
    action: 'request_otp',
    access_token: accessToken,
    email,
  });
}

export async function verifyOTP(accessToken: string, code: string): Promise<unknown> {
  return callPublicEdgeFunction('verify-signing-otp', {
    action: 'verify_otp',
    access_token: accessToken,
    code,
  });
}

export async function submitFieldResponse(
  accessToken: string,
  fieldId: string,
  value: string,
  signatureData?: string,
): Promise<unknown> {
  return callPublicEdgeFunction('verify-signing-otp', {
    action: 'submit_field',
    access_token: accessToken,
    field_id: fieldId,
    value,
    signature_data: signatureData ?? null,
  });
}

export async function completeSigning(accessToken: string): Promise<unknown> {
  return callPublicEdgeFunction('verify-signing-otp', {
    action: 'complete_signing',
    access_token: accessToken,
  });
}

// ─── Re-exports for convenience ───────────────────────────────────────────────

export type { SigningRequest, SigningRecipient, SigningField, SigningFieldResponse, SigningAuditLog };
