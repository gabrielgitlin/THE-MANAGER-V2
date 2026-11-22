import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import OTPVerification from '../components/signing/OTPVerification';
import SignatureCanvas from '../components/signing/SignatureCanvas';
import { getPdfFirstPageSize } from '../lib/pdfPageSize';
import {
  getSigningDataByToken,
  requestOTP,
  verifyOTP,
  submitFieldResponse,
  completeSigning,
} from '../lib/signingService';
import type { FieldType } from '../lib/signingTypes';

// ─── Types for signing data returned by the edge function ────────────────────

interface SigningDataField {
  id: string;
  type: FieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  label: string | null;
}

interface SigningData {
  needs_otp: boolean;
  request: {
    id: string;
    subject: string;
    message: string | null;
    status: string;
    expires_at: string | null;
  };
  recipient: {
    id: string;
    name: string;
    email: string;
    status: string;
    otp_verified: boolean;
  };
  sender_name?: string;
  fields: SigningDataField[];
  completed_fields: string[]; // array of field IDs already completed
  page_count?: number;
  document_url?: string;
}

// ─── Step type ────────────────────────────────────────────────────────────────

type Step = 'loading' | 'otp' | 'read' | 'signing' | 'review' | 'complete' | 'error';

// ─── Signature modal ──────────────────────────────────────────────────────────

interface SignatureModalProps {
  fieldType: 'signature' | 'initial';
  existingData: string | null;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

function SignatureModal({ fieldType, existingData, onSave, onClose }: SignatureModalProps) {
  const [signatureData, setSignatureData] = useState<string | null>(existingData);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '500px',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ color: 'var(--t1)', margin: 0 }}>
            {fieldType === 'initial' ? 'Draw Your Initials' : 'Draw Your Signature'}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t2)', padding: '4px' }}
          >
            <img src="/TM-Close-negro.svg" className="pxi-lg icon-muted" alt="" />
          </button>
        </div>
        <p style={{ color: 'var(--t2)', fontSize: '13px', marginBottom: '16px' }}>
          Draw in the box below using your mouse or finger.
        </p>
        <SignatureCanvas
          onSignatureChange={setSignatureData}
          width={450}
          height={150}
          initialData={existingData}
        />
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--t2)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => signatureData && onSave(signatureData)}
            disabled={!signatureData}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--primary)',
              color: 'white',
              cursor: signatureData ? 'pointer' : 'not-allowed',
              opacity: signatureData ? 1 : 0.5,
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Sign component ──────────────────────────────────────────────────────

