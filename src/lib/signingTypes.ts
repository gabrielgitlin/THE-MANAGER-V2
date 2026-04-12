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
  temp_id: string;
}

export interface CreateFieldInput {
  recipient_temp_id: string;
  type: FieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  label?: string;
}

export interface SigningRequestWithRecipients extends SigningRequest {
  recipients: SigningRecipient[];
}

export interface SigningRequestFull extends SigningRequest {
  recipients: (SigningRecipient & { fields: SigningField[] })[];
}
