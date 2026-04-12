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

CREATE POLICY "Users can view signing requests they created"
  ON public.signing_requests FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create signing requests"
  ON public.signing_requests FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their signing requests"
  ON public.signing_requests FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can view recipients for their requests"
  ON public.signing_recipients FOR SELECT TO authenticated
  USING (signing_request_id IN (SELECT id FROM public.signing_requests WHERE created_by = auth.uid()));

CREATE POLICY "Users can add recipients to their requests"
  ON public.signing_recipients FOR INSERT TO authenticated
  WITH CHECK (signing_request_id IN (SELECT id FROM public.signing_requests WHERE created_by = auth.uid()));

CREATE POLICY "Users can update recipients for their requests"
  ON public.signing_recipients FOR UPDATE TO authenticated
  USING (signing_request_id IN (SELECT id FROM public.signing_requests WHERE created_by = auth.uid()));

CREATE POLICY "Users can view fields for their requests"
  ON public.signing_fields FOR SELECT TO authenticated
  USING (signing_request_id IN (SELECT id FROM public.signing_requests WHERE created_by = auth.uid()));

CREATE POLICY "Users can add fields to their requests"
  ON public.signing_fields FOR INSERT TO authenticated
  WITH CHECK (signing_request_id IN (SELECT id FROM public.signing_requests WHERE created_by = auth.uid()));

CREATE POLICY "Users can view responses for their requests"
  ON public.signing_field_responses FOR SELECT TO authenticated
  USING (field_id IN (
    SELECT sf.id FROM public.signing_fields sf
    JOIN public.signing_requests sr ON sf.signing_request_id = sr.id
    WHERE sr.created_by = auth.uid()
  ));

CREATE POLICY "Users can view audit logs for their requests"
  ON public.signing_audit_logs FOR SELECT TO authenticated
  USING (signing_request_id IN (SELECT id FROM public.signing_requests WHERE created_by = auth.uid()));

CREATE POLICY "System can insert audit logs"
  ON public.signing_audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);