export default function Sign() {
  const { accessToken } = useParams<{ accessToken: string }>();

  const [step, setStep] = useState<Step>('loading');
  const [signingData, setSigningData] = useState<SigningData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Per-field response values: fieldId -> { value, signatureData }
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldSignatureData, setFieldSignatureData] = useState<Record<string, string>>({});
  const [completedFieldIds, setCompletedFieldIds] = useState<Set<string>>(new Set());

  // Modal state
  const [signatureModalField, setSignatureModalField] = useState<SigningDataField | null>(null);

  // Review step
  const [legalConsent, setLegalConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Current page for signing step
  const [currentPage, setCurrentPage] = useState(1);
  // Document sheet height, sized to match the actual PDF aspect ratio at 850px wide
  const [sheetHeight, setSheetHeight] = useState(1100);

  // ─── Load signing data ──────────────────────────────────────────────────────

  const loadSigningData = useCallback(async () => {
    if (!accessToken) {
      setErrorMessage('Invalid signing link — no access token found.');
      setStep('error');
      return;
    }

    try {
      const raw = await getSigningDataByToken(accessToken) as any;

      // The edge function returns a different shape when OTP is not yet verified:
      // { needs_otp: true, document_title, sender_name, message, recipient_email_hint }
      if (raw.needs_otp && !raw.request) {
        // Build a minimal SigningData so the OTP step can render
        const otpData: SigningData = {
          needs_otp: true,
          request: {
            id: '',
            subject: raw.document_title || 'Document Signing',
            message: raw.message || null,
            status: 'pending',
            expires_at: null,
          },
          recipient: {
            id: '',
            name: '',
            email: raw.recipient_email_hint || '',
            status: 'notified',
            otp_verified: false,
          },
          sender_name: raw.sender_name,
          fields: [],
          completed_fields: [],
        };
        setSigningData(otpData);
        setStep('otp');
        return;
      }

      // Full signing data (OTP already verified or not required)
      const data: SigningData = {
        needs_otp: raw.needs_otp ?? false,
        request: raw.request,
        recipient: raw.recipient,
        sender_name: raw.sender_name,
        fields: raw.fields ?? [],
        completed_fields: (raw.responses ?? []).map((r: any) => r.field_id),
        page_count: raw.page_count,
        document_url: raw.document_url ?? undefined,
      };

      // Handle terminal states
      if (data.request.status === 'voided') {
        setErrorMessage('This signing request has been voided.');
        setStep('error');
        return;
      }
      if (data.request.status === 'expired' || (data.request.expires_at && new Date(data.request.expires_at) < new Date())) {
        setErrorMessage('This signing link has expired.');
        setStep('error');
        return;
      }
      if (data.recipient.status === 'signed') {
        setStep('complete');
        setSigningData(data);
        return;
      }

      setSigningData(data);
      setCompletedFieldIds(new Set(data.completed_fields ?? []));

      // Detect actual PDF page dimensions for correct overlay sizing
      if (data.document_url) {
        getPdfFirstPageSize(data.document_url, 850)
          .then(({ heightPx }) => setSheetHeight(heightPx))
          .catch(() => setSheetHeight(1100));
      }

      if (data.needs_otp && !data.recipient.otp_verified) {
        setStep('otp');
      } else if (data.document_url && data.completed_fields.length === 0) {
        // First visit after verification — let them read the document first
        setStep('read');
      } else {
        setStep('signing');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load signing data.';
      if (message.includes('not found') || message.includes('invalid')) {
        setErrorMessage('This signing link is invalid or has expired.');
      } else {
        setErrorMessage(message);
      }
      setStep('error');
    }
  }, [accessToken]);

  useEffect(() => {
    loadSigningData();
  }, [loadSigningData]);

  // ─── OTP handlers ────────────────────────────────────────────────────────────

  const handleRequestOTP = async (email: string) => {
    try {
      const result = await requestOTP(accessToken!, email) as { success: boolean; message: string };
      return { success: result.success ?? true, message: result.message ?? 'Code sent' };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : 'Failed to send code' };
    }
  };

  const handleVerifyOTP = async (code: string) => {
    try {
      const result = await verifyOTP(accessToken!, code) as { success: boolean; message: string; remaining_attempts?: number };
      return { success: result.success ?? false, message: result.message ?? '', remaining_attempts: result.remaining_attempts };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : 'Verification failed' };
    }
  };

  const handleOTPVerified = async () => {
    // Re-fetch data after verification
    setStep('loading');
    await loadSigningData();
  };

  // ─── Field submission ────────────────────────────────────────────────────────

  const handleFieldSubmit = async (field: SigningDataField, value: string, sigData?: string) => {
    if (!accessToken) return;
    try {
      await submitFieldResponse(accessToken, field.id, value, sigData);
      setCompletedFieldIds((prev) => new Set([...prev, field.id]));
      setFieldValues((prev) => ({ ...prev, [field.id]: value }));
      if (sigData) {
        setFieldSignatureData((prev) => ({ ...prev, [field.id]: sigData }));
      }
    } catch (err: unknown) {
      console.error('Failed to submit field:', err);
    }
  };

  // ─── Complete signing ────────────────────────────────────────────────────────

  const handleCompleteSigning = async () => {
    if (!accessToken) return;
    setSubmitting(true);
    try {
      await completeSigning(accessToken);
      setStep('complete');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to complete signing.');
      setStep('error');
    }
    setSubmitting(false);
  };

  // ─── Derived values ──────────────────────────────────────────────────────────

  const fields = signingData?.fields ?? [];
  const requiredFields = fields.filter((f) => f.required);
  const completedCount = fields.filter((f) => completedFieldIds.has(f.id)).length;
  const requiredCompletedCount = requiredFields.filter((f) => completedFieldIds.has(f.id)).length;
  const allRequiredComplete = requiredFields.length === 0 || requiredCompletedCount === requiredFields.length;

  const pageCount = signingData?.page_count ?? Math.max(1, ...fields.map((f) => f.page));

  // Group fields by page
  const fieldsByPage: Record<number, SigningDataField[]> = {};
  for (const field of fields) {
    if (!fieldsByPage[field.page]) fieldsByPage[field.page] = [];
    fieldsByPage[field.page].push(field);
  }

  // ─── Shared layout wrapper ───────────────────────────────────────────────────

  const pageTitle = signingData?.request.subject ?? 'Document Signing';

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        height: '100vh',
        background: step === 'signing' ? 'var(--surface)' : 'var(--bg)',
        color: 'var(--t1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <img src="/TM-File-negro.svg" className="pxi-lg icon-white" alt="" />
        <span
          style={{
            fontWeight: 600,
            fontSize: '15px',
            color: 'var(--t1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {pageTitle}
        </span>
        {step === 'signing' && fields.length > 0 && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '13px',
              color: 'var(--t2)',
              flexShrink: 0,
            }}
          >
            {completedCount} of {fields.length} field{fields.length !== 1 ? 's' : ''} completed
          </span>
        )}
      </header>

      {/* Body */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* ── LOADING ─────────────────────────────────────────────────────── */}
        {step === 'loading' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            <Loader2 size={40} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--t2)', fontSize: '15px' }}>Loading document…</p>
          </div>
        )}

        {/* ── ERROR ───────────────────────────────────────────────────────── */}
        {step === 'error' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              textAlign: 'center',
            }}
          >
            <AlertCircle size={56} style={{ color: 'var(--status-red)', marginBottom: '20px' }} />
            <h2 style={{ color: 'var(--t1)', marginBottom: '12px' }}>Unable to Load Document</h2>
            <p style={{ color: 'var(--t2)', maxWidth: '400px', lineHeight: 1.6 }}>{errorMessage}</p>
          </div>
        )}

        {/* ── OTP / LANDING ───────────────────────────────────────────────── */}
        {step === 'otp' && signingData && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
            }}
          >
            {/* Document info */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '480px',
                width: '100%',
                marginBottom: '32px',
                textAlign: 'center',
              }}
            >
              <img src="/TM-File-negro.svg" className="pxi-xl icon-white" style={{ marginBottom: '12px' }} alt="" />
              <h2 style={{ color: 'var(--t1)', marginBottom: '8px', fontSize: '18px' }}>
                {signingData.request.subject}
              </h2>
              {signingData.sender_name && (
                <p style={{ color: 'var(--t2)', fontSize: '14px', marginBottom: '8px' }}>
                  Sent by {signingData.sender_name}
                </p>
              )}
              {signingData.request.message && (
                <p
                  style={{
                    color: 'var(--t3)',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    marginTop: '12px',
                    padding: '12px',
                    background: 'var(--surface-2)',
                    borderRadius: '8px',
                    textAlign: 'left',
                  }}
                >
                  {signingData.request.message}
                </p>
              )}
            </div>

            <OTPVerification
              onVerified={handleOTPVerified}
              onRequestOTP={handleRequestOTP}
              onVerifyOTP={handleVerifyOTP}
              emailHint={signingData.recipient.email}
            />
          </div>
        )}

        {/* ── READ DOCUMENT ───────────────────────────────────────────────── */}
        {step === 'read' && signingData && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '900px', margin: '0 auto', width: '100%', padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ color: 'var(--t1)', fontSize: '18px', marginBottom: '6px' }}>Review Document</h2>
              <p style={{ color: 'var(--t2)', fontSize: '14px' }}>
                Read the full document below before proceeding to sign.
              </p>
            </div>

            {signingData.document_url ? (
              <div
                style={{
                  flex: 1,
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  marginBottom: '20px',
                  minHeight: '70vh',
                }}
              >
                <iframe
                  src={signingData.document_url}
                  title="Document Preview"
                  style={{ width: '100%', height: '100%', minHeight: '70vh', border: 'none', display: 'block' }}
                />
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  minHeight: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed var(--border)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  gap: '12px',
                  color: 'var(--t3)',
                }}
              >
                <img src="/TM-File-negro.svg" className="pxi-xl icon-muted" alt="" />
                <p style={{ fontSize: '14px' }}>No file preview available for this document.</p>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              {signingData.document_url && (
                <a
                  href={signingData.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--t2)',
                    fontSize: '14px',
                    textDecoration: 'none',
                  }}
                >
                  <img src="/TM-Download-negro.svg" className="pxi-sm icon-white" alt="" />
                  Open in new tab
                </a>
              )}
              <button
                onClick={() => setStep('signing')}
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 28px',
                  borderRadius: '8px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Proceed to Sign
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── SIGNING ─────────────────────────────────────────────────────── */}
        {step === 'signing' && signingData && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface)', overflow: 'hidden' }}>

            {/* Top progress bar + actions */}
            <div style={{
              background: 'var(--surface-2)',
              borderBottom: '1px solid var(--border)',
              height: 52,
              display: 'flex',
              alignItems: 'center',
              padding: '0 20px',
              gap: 16,
              flexShrink: 0,
            }}>
              {signingData.document_url && (
                <button
                  onClick={() => setStep('read')}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-3)', color: 'var(--t2)', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}
                >
                  ← Document
                </button>
              )}
              {fields.length > 0 && (
                <>
                  <div style={{ flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <div style={{ height: '100%', width: `${(completedCount / fields.length) * 100}%`, background: 'var(--brand-1)', borderRadius: 3, transition: 'width 0.3s ease' }} />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--t2)', flexShrink: 0 }}>
                    {completedCount} / {fields.length} field{fields.length !== 1 ? 's' : ''}
                  </span>
                </>
              )}
              <button
                onClick={() => setStep('review')}
                disabled={!allRequiredComplete}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: 'none',
                  background: allRequiredComplete ? 'var(--brand-1)' : 'var(--surface-3)',
                  color: allRequiredComplete ? 'white' : 'var(--t3)',
                  fontWeight: 600, fontSize: 14,
                  cursor: allRequiredComplete ? 'pointer' : 'not-allowed',
                  flexShrink: 0,
                }}
              >
                Review & Sign →
              </button>
            </div>

            {/* Page navigation (only shown when doc has multiple pages) */}
            {pageCount > 1 && (
              <div style={{ background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '8px 20px', flexShrink: 0 }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid var(--border)', background: currentPage <= 1 ? 'var(--surface-3)' : 'var(--surface-2)', color: currentPage <= 1 ? 'var(--t3)' : 'var(--t1)', cursor: currentPage <= 1 ? 'default' : 'pointer', fontSize: 18, lineHeight: 1 }}
                >
                  ‹
                </button>
                <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 500 }}>Page {currentPage} of {pageCount}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                  disabled={currentPage >= pageCount}
                  style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid var(--border)', background: currentPage >= pageCount ? 'var(--surface-3)' : 'var(--surface-2)', color: currentPage >= pageCount ? 'var(--t3)' : 'var(--t1)', cursor: currentPage >= pageCount ? 'default' : 'pointer', fontSize: 18, lineHeight: 1 }}
                >
                  ›
                </button>
              </div>
            )}

            {/* Document canvas — PDF iframe with field overlays on top */}
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '24px' }}>
              <div
                style={{
                  position: 'relative',
                  width: 850,
                  height: sheetHeight,
                  background: 'white',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.14)',
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              >
                {/* PDF rendered as iframe (non-interactive background) */}
                {signingData.document_url ? (
                  <iframe
                    key={`sign-p${currentPage}`}
                    src={`${signingData.document_url}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    title="Document"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', pointerEvents: 'none', display: 'block' }}
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 14, fontStyle: 'italic' }}>
                    Page {currentPage}
                  </div>
                )}

                {/* Interactive field overlays */}
                {(fieldsByPage[currentPage] ?? []).map((field) => {
                  const isDone = completedFieldIds.has(field.id);
                  const borderStyle = isDone ? `2px solid #22c55e` : `2px dashed #4F46E5`;
                  const bgDone = 'rgba(34,197,94,0.05)';
                  const bgPending = 'rgba(79,70,229,0.07)';

                  return (
                    <div
                      key={field.id}
                      style={{
                        position: 'absolute',
                        left: `${field.x}%`,
                        top: `${field.y}%`,
                        width: `${field.width}%`,
                        height: `${field.height}%`,
                        minWidth: 60,
                        minHeight: 28,
                        zIndex: 10,
                      }}
                    >
                      {/* Signature — draw canvas modal */}
                      {field.type === 'signature' && (
                        <button
                          onClick={() => setSignatureModalField(field)}
                          style={{
                            width: '100%', height: '100%', minHeight: 40,
                            border: borderStyle, borderRadius: 4,
                            background: isDone ? bgDone : bgPending,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', padding: 0,
                          }}
                        >
                          {isDone && fieldSignatureData[field.id] ? (
                            <img src={fieldSignatureData[field.id]} alt="Signature" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                          ) : (
                            <span style={{ fontSize: 11, color: '#4F46E5', fontWeight: 600 }}>
                              {isDone ? '✓ Signed' : 'Click to sign'}
                            </span>
                          )}
                        </button>
                      )}

                      {/* Initials — text input (typed, not drawn) */}
                      {field.type === 'initial' && (
                        <input
                          type="text"
                          maxLength={5}
                          placeholder="Initials"
                          value={fieldValues[field.id] ?? ''}
                          onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                          onBlur={async () => {
                            const val = (fieldValues[field.id] ?? '').trim();
                            if (val) await handleFieldSubmit(field, val);
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              const val = (fieldValues[field.id] ?? '').trim();
                              if (val) await handleFieldSubmit(field, val);
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          style={{
                            width: '100%', height: '100%', minHeight: 36,
                            padding: '2px 6px',
                            border: borderStyle, borderRadius: 4,
                            background: isDone ? bgDone : bgPending,
                            color: '#111',
                            fontSize: 16, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700,
                            textAlign: 'center',
                            boxSizing: 'border-box', outline: 'none',
                          }}
                        />
                      )}

                      {/* Date */}
                      {field.type === 'date' && (
                        <input
                          type="date"
                          value={fieldValues[field.id] ?? ''}
                          onChange={async (e) => {
                            const val = e.target.value;
                            setFieldValues((prev) => ({ ...prev, [field.id]: val }));
                            if (val) await handleFieldSubmit(field, val);
                          }}
                          style={{
                            width: '100%', height: '100%', minHeight: 36,
                            padding: '4px 8px',
                            border: borderStyle, borderRadius: 4,
                            background: isDone ? bgDone : bgPending,
                            color: '#111', fontSize: 13,
                            boxSizing: 'border-box', outline: 'none',
                          }}
                        />
                      )}

                      {/* Text */}
                      {field.type === 'text' && (
                        <input
                          type="text"
                          placeholder={field.label ?? 'Type here'}
                          value={fieldValues[field.id] ?? ''}
                          onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                          onBlur={async () => {
                            const val = fieldValues[field.id] ?? '';
                            if (val) await handleFieldSubmit(field, val);
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              const val = fieldValues[field.id] ?? '';
                              if (val) await handleFieldSubmit(field, val);
                            }
                          }}
                          style={{
                            width: '100%', height: '100%', minHeight: 36,
                            padding: '4px 8px',
                            border: borderStyle, borderRadius: 4,
                            background: isDone ? bgDone : bgPending,
                            color: '#111', fontSize: 13,
                            boxSizing: 'border-box', outline: 'none',
                          }}
                        />
                      )}

                      {/* Checkbox */}
                      {field.type === 'checkbox' && (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <input
                            type="checkbox"
                            checked={fieldValues[field.id] === 'true'}
                            onChange={async (e) => {
                              const val = e.target.checked ? 'true' : 'false';
                              setFieldValues((prev) => ({ ...prev, [field.id]: val }));
                              await handleFieldSubmit(field, val);
                            }}
                            style={{ width: 22, height: 22, cursor: 'pointer', accentColor: '#4F46E5' }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {!allRequiredComplete && requiredFields.length > 0 && (
              <div style={{ textAlign: 'center', padding: '8px', color: 'var(--t3)', fontSize: 13, flexShrink: 0 }}>
                {requiredFields.length - requiredCompletedCount} required field{requiredFields.length - requiredCompletedCount !== 1 ? 's' : ''} remaining
              </div>
            )}
          </div>
        )}

        {/* ── REVIEW ──────────────────────────────────────────────────────── */}
        {step === 'review' && signingData && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px 24px',
            }}
          >
            <div style={{ maxWidth: '560px', width: '100%' }}>
              <h2 style={{ color: 'var(--t1)', marginBottom: '8px', fontSize: '20px' }}>Review Your Signing</h2>
              <p style={{ color: 'var(--t2)', fontSize: '14px', marginBottom: '28px' }}>
                Please review the fields you completed before finishing.
              </p>

              {/* Summary of completed fields */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--border)',
                    fontWeight: 600,
                    color: 'var(--t1)',
                    fontSize: '14px',
                  }}
                >
                  {completedCount} field{completedCount !== 1 ? 's' : ''} completed
                </div>
                {fields.map((field) => {
                  const done = completedFieldIds.has(field.id);
                  return (
                    <div
                      key={field.id}
                      style={{
                        padding: '12px 18px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '14px',
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: done ? '#22c55e' : 'var(--surface-2)',
                          border: done ? 'none' : '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {done && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                      </div>
                      <span style={{ color: done ? 'var(--t1)' : 'var(--t3)' }}>
                        {field.label ?? field.type.charAt(0).toUpperCase() + field.type.slice(1)} — Page {field.page}
                        {field.required && !done && (
                          <span style={{ color: 'var(--status-red)', marginLeft: '6px', fontSize: '12px' }}>Required</span>
                        )}
                      </span>
                    </div>
                  );
                })}
                {fields.length === 0 && (
                  <div style={{ padding: '16px 18px', color: 'var(--t3)', fontSize: '14px' }}>
                    No fields to complete.
                  </div>
                )}
              </div>

              {/* Legal consent */}
              <label
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  marginBottom: '28px',
                  padding: '16px',
                  background: 'var(--surface)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}
              >
                <input
                  type="checkbox"
                  checked={legalConsent}
                  onChange={(e) => setLegalConsent(e.target.checked)}
                  style={{ marginTop: '2px', accentColor: 'var(--primary)', width: '16px', height: '16px', flexShrink: 0 }}
                />
                <span style={{ fontSize: '13px', color: 'var(--t2)', lineHeight: 1.6 }}>
                  I agree to use electronic records and signatures. I understand that my electronic signature is legally
                  binding and equivalent to a handwritten signature.
                </span>
              </label>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setStep('signing')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--t2)',
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleCompleteSigning}
                  disabled={!legalConsent || !allRequiredComplete || submitting}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: legalConsent && allRequiredComplete ? 'var(--primary)' : 'var(--surface-2)',
                    color: legalConsent && allRequiredComplete ? 'white' : 'var(--t3)',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: legalConsent && allRequiredComplete && !submitting ? 'pointer' : 'not-allowed',
                    opacity: legalConsent && allRequiredComplete && !submitting ? 1 : 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {submitting && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                  Finish Signing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPLETE ────────────────────────────────────────────────────── */}
        {step === 'complete' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              textAlign: 'center',
            }}
          >
            <img src="/The Manager_Iconografia-11.svg" className="pxi-xl icon-green" style={{ marginBottom: '24px' }} alt="" />
            <h2 style={{ color: 'var(--t1)', marginBottom: '12px', fontSize: '24px' }}>Signing Complete</h2>
            <p style={{ color: 'var(--t2)', fontSize: '15px', maxWidth: '400px', lineHeight: 1.6 }}>
              You have successfully signed{signingData?.request.subject ? ` "${signingData.request.subject}"` : ' the document'}.
              A confirmation will be sent to your email.
            </p>
          </div>
        )}

      </main>

      {/* Signature modal */}
      {signatureModalField && (
        <SignatureModal
          fieldType={signatureModalField.type as 'signature' | 'initial'}
          existingData={fieldSignatureData[signatureModalField.id] ?? null}
          onSave={async (dataUrl) => {
            const field = signatureModalField;
            setSignatureModalField(null);
            await handleFieldSubmit(field, 'signed', dataUrl);
            setFieldSignatureData((prev) => ({ ...prev, [field.id]: dataUrl }));
          }}
          onClose={() => setSignatureModalField(null)}
        />
      )}

      {/* CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
