import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Clock, Brain } from 'lucide-react';
import { TMDatePicker } from '../components/ui/TMDatePicker';
import Modal from '../components/Modal';
import SignaturePreparationModal from '../components/legal/SignaturePreparationModal';
import { formatDate } from '../lib/utils';
import * as legalService from '../lib/legalService';
import { getSigningStatusForDocuments } from '../lib/legalService';
import * as signingService from '../lib/signingService';
import type { SigningRequestWithRecipients } from '../lib/signingTypes';

const DOCUMENT_TYPES: legalService.DocumentType[] = ['contract', 'license', 'release', 'agreement', 'other'];
const DOCUMENT_STATUSES: legalService.DocumentStatus[] = ['draft', 'needs_signature', 'signed'];

function getStatusBadge(status: legalService.DocumentStatus) {
  switch (status) {
    case 'signed':          return 'badge-green';
    case 'needs_signature': return 'badge-yellow';
    default:                return 'badge-neutral';
  }
}

function formatStatus(status: legalService.DocumentStatus) {
  switch (status) {
    case 'draft':           return 'Draft';
    case 'needs_signature': return 'Needs Signature';
    case 'signed':          return 'Signed';
  }
}

function DocThumbnail({ type, status, size = 80 }: {
  type: legalService.DocumentType;
  status: legalService.DocumentStatus;
  size?: number;
}) {
  const typeBg: Record<legalService.DocumentType, string> = {
    contract:  'rgba(0, 156, 85, 0.10)',
    license:   'rgba(204, 219, 226, 0.10)',
    release:   'rgba(221, 170, 68, 0.10)',
    agreement: 'rgba(224, 138, 60, 0.10)',
    other:     'var(--surface-3)',
  };
  const statusAccent: Record<legalService.DocumentStatus, string> = {
    signed:          'var(--status-green)',
    needs_signature: 'var(--status-yellow)',
    draft:           'var(--border-3)',
  };
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      background: typeBg[type],
      borderTop: '1px solid var(--border)',
      borderRight: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      borderLeft: `3px solid ${statusAccent[status]}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <img src="/TM-File-negro.svg" style={{ width: size * 0.42, height: size * 0.42, opacity: 0.45 }} alt="" />
    </div>
  );
}

// ── Inline editable text field ─────────────────────────────────────────────
function InlineText({
  value,
  onSave,
  as: Tag = 'p',
  className,
  style,
  placeholder = '—',
  multiline = false,
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
  as?: 'p' | 'h1' | 'span';
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  const commit = async () => {
    if (draft.trim() === value) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(draft.trim()); } finally { setSaving(false); setEditing(false); }
  };

  const cancel = () => { setDraft(value); setEditing(false); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); commit(); }
  };

  if (editing) {
    const sharedStyle: React.CSSProperties = {
      background: 'var(--surface-2)',
      border: '1px solid var(--brand-1)',
      color: 'var(--t1)',
      padding: '4px 8px',
      fontSize: 'inherit',
      fontFamily: 'inherit',
      fontWeight: 'inherit',
      width: '100%',
      outline: 'none',
      boxShadow: '0 0 0 2px var(--brand-1)',
      ...style,
    };
    return multiline ? (
      <textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        rows={3}
        style={{ ...sharedStyle, resize: 'vertical' }}
        disabled={saving}
      />
    ) : (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        style={sharedStyle}
        disabled={saving}
      />
    );
  }

  return (
    <Tag
      className={className}
      style={{
        ...style,
        cursor: 'text',
        borderRadius: 0,
        transition: 'background 120ms',
      }}
      onDoubleClick={() => setEditing(true)}
      title="Double-click to edit"
    >
      {value || <span style={{ color: 'var(--t4)', fontStyle: 'italic' }}>{placeholder}</span>}
      {saving && <Loader2 className="inline w-3 h-3 animate-spin ml-1 opacity-50" />}
    </Tag>
  );
}

// ── Inline status selector ─────────────────────────────────────────────────
function InlineStatus({
  value,
  onSave,
}: {
  value: legalService.DocumentStatus;
  onSave: (v: legalService.DocumentStatus) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const select = async (s: legalService.DocumentStatus) => {
    if (s === value) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    try { await onSave(s); } finally { setSaving(false); }
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className={`status-badge ${getStatusBadge(value)}`}
        onClick={() => setOpen(o => !o)}
        title="Click to change status"
        style={{ cursor: 'pointer' }}
        disabled={saving}
      >
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : formatStatus(value)}
        <img src="/TM-ArrowLeft-negro.svg" className="pxi-sm icon-muted" style={{ transform: 'rotate(-90deg)', marginLeft: 2, opacity: 0.5 }} alt="" />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: 4,
          background: 'var(--surface-2)', border: '1px solid var(--border-2)',
          minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          {DOCUMENT_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => select(s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '8px 12px', textAlign: 'left',
                background: s === value ? 'var(--surface-3)' : 'transparent',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: 'var(--t2)',
                transition: 'background 120ms',
              }}
              onMouseEnter={e => { if (s !== value) (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)'; }}
              onMouseLeave={e => { if (s !== value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span className={`status-badge ${getStatusBadge(s)}`} style={{ pointerEvents: 'none' }}>
                {formatStatus(s)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inline comma-list field (parties / tags) ───────────────────────────────
function InlineList({
  values,
  onSave,
  placeholder = '—',
  renderItem,
}: {
  values: string[];
  onSave: (v: string[]) => Promise<void>;
  placeholder?: string;
  renderItem?: (v: string) => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(values.join(', '));
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(values.join(', ')); }, [values]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  const commit = async () => {
    const next = draft.split(',').map(s => s.trim()).filter(Boolean);
    setEditing(false);
    if (JSON.stringify(next) === JSON.stringify(values)) return;
    setSaving(true);
    try { await onSave(next); } finally { setSaving(false); }
  };

  const cancel = () => { setDraft(values.join(', ')); setEditing(false); };

  if (editing) {
    return (
      <input
        ref={ref}
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Escape') cancel(); if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
        style={{
          background: 'var(--surface-2)', border: '1px solid var(--brand-1)',
          color: 'var(--t1)', padding: '4px 8px', fontSize: 13,
          fontFamily: 'inherit', width: '100%', outline: 'none',
          boxShadow: '0 0 0 2px var(--brand-1)',
        }}
        placeholder="comma, separated"
      />
    );
  }

  if (values.length === 0) {
    return (
      <span
        style={{ color: 'var(--t4)', fontStyle: 'italic', fontSize: 13, cursor: 'text' }}
        onDoubleClick={() => setEditing(true)}
        title="Double-click to edit"
      >
        {placeholder}
      </span>
    );
  }

  return (
    <div
      onDoubleClick={() => setEditing(true)}
      title="Double-click to edit"
      style={{ cursor: 'text' }}
    >
      {renderItem
        ? <div className="flex flex-wrap gap-2">{values.map((v, i) => <React.Fragment key={i}>{renderItem(v)}</React.Fragment>)}</div>
        : <p style={{ color: 'var(--t1)', fontSize: 13 }}>{values.join(', ')}</p>
      }
      {saving && <Loader2 className="inline w-3 h-3 animate-spin ml-1 opacity-50" />}
    </div>
  );
}

// ── Inline date field ──────────────────────────────────────────────────────
function InlineDate({
  value,
  onSave,
  label,
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
  label: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = async (v: string) => {
    setEditing(false);
    if (v === value) return;
    setSaving(true);
    try { await onSave(v); } finally { setSaving(false); }
  };

  if (editing) {
    return (
      <TMDatePicker
        value={draft}
        onChange={v => { setDraft(v); commit(v); }}
        placeholder="No date"
      />
    );
  }

  return (
    <div>
      <label>{label}</label>
      <p
        className="mt-0.5"
        style={{ color: value ? 'var(--t1)' : 'var(--t4)', fontSize: 13, cursor: 'text', fontStyle: value ? 'normal' : 'italic' }}
        onDoubleClick={() => setEditing(true)}
        title="Double-click to edit"
      >
        {value ? formatDate(value) : '—'}
        {saving && <Loader2 className="inline w-3 h-3 animate-spin ml-1 opacity-50" />}
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function LegalDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<legalService.LegalDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [notes, setNotes] = useState<legalService.DocumentNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const [signingStatus, setSigningStatus] = useState<any>(null);
  const [signingDetail, setSigningDetail] = useState<SigningRequestWithRecipients | null>(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [voidingRequest, setVoidingRequest] = useState(false);

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    type: 'contract' as legalService.DocumentType,
    status: 'draft' as legalService.DocumentStatus,
    description: '',
    parties: '',
    tags: '',
    version: '',
    signed_date: '',
    expiry_date: '',
  });

  useEffect(() => {
    if (!id) return;
    loadAll();
  }, [id]);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const document = await legalService.getDocument(id!);
      if (!document) { navigate('/legal'); return; }
      setDoc(document);

      const [docNotes, statuses] = await Promise.all([
        legalService.getDocumentNotes(id!),
        getSigningStatusForDocuments([id!]),
      ]);
      setNotes(docNotes);

      const status = statuses[id!] || null;
      setSigningStatus(status);

      if (status) {
        const detail = await signingService.getSigningRequest(status.signing_request_id);
        if (detail) {
          setSigningDetail(detail);
          if (detail.signed_pdf_path) {
            const url = await signingService.getSignedDocumentUrl(detail.signed_pdf_path);
            if (url) setSignedPdfUrl(url);
          }
        }
      }
    } catch (err) {
      console.error('Error loading document:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Inline save helper ───────────────────────────────────────────────────
  const saveField = async (fields: Partial<legalService.UpdateDocumentData>) => {
    if (!doc) return;
    const updated = await legalService.updateDocument(doc.id, fields);
    setDoc(updated);
  };

  // ── Edit modal ───────────────────────────────────────────────────────────
  const handleOpenEdit = () => {
    if (!doc) return;
    setEditForm({
      title: doc.title,
      type: doc.type,
      status: doc.status,
      description: doc.description || '',
      parties: doc.parties.join(', '),
      tags: doc.tags.join(', '),
      version: doc.version,
      signed_date: doc.signed_date || '',
      expiry_date: doc.expiry_date || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!doc) return;
    setIsSavingEdit(true);
    try {
      const updated = await legalService.updateDocument(doc.id, {
        title: editForm.title,
        type: editForm.type,
        status: editForm.status,
        description: editForm.description,
        parties: editForm.parties.split(',').map(p => p.trim()).filter(Boolean),
        tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        version: editForm.version,
        signed_date: editForm.signed_date || undefined,
        expiry_date: editForm.expiry_date || undefined,
      });
      setDoc(updated);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error saving document:', err);
      alert('Failed to save changes');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAddNote = async () => {
    if (!doc || !newNote.trim()) return;
    setIsSavingNote(true);
    try {
      const note = await legalService.addDocumentNote(doc.id, newNote.trim());
      setNotes(prev => [...prev, note]);
      setNewNote('');
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDownload = async () => {
    if (!doc?.file_url) return;
    try {
      const blob = await legalService.downloadDocumentFile(doc.file_url);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading:', err);
    }
  };

  const handleDelete = async () => {
    if (!doc || !window.confirm('Delete this document? This cannot be undone.')) return;
    try {
      await legalService.deleteDocument(doc.id);
      navigate('/legal');
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document');
    }
  };

  const handleSendReminder = async (signingRequestId: string, recipientId: string) => {
    setSendingReminder(recipientId);
    try {
      await signingService.sendReminder(signingRequestId, recipientId);
    } catch (err) {
      console.error('Error sending reminder:', err);
      alert('Failed to send reminder');
    } finally {
      setSendingReminder(null);
    }
  };

  const handleVoidRequest = async (signingRequestId: string) => {
    if (!window.confirm('Void this signing request? This cannot be undone.')) return;
    setVoidingRequest(true);
    try {
      await signingService.voidSigningRequest(signingRequestId);
      await loadAll();
    } catch (err) {
      console.error('Error voiding request:', err);
      alert('Failed to void signing request');
    } finally {
      setVoidingRequest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--t2)' }}>
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-3 text-sm">Loading document...</span>
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="p-4 md:p-6 space-y-[28px]">

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/legal')}
          className="btn btn-ghost btn-sm btn-icon"
          title="Back to Legal"
        >
          <img src="/TM-ArrowLeft-negro.svg" className="pxi-sm icon-muted" alt="" />
        </button>
        <div className="flex items-center gap-2">
          {doc.file_url && (
            <button onClick={handleDownload} className="btn btn-ghost btn-sm btn-icon" title="Download">
              <img src="/TM-Download-negro.svg" className="pxi-sm icon-muted" alt="" />
            </button>
          )}
          <button onClick={() => setIsSignatureModalOpen(true)} className="btn btn-ghost btn-sm btn-icon" title="Send for Signature">
            <img src="/TM-Send-negro.svg" className="pxi-sm icon-muted" alt="" />
          </button>
          <button onClick={handleOpenEdit} className="btn btn-secondary btn-sm btn-icon" title="Edit">
            <img src="/TM-Pluma-negro.png" className="pxi-sm icon-muted" alt="" />
          </button>
          <button onClick={handleDelete} className="btn btn-ghost btn-sm flex items-center gap-2">
            <img src="/TM-Trash-negro.svg" className="pxi-sm icon-danger" alt="" />
          </button>
        </div>
      </div>

      {/* ── Document header ───────────────────────────────────────── */}
      <div className="tm-card tm-card-padded">
        <div className="flex items-start gap-5">
          <DocThumbnail type={doc.type} status={doc.status} size={80} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <InlineText
                value={doc.title}
                onSave={v => saveField({ title: v })}
                as="h1"
                className="truncate"
                placeholder="Untitled"
              />
              <InlineStatus
                value={doc.status}
                onSave={s => saveField({ status: s })}
              />
              {doc.ai_analysis && (
                <span className="status-badge badge-blue">
                  <Brain className="w-3 h-3" />
                  AI Analyzed
                </span>
              )}
            </div>
            <label className="mt-1 block" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--t3)' }}>
              {doc.type}
            </label>
            <InlineText
              value={doc.description || ''}
              onSave={v => saveField({ description: v })}
              as="p"
              multiline
              className="mt-2"
              style={{ color: 'var(--t2)', fontSize: 14 }}
              placeholder="Add a description…"
            />
          </div>
        </div>
      </div>

      {/* ── Metadata ──────────────────────────────────────────────── */}
      <div className="tm-card">
        <div className="tm-card-header">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>Details</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--t4)', letterSpacing: '0.06em' }}>DOUBLE-CLICK TO EDIT</span>
        </div>
        <div className="tm-card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
            <div>
              <label>Parties</label>
              <div className="mt-0.5">
                <InlineList
                  values={doc.parties}
                  onSave={v => saveField({ parties: v })}
                  placeholder="No parties listed"
                />
              </div>
            </div>
            <div>
              <label>Version</label>
              <InlineText
                value={doc.version}
                onSave={v => saveField({ version: v })}
                as="p"
                className="mt-0.5"
                style={{ color: 'var(--t1)', fontSize: 13 }}
                placeholder="—"
              />
            </div>
            <InlineDate
              value={doc.signed_date || ''}
              onSave={v => saveField({ signed_date: v || undefined })}
              label="Signed Date"
            />
            <InlineDate
              value={doc.expiry_date || ''}
              onSave={v => saveField({ expiry_date: v || undefined })}
              label="Expiry Date"
            />
            {doc.file_name && (
              <div>
                <label>File</label>
                <p className="mt-0.5" style={{ color: 'var(--t1)', fontSize: 13 }}>{doc.file_name}</p>
              </div>
            )}
            <div>
              <label>Added</label>
              <p className="mt-0.5" style={{ color: 'var(--t1)', fontSize: 13 }}>{formatDate(doc.created_at)}</p>
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-2 block">Tags</label>
            <InlineList
              values={doc.tags}
              onSave={v => saveField({ tags: v })}
              placeholder="No tags"
              renderItem={tag => <span className="status-badge badge-neutral">{tag}</span>}
            />
          </div>
        </div>
      </div>

      {/* ── Signing Status ────────────────────────────────────────── */}
      {signingStatus && (
        <div className="tm-card">
          <div className="tm-card-header">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>Signing Status</span>
            <div className="flex items-center gap-2">
              {signingStatus.status === 'completed' && signedPdfUrl && (
                <a
                  href={signedPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm btn-icon"
                  style={{ color: 'var(--status-green)' }}
                  title="Download signed PDF"
                >
                  <img src="/TM-Download-negro.svg" className="pxi-sm icon-green" alt="" />
                </a>
              )}
              {signingStatus.status !== 'voided' && signingStatus.status !== 'completed' && (
                <button
                  onClick={() => handleVoidRequest(signingStatus.signing_request_id)}
                  disabled={voidingRequest}
                  className="btn btn-ghost btn-sm btn-icon"
                  style={{ color: 'var(--status-red)' }}
                  title="Void request"
                >
                  {voidingRequest
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <img src="/TM-Close-negro.svg" className="pxi-sm icon-red" alt="" />
                  }
                </button>
              )}
            </div>
          </div>
          <div className="tm-card-body space-y-2">
            {signingDetail ? (
              signingDetail.recipients.map(recipient => (
                <div
                  key={recipient.id}
                  className="flex items-center justify-between py-2 px-3"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--t1)' }}>{recipient.name}</div>
                    <div className="text-xs" style={{ color: 'var(--t3)' }}>{recipient.email}</div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {recipient.status === 'signed' ? (
                      <div className="flex items-center gap-2">
                        <span className="status-badge badge-green">
                          <img src="/The Manager_Iconografia-11.svg" className="pxi-sm icon-white" alt="" />
                          Signed
                        </span>
                        {recipient.signed_at && (
                          <span className="text-xs" style={{ color: 'var(--t3)' }}>{formatDate(recipient.signed_at)}</span>
                        )}
                      </div>
                    ) : recipient.status === 'declined' ? (
                      <span className="status-badge badge-red">
                        <img src="/TM-Close-negro.svg" className="pxi-sm icon-red" alt="" />
                        Declined
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="status-badge badge-yellow">
                          <Clock className="w-3 h-3" />
                          {recipient.status.charAt(0).toUpperCase() + recipient.status.slice(1)}
                        </span>
                        {signingStatus.status !== 'voided' && (
                          <button
                            onClick={() => handleSendReminder(signingStatus.signing_request_id, recipient.id)}
                            disabled={sendingReminder === recipient.id}
                            className="btn btn-ghost btn-sm btn-icon"
                            title="Send reminder"
                          >
                            {sendingReminder === recipient.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <img src="/TM-Send-negro.svg" className="pxi-sm icon-muted" alt="" />
                            }
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--t3)' }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading recipients...
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AI Analysis ───────────────────────────────────────────── */}
      {doc.ai_analysis && (
        <div className="tm-card">
          <div className="tm-card-header">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>AI Analysis</span>
            <span className="status-badge badge-blue">
              <Brain className="w-3 h-3" />
              AI Generated
            </span>
          </div>
          <div className="tm-card-body space-y-5">
            <p className="text-sm" style={{ color: 'var(--t3)' }}>
              AI-generated analysis. Not a substitute for qualified legal advice.
            </p>
            <div>
              <h3 className="mb-2">Summary</h3>
              <p className="text-sm whitespace-pre-line" style={{ color: 'var(--t2)' }}>{doc.ai_analysis.summary}</p>
            </div>
            {doc.ai_analysis.keyTerms.length > 0 && (
              <div>
                <h3 className="mb-2">Key Terms</h3>
                <div className="space-y-1.5">
                  {doc.ai_analysis.keyTerms.map((term, i) => (
                    <div key={i} className="px-3 py-2 text-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--t2)' }}>
                      {term}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {doc.ai_analysis.risks.length > 0 && (
              <div>
                <h3 className="mb-2">Risks</h3>
                <div className="space-y-1.5">
                  {doc.ai_analysis.risks.map((risk, i) => (
                    <div key={i} className="px-3 py-2 text-sm" style={{ background: 'var(--status-red-bg)', border: '1px solid rgba(221,85,85,0.2)', color: 'var(--status-red)' }}>
                      {risk}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {doc.ai_analysis.recommendations.length > 0 && (
              <div>
                <h3 className="mb-2">Recommendations</h3>
                <div className="space-y-1.5">
                  {doc.ai_analysis.recommendations.map((rec, i) => (
                    <div key={i} className="px-3 py-2 text-sm" style={{ background: 'var(--status-green-bg)', border: '1px solid rgba(0,156,85,0.2)', color: 'var(--status-green)' }}>
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Notes ─────────────────────────────────────────────────── */}
      <div className="tm-card">
        <div className="tm-card-header">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t3)' }}>Notes</span>
        </div>
        <div className="tm-card-body space-y-3">
          {notes.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--t3)' }}>No notes yet.</p>
          )}
          {notes.map(note => (
            <div key={note.id} className="px-4 py-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--t1)' }}>{note.content}</p>
              <div className="mt-1.5 flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <span>{note.author?.full_name || note.author?.email || 'Unknown'}</span>
                <span>·</span>
                <span>{formatDate(note.created_at)}</span>
              </div>
            </div>
          ))}
          <div className="pt-2 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              rows={3}
              placeholder="Add a note..."
              className="block w-full"
              style={{ background: 'var(--surface-2)', color: 'var(--t1)', border: '1px solid var(--border)', padding: '10px 12px', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }}
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || isSavingNote}
                className="btn btn-primary btn-sm btn-icon"
                title="Add note"
              >
                {isSavingNote
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <img src="/The Manager_Iconografia-11.svg" className="pxi-sm icon-white" alt="" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Modal (fallback full edit) ───────────────────────── */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Document">
        <div className="space-y-4">
          <div className="form-field">
            <label>Title</label>
            <input
              type="text"
              value={editForm.title}
              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
            />
          </div>
          <div className="form-row-2">
            <div className="form-field">
              <label>Type</label>
              <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value as legalService.DocumentType })}>
                {DOCUMENT_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Status</label>
              <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as legalService.DocumentStatus })}>
                {DOCUMENT_STATUSES.map(s => (
                  <option key={s} value={s}>{formatStatus(s)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-field">
            <label>Description</label>
            <textarea
              value={editForm.description}
              onChange={e => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-field">
            <label>Parties (comma-separated)</label>
            <input
              type="text"
              value={editForm.parties}
              onChange={e => setEditForm({ ...editForm, parties: e.target.value })}
              placeholder="Party 1, Party 2"
            />
          </div>
          <div className="form-field">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              value={editForm.tags}
              onChange={e => setEditForm({ ...editForm, tags: e.target.value })}
              placeholder="tag1, tag2"
            />
          </div>
          <div className="form-row-3">
            <div className="form-field">
              <label>Version</label>
              <input
                type="text"
                value={editForm.version}
                onChange={e => setEditForm({ ...editForm, version: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Signed Date</label>
              <TMDatePicker
                value={editForm.signed_date}
                onChange={v => setEditForm({ ...editForm, signed_date: v })}
                placeholder="No date"
              />
            </div>
            <div className="form-field">
              <label>Expiry Date</label>
              <TMDatePicker
                value={editForm.expiry_date}
                onChange={v => setEditForm({ ...editForm, expiry_date: v })}
                placeholder="No date"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary btn-md">Cancel</button>
            <button
              onClick={handleSaveEdit}
              disabled={!editForm.title.trim() || isSavingEdit}
              className="btn btn-primary btn-md flex items-center gap-2"
            >
              {isSavingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Signature Modal ───────────────────────────────────────── */}
      <SignaturePreparationModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        document={doc}
      />
    </div>
  );
}
