import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, Loader2,
  FileSignature as Sig, Edit3, Calendar, Type, CheckSquare,
  ChevronLeft, ChevronRight, Users,
} from 'lucide-react';
import { TMDatePicker } from '../ui/TMDatePicker';
import { supabase } from '../../lib/supabase';
import * as signingService from '../../lib/signingService';
import { getPdfFirstPageSize } from '../../lib/pdfPageSize';
import type { SigningOrder } from '../../lib/signingTypes';
import type { LegalDocument as ServiceLegalDocument } from '../../lib/legalService';
import { getContacts, createContact, formatContactName } from '../../lib/contacts';
import type { Contact } from '../../types/contacts';

// ─── Constants ────────────────────────────────────────────────────────────────

const SIGNER_COLORS = ['#4F46E5', '#059669', '#EA580C', '#7C3AED', '#DC2626', '#0891B2'];

type FieldType = 'signature' | 'initial' | 'date' | 'text' | 'checkbox';

const FIELD_PALETTE: { type: FieldType; label: string; icon: React.ReactNode; w: number; h: number }[] = [
  { type: 'signature', label: 'Signature', icon: <Sig size={14} />,        w: 22, h: 7 },
  { type: 'initial',   label: 'Initials',  icon: <Edit3 size={14} />,      w: 10, h: 7 },
  { type: 'date',      label: 'Date',      icon: <Calendar size={14} />,   w: 15, h: 5 },
  { type: 'text',      label: 'Text',      icon: <Type size={14} />,       w: 20, h: 5 },
  { type: 'checkbox',  label: 'Checkbox',  icon: <CheckSquare size={14} />, w: 4,  h: 4 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface SField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  page: number;
  x: number;      // % of overlay width
  y: number;      // % of overlay height
  width: number;  // % of overlay width
  height: number; // % of overlay height
  recipientId: string;
}

interface Signer {
  id: string;
  name: string;
  email: string;
  role: string;
  color: string;
  contactId?: string; // set when picked from Team database
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: ServiceLegalDocument | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SignaturePreparationModal({ isOpen, onClose, document: doc }: Props) {
  const [step, setStep] = useState<'recipients' | 'editor' | 'done'>('recipients');
  const [signers, setSigners] = useState<Signer[]>([
    { id: '1', name: '', email: '', role: '', color: SIGNER_COLORS[0] },
  ]);
  const [fields, setFields] = useState<SField[]>([]);
  const [activeSignerId, setActiveSignerId] = useState('1');
  const [paletteType, setPaletteType] = useState<FieldType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('Please review and sign this document at your earliest convenience.');
  const [signingOrder, setSigningOrder] = useState<SigningOrder>('parallel');
  const [expiresAt, setExpiresAt] = useState('');
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  // Height of the document sheet in pixels, sized to match the actual PDF aspect ratio
  const [sheetHeight, setSheetHeight] = useState(1100);
  const [isSending, setIsSending] = useState(false);
  const [dragging, setDragging] = useState<{
    fieldId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // Contact search state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [signerSearch, setSignerSearch] = useState<Record<string, string>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // CC state
  const [ccList, setCcList] = useState<Array<{ id: string; name: string; email: string; role: string; contactId?: string }>>([]);
  const [ccSearch, setCcSearch] = useState<Record<string, string>>({});
  const [ccDropdownOpen, setCcDropdownOpen] = useState<string | null>(null);
  const [ccDragIndex, setCcDragIndex] = useState<number | null>(null);
  const [ccDragOverIndex, setCcDragOverIndex] = useState<number | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  // Load contacts once when modal opens
  useEffect(() => {
    if (isOpen) {
      getContacts().then(setContacts).catch(() => {});
    }
  }, [isOpen]);

  // Load signed URL + reset on open/close
  useEffect(() => {
    if (isOpen) {
      setEmailSubject(`Please sign: ${doc?.title || 'Document'}`);
      if (doc?.file_url) {
        const path = doc.file_url.split('/').pop();
        if (path) {
          supabase.storage
            .from('legal-documents')
            .createSignedUrl(path, 3600)
            .then(({ data }) => {
              if (data?.signedUrl) {
                setDocumentUrl(data.signedUrl);
                // Detect actual page dimensions so the overlay matches the rendered PDF
                getPdfFirstPageSize(data.signedUrl, 850)
                  .then(({ heightPx }) => setSheetHeight(heightPx))
                  .catch(() => setSheetHeight(1100)); // fall back to portrait default
              }
            });
        }
      }
    } else {
      setStep('recipients');
      setSigners([{ id: '1', name: '', email: '', role: '', color: SIGNER_COLORS[0] }]);
      setFields([]);
      setActiveSignerId('1');
      setPaletteType(null);
      setCurrentPage(1);
      setDocumentUrl(null);
      setIsSending(false);
      setDragging(null);
      setEmailMessage('Please review and sign this document at your earliest convenience.');
      setExpiresAt('');
      setSigningOrder('parallel');
      setSheetHeight(1100);
      setSignerSearch({});
      setOpenDropdown(null);
      setCcList([]);
      setCcSearch({});
      setCcDropdownOpen(null);
      setCcDragIndex(null);
      setCcDragOverIndex(null);
    }
  }, [isOpen]);

  // ── Signer drag-to-reorder ─────────────────────────────────────────────────

  const [signerDragIndex, setSignerDragIndex] = useState<number | null>(null);
  const [signerDragOverIndex, setSignerDragOverIndex] = useState<number | null>(null);

  const handleSignerDragStart = (e: React.DragEvent, index: number) => {
    setSignerDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent ghost image so we control the visual via CSS
    const ghost = document.createElement('div');
    ghost.style.position = 'absolute';
    ghost.style.top = '-9999px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleSignerDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index !== signerDragIndex) setSignerDragOverIndex(index);
  };

  const handleSignerDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (signerDragIndex === null || signerDragIndex === toIndex) return;
    setSigners(prev => {
      const next = [...prev];
      const [moved] = next.splice(signerDragIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setSignerDragIndex(null);
    setSignerDragOverIndex(null);
  };

  const handleSignerDragEnd = () => {
    setSignerDragIndex(null);
    setSignerDragOverIndex(null);
  };

  // ── CC drag-to-reorder ─────────────────────────────────────────────────────

  const handleCcDragStart = (e: React.DragEvent, index: number) => {
    setCcDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    const ghost = document.createElement('div');
    ghost.style.position = 'absolute';
    ghost.style.top = '-9999px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleCcDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index !== ccDragIndex) setCcDragOverIndex(index);
  };

  const handleCcDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (ccDragIndex === null || ccDragIndex === toIndex) return;
    setCcList(prev => {
      const next = [...prev];
      const [moved] = next.splice(ccDragIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setCcDragIndex(null);
    setCcDragOverIndex(null);
  };

  const handleCcDragEnd = () => {
    setCcDragIndex(null);
    setCcDragOverIndex(null);
  };

  // ── Signer management ──────────────────────────────────────────────────────

  const addSigner = () => {
    const n = signers.length;
    const id = `s-${Date.now()}`;
    setSigners(prev => [...prev, { id, name: '', email: '', role: '', color: SIGNER_COLORS[n % SIGNER_COLORS.length] }]);
    setActiveSignerId(id);
  };

  const removeSigner = (id: string) => {
    if (signers.length <= 1) return;
    setSigners(prev => prev.filter(s => s.id !== id));
    setFields(prev => prev.filter(f => f.recipientId !== id));
    if (activeSignerId === id) setActiveSignerId(signers.find(s => s.id !== id)!.id);
  };

  const updateSigner = (id: string, u: Partial<Signer>) =>
    setSigners(prev => prev.map(s => (s.id === id ? { ...s, ...u } : s)));

  // ── Field management ───────────────────────────────────────────────────────

  const placeField = (cx: number, cy: number, type: FieldType) => {
    const pal = FIELD_PALETTE.find(p => p.type === type)!;
    const f: SField = {
      id: `f-${++idRef.current}`,
      type,
      label: pal.label,
      required: true,
      page: currentPage,
      x: Math.max(0, Math.min(cx - pal.w / 2, 100 - pal.w)),
      y: Math.max(0, Math.min(cy - pal.h / 2, 100 - pal.h)),
      width: pal.w,
      height: pal.h,
      recipientId: activeSignerId,
    };
    setFields(prev => [...prev, f]);
    setPaletteType(null);
  };

  const removeField = (id: string) => setFields(prev => prev.filter(f => f.id !== id));

  const updateField = (id: string, u: Partial<SField>) =>
    setFields(prev => prev.map(f => (f.id === id ? { ...f, ...u } : f)));

  // ── Overlay interaction ────────────────────────────────────────────────────

  const toPercent = (e: React.MouseEvent) => {
    if (!overlayRef.current) return null;
    const r = overlayRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    };
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (dragging) { setDragging(null); return; }
    if (!paletteType) return;
    const p = toPercent(e);
    if (p) placeField(p.x, p.y, paletteType);
  };

  const startDrag = (e: React.MouseEvent, field: SField) => {
    e.stopPropagation();
    const p = toPercent(e);
    if (!p) return;
    setDragging({ fieldId: field.id, startX: p.x, startY: p.y, origX: field.x, origY: field.y });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const p = toPercent(e);
    if (!p) return;
    const f = fields.find(f => f.id === dragging.fieldId);
    if (!f) return;
    updateField(dragging.fieldId, {
      x: Math.max(0, Math.min(dragging.origX + (p.x - dragging.startX), 100 - f.width)),
      y: Math.max(0, Math.min(dragging.origY + (p.y - dragging.startY), 100 - f.height)),
    });
  };

  const onMouseUp = () => setDragging(null);

  // ── Send ───────────────────────────────────────────────────────────────────

  // Auto-save new signers + CC contacts (not already in Team) to the contacts database
  const saveNewSignersToTeam = async () => {
    const nameEmailToContact = (name: string, email: string, role?: string) => {
      const parts = name.trim().split(' ');
      const firstName = parts[0] || name.trim();
      const lastName = parts.slice(1).join(' ') || '.';
      return createContact({
        category: 'other',
        firstName,
        lastName,
        email: email.trim(),
        role: role?.trim() || undefined,
        socialLinks: {},
        proAffiliations: [],
        publisherAffiliations: [],
        tags: [],
      });
    };

    const newSigners = signers.filter(s => !s.contactId && s.name.trim() && s.email.trim());
    const newCc = ccList.filter(c => !c.contactId && c.name.trim() && c.email.trim());

    await Promise.allSettled([
      ...newSigners.map(s => nameEmailToContact(s.name, s.email, s.role)),
      ...newCc.map(c => nameEmailToContact(c.name, c.email, c.role)),
    ]);
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      await saveNewSignersToTeam();
      await signingService.createSigningRequest({
        document_id: doc?.id || '',
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
        cc: ccList.filter(c => c.email.trim()).map(c => ({ name: c.name, email: c.email })),
        fields: fields.map(f => ({
          recipient_temp_id: f.recipientId,
          type: f.type,
          page: f.page,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          required: f.required,
          label: f.label,
        })),
      });
      setStep('done');
    } catch (err: any) {
      alert('Failed to send: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const canProceed = signers.every(s => s.name.trim() && s.email.trim());
  const activeSigner = signers.find(s => s.id === activeSignerId);
  const pageFields = fields.filter(f => f.page === currentPage);

  // ── DONE step ──────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <img src="/The Manager_Iconografia-11.svg" className="pxi-xl icon-green" alt="" />
          </div>
          <h2 style={{ color: 'var(--t1)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Sent for Signature</h2>
          <p style={{ color: 'var(--t2)', fontSize: 15, maxWidth: 380, lineHeight: 1.6, margin: '0 auto 28px' }}>
            {signers.map(s => s.name).join(', ')} {signers.length === 1 ? 'has' : 'have'} been notified by email with a link to review and sign.
          </p>
          <button
            onClick={onClose}
            style={{ padding: '12px 32px', borderRadius: 8, background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── RECIPIENTS step ────────────────────────────────────────────────────────
  if (step === 'recipients') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', gap: 12, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '6px 8px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--t2)', display: 'flex' }}>
            <img src="/TM-Close-negro.svg" className="pxi-lg icon-muted" alt="" />
          </button>
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
          <img src="/TM-File-negro.svg" className="pxi-md icon-muted" alt="" style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--t1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc?.title}</span>
          <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--t3)', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>1. Recipients</span>
            <ChevronRight size={12} />
            <span>2. Place Fields</span>
            <ChevronRight size={12} />
            <span>3. Send</span>
          </div>
          <button
            onClick={() => setStep('editor')}
            disabled={!canProceed}
            style={{ padding: '8px 20px', borderRadius: 8, background: canProceed ? 'var(--primary)' : 'var(--surface-2)', color: canProceed ? 'white' : 'var(--t3)', border: 'none', fontWeight: 600, fontSize: 14, cursor: canProceed ? 'pointer' : 'not-allowed', opacity: canProceed ? 1 : 0.6 }}
          >
            Next →
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ width: '100%', maxWidth: 660 }}>

            {/* Recipients */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ color: 'var(--t1)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Add Recipients</h2>
              <p style={{ color: 'var(--t3)', fontSize: 14, marginBottom: 20 }}>Who needs to sign this document?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {signers.map((signer, i) => {
                  const isDraggingThis = signerDragIndex === i;
                  const isDropTarget  = signerDragOverIndex === i && signerDragIndex !== i;
                  const query = signerSearch[signer.id] ?? '';
                  const isDropdownOpen = openDropdown === signer.id;
                  const filteredContacts = query.trim().length > 0
                    ? contacts.filter(c => {
                        const fullName = formatContactName(c).toLowerCase();
                        const email = (c.email ?? '').toLowerCase();
                        const q = query.toLowerCase();
                        return fullName.includes(q) || email.includes(q);
                      }).slice(0, 6)
                    : [];

                  const selectContact = (c: Contact) => {
                    updateSigner(signer.id, {
                      name: formatContactName(c),
                      email: c.email ?? '',
                      role: c.role ?? '',
                      contactId: c.id,
                    });
                    setSignerSearch(prev => ({ ...prev, [signer.id]: '' }));
                    setOpenDropdown(null);
                  };

                  const clearContact = () => {
                    updateSigner(signer.id, { name: '', email: '', role: '', contactId: undefined });
                    setSignerSearch(prev => ({ ...prev, [signer.id]: '' }));
                  };

                  return (
                  <div
                    key={signer.id}
                    draggable
                    onDragStart={e => handleSignerDragStart(e, i)}
                    onDragOver={e => handleSignerDragOver(e, i)}
                    onDrop={e => handleSignerDrop(e, i)}
                    onDragEnd={handleSignerDragEnd}
                    style={{
                      display: 'flex', gap: 12, padding: 16,
                      background: 'var(--surface)',
                      border: `1px solid ${isDropTarget ? 'var(--brand-1)' : 'var(--border)'}`,
                      borderLeft: `4px solid ${signer.color}`,
                      borderRadius: 10,
                      opacity: isDraggingThis ? 0.4 : 1,
                      transition: 'opacity 120ms, border-color 120ms',
                      cursor: 'grab',
                    }}
                  >
                    {/* Drag grip */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3, flexShrink: 0, cursor: 'grab', paddingRight: 2, opacity: 0.3 }}>
                      {[0,1,2].map(row => (
                        <div key={row} style={{ display: 'flex', gap: 3 }}>
                          <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--t2)' }} />
                          <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--t2)' }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: signer.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 2 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

                      {/* ── Contact search ── */}
                      {signer.contactId ? (
                        /* Selected from Team */
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: signer.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                            {signer.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{signer.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--t3)' }}>{signer.email}</div>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--status-green)', border: '1px solid var(--status-green)', padding: '2px 6px', flexShrink: 0 }}>
                            From Team
                          </span>
                          <button onClick={clearContact} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }} title="Change">
                            <img src="/TM-Close-negro.svg" className="pxi-sm icon-muted" alt="Remove" />
                          </button>
                        </div>
                      ) : (
                        /* Search input */
                        <div style={{ position: 'relative' }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'var(--font-mono)' }}>
                            Search Team or enter name
                          </label>
                          <div style={{ position: 'relative' }}>
                            <img src="/TM-Search-negro.svg" className="pxi-sm icon-muted" alt="" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            <input
                              type="text"
                              value={query || signer.name}
                              onChange={e => {
                                const val = e.target.value;
                                setSignerSearch(prev => ({ ...prev, [signer.id]: val }));
                                updateSigner(signer.id, { name: val, contactId: undefined });
                                setOpenDropdown(val.trim() ? signer.id : null);
                              }}
                              onFocus={() => { if ((query || signer.name).trim()) setOpenDropdown(signer.id); }}
                              onBlur={() => setTimeout(() => setOpenDropdown(null), 150)}
                              placeholder="Type a name or email…"
                              style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--t1)', fontSize: 14, boxSizing: 'border-box' }}
                            />
                          </div>
                          {/* Dropdown */}
                          {isDropdownOpen && (filteredContacts.length > 0 || query.trim()) && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--surface-2)', border: '1px solid var(--border-2)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', marginTop: 2 }}>
                              {filteredContacts.map(c => (
                                <button
                                  key={c.id}
                                  onMouseDown={() => selectContact(c)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                >
                                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--surface-3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--t2)', flexShrink: 0 }}>
                                    {c.firstName[0]}{c.lastName[0]}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 13, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatContactName(c)}</div>
                                    {c.email && <div style={{ fontSize: 11, color: 'var(--t3)' }}>{c.email}</div>}
                                  </div>
                                  {c.role && <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--t4)', flexShrink: 0 }}>{c.role}</span>}
                                </button>
                              ))}
                              {filteredContacts.length === 0 && query.trim() && (
                                <div style={{ padding: '9px 12px', fontSize: 12, color: 'var(--t3)', fontStyle: 'italic' }}>
                                  No team members found — will be added to Team on send
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Email (shown when not from Team) */}
                      {!signer.contactId && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'var(--font-mono)' }}>Email *</label>
                            <input
                              type="email"
                              value={signer.email}
                              onChange={e => updateSigner(signer.id, { email: e.target.value })}
                              placeholder="john@example.com"
                              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--t1)', fontSize: 14, boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'var(--font-mono)' }}>Role (optional)</label>
                            <input
                              type="text"
                              value={signer.role}
                              onChange={e => updateSigner(signer.id, { role: e.target.value })}
                              placeholder="e.g., Artist, Manager"
                              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--t1)', fontSize: 14, boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Role (shown when from Team, editable) */}
                      {signer.contactId && (
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'var(--font-mono)' }}>Role (optional)</label>
                          <input
                            type="text"
                            value={signer.role}
                            onChange={e => updateSigner(signer.id, { role: e.target.value })}
                            placeholder="e.g., Artist, Manager"
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--t1)', fontSize: 14, boxSizing: 'border-box' }}
                          />
                        </div>
                      )}

                      {/* New contact notice */}
                      {!signer.contactId && signer.name.trim() && signer.email.trim() && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>
                          <img src="/The Manager_Iconografia-11.svg" className="pxi-sm icon-muted" alt="" style={{ opacity: 0.5 }} />
                          Will be added to Team on send
                        </div>
                      )}

                    </div>
                    {signers.length > 1 && (
                      <button onClick={() => removeSigner(signer.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', alignSelf: 'flex-start', padding: 4 }}>
                        <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                      </button>
                    )}
                  </div>
                  );
                })}
                <button
                  onClick={addSigner}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 8, border: '1px dashed var(--border)', background: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
                >
                  <Plus size={15} />
                  Add Another Recipient
                </button>
              </div>
            </div>

            {/* ── CC Recipients ──────────────────────────────────── */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ marginBottom: 12 }}>
                <h2 style={{ color: 'var(--t1)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>CC</h2>
                <p style={{ color: 'var(--t3)', fontSize: 14, marginBottom: 20 }}>These people receive copies of all signing emails but won't be asked to sign.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ccList.map((cc, i) => {
                  const isDraggingThis = ccDragIndex === i;
                  const isDropTarget  = ccDragOverIndex === i && ccDragIndex !== i;
                  const q = ccSearch[cc.id] ?? '';
                  const isDropdownOpen = ccDropdownOpen === cc.id;
                  const filtered = q.trim().length > 0
                    ? contacts.filter(c => {
                        const fullName = formatContactName(c).toLowerCase();
                        const email = (c.email ?? '').toLowerCase();
                        const qLow = q.toLowerCase();
                        return fullName.includes(qLow) || email.includes(qLow);
                      }).slice(0, 6)
                    : [];

                  const selectCcContact = (c: Contact) => {
                    setCcList(prev => prev.map(item => item.id === cc.id
                      ? { ...item, name: formatContactName(c), email: c.email ?? '', role: c.role ?? '', contactId: c.id }
                      : item
                    ));
                    setCcSearch(prev => ({ ...prev, [cc.id]: '' }));
                    setCcDropdownOpen(null);
                  };

                  const clearCc = () => {
                    setCcList(prev => prev.map(item => item.id === cc.id
                      ? { ...item, name: '', email: '', role: '', contactId: undefined }
                      : item
                    ));
                    setCcSearch(prev => ({ ...prev, [cc.id]: '' }));
                  };

                  return (
                    <div
                      key={cc.id}
                      draggable
                      onDragStart={e => handleCcDragStart(e, i)}
                      onDragOver={e => handleCcDragOver(e, i)}
                      onDrop={e => handleCcDrop(e, i)}
                      onDragEnd={handleCcDragEnd}
                      style={{
                        display: 'flex', gap: 12, padding: 16,
                        background: 'var(--surface)',
                        border: `1px solid ${isDropTarget ? 'var(--brand-1)' : 'var(--border)'}`,
                        borderLeft: '4px solid var(--status-blue)',
                        borderRadius: 10,
                        opacity: isDraggingThis ? 0.4 : 1,
                        transition: 'opacity 120ms, border-color 120ms',
                        cursor: 'grab',
                      }}
                    >
                      {/* Drag grip */}
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3, flexShrink: 0, cursor: 'grab', paddingRight: 2, opacity: 0.3 }}>
                        {[0,1,2].map(row => (
                          <div key={row} style={{ display: 'flex', gap: 3 }}>
                            <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--t2)' }} />
                            <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--t2)' }} />
                          </div>
                        ))}
                      </div>

                      {/* CC label avatar */}
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--status-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg)', fontWeight: 700, fontSize: 10, flexShrink: 0, marginTop: 2, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                        CC
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

                        {/* ── Contact search / selected ── */}
                        {cc.contactId ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--status-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg)', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                              {cc.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cc.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--t3)' }}>{cc.email}</div>
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--status-green)', border: '1px solid var(--status-green)', padding: '2px 6px', flexShrink: 0 }}>
                              From Team
                            </span>
                            <button onClick={clearCc} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }} title="Change">
                              <img src="/TM-Close-negro.svg" className="pxi-sm icon-muted" alt="Remove" />
                            </button>
                          </div>
                        ) : (
                          <div style={{ position: 'relative' }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'var(--font-mono)' }}>
                              Search Team or enter name
                            </label>
                            <div style={{ position: 'relative' }}>
                              <img src="/TM-Search-negro.svg" className="pxi-sm icon-muted" alt="" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                              <input
                                type="text"
                                value={q || cc.name}
                                onChange={e => {
                                  const val = e.target.value;
                                  setCcSearch(prev => ({ ...prev, [cc.id]: val }));
                                  setCcList(prev => prev.map(item => item.id === cc.id ? { ...item, name: val, contactId: undefined } : item));
                                  setCcDropdownOpen(val.trim() ? cc.id : null);
                                }}
                                onFocus={() => { if ((q || cc.name).trim()) setCcDropdownOpen(cc.id); }}
                                onBlur={() => setTimeout(() => setCcDropdownOpen(null), 150)}
                                placeholder="Type a name or email…"
                                style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--t1)', fontSize: 14, boxSizing: 'border-box' }}
                              />
                            </div>
                            {isDropdownOpen && (filtered.length > 0 || q.trim()) && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--surface-2)', border: '1px solid var(--border-2)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', marginTop: 2 }}>
                                {filtered.map(c => (
                                  <button
                                    key={c.id}
                                    onMouseDown={() => selectCcContact(c)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                  >
                                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--surface-3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--t2)', flexShrink: 0 }}>
                                      {c.firstName[0]}{c.lastName[0]}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontSize: 13, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatContactName(c)}</div>
                                      {c.email && <div style={{ fontSize: 11, color: 'var(--t3)' }}>{c.email}</div>}
                                    </div>
                                    {c.role && <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--t4)', flexShrink: 0 }}>{c.role}</span>}
                                  </button>
                                ))}
                                {filtered.length === 0 && q.trim() && (
                                  <div style={{ padding: '9px 12px', fontSize: 12, color: 'var(--t3)', fontStyle: 'italic' }}>
                                    No team members found — will be added to Team on send
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Email + Role (when not from Team) */}
                        {!cc.contactId && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'var(--font-mono)' }}>Email *</label>
                              <input
                                type="email"
                                value={cc.email}
                                onChange={e => setCcList(prev => prev.map(item => item.id === cc.id ? { ...item, email: e.target.value } : item))}
                                placeholder="john@example.com"
                                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--t1)', fontSize: 14, boxSizing: 'border-box' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'var(--font-mono)' }}>Role (optional)</label>
                              <input
                                type="text"
                                value={cc.role}
                                onChange={e => setCcList(prev => prev.map(item => item.id === cc.id ? { ...item, role: e.target.value } : item))}
                                placeholder="e.g., Artist, Manager"
                                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--t1)', fontSize: 14, boxSizing: 'border-box' }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Role (when from Team, editable) */}
                        {cc.contactId && (
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'var(--font-mono)' }}>Role (optional)</label>
                            <input
                              type="text"
                              value={cc.role}
                              onChange={e => setCcList(prev => prev.map(item => item.id === cc.id ? { ...item, role: e.target.value } : item))}
                              placeholder="e.g., Artist, Manager"
                              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--t1)', fontSize: 14, boxSizing: 'border-box' }}
                            />
                          </div>
                        )}

                        {/* New contact notice */}
                        {!cc.contactId && cc.name.trim() && cc.email.trim() && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>
                            <img src="/The Manager_Iconografia-11.svg" className="pxi-sm icon-muted" alt="" style={{ opacity: 0.5 }} />
                            Will be added to Team on send
                          </div>
                        )}
                      </div>

                      {/* Remove */}
                      <button onClick={() => setCcList(prev => prev.filter(item => item.id !== cc.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', alignSelf: 'flex-start', padding: 4 }}>
                        <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => {
                    const id = `cc-${Date.now()}`;
                    setCcList(prev => [...prev, { id, name: '', email: '', role: '' }]);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 8, border: '1px dashed var(--border)', background: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
                >
                  <Plus size={15} />
                  Add CC Recipient
                </button>
              </div>
            </div>

            {/* Signing order */}
            <div style={{ marginBottom: 24, padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <h3 style={{ color: 'var(--t1)', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Signing Order</h3>
              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                {(['parallel', 'sequential'] as SigningOrder[]).map(order => (
                  <button
                    key={order}
                    onClick={() => setSigningOrder(order)}
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: 8,
                      border: `2px solid ${signingOrder === order ? 'var(--primary)' : 'var(--border)'}`,
                      background: signingOrder === order ? 'rgba(99,102,241,0.08)' : 'var(--surface-2)',
                      color: signingOrder === order ? 'var(--primary)' : 'var(--t2)',
                      cursor: 'pointer', fontSize: 14, fontWeight: signingOrder === order ? 700 : 400,
                    }}
                  >
                    {order.charAt(0).toUpperCase() + order.slice(1)}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>
                {signingOrder === 'parallel'
                  ? 'All recipients receive the document at the same time.'
                  : 'Recipients sign one at a time in the order listed.'}
              </p>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 24, padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <h3 style={{ color: 'var(--t1)', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Email to Recipients</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--t1)', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Message</label>
                  <textarea
                    value={emailMessage}
                    onChange={e => setEmailMessage(e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--t1)', fontSize: 14, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
            </div>

            {/* Expiry */}
            <div style={{ marginBottom: 32, padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <h3 style={{ color: 'var(--t1)', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Expiry Date <span style={{ fontWeight: 400, color: 'var(--t3)' }}>(optional)</span></h3>
              <TMDatePicker value={expiresAt} onChange={(date) => setExpiresAt(date)} />
            </div>

            <button
              onClick={() => setStep('editor')}
              disabled={!canProceed}
              style={{ width: '100%', padding: 14, borderRadius: 10, background: canProceed ? 'var(--primary)' : 'var(--surface-2)', color: canProceed ? 'white' : 'var(--t3)', border: 'none', fontWeight: 700, fontSize: 16, cursor: canProceed ? 'pointer' : 'not-allowed', opacity: canProceed ? 1 : 0.6 }}
            >
              Continue — Place Signature Fields →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── EDITOR step ────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Top bar */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', gap: 12, flexShrink: 0 }}>
        <button onClick={onClose} style={{ padding: '6px 8px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex' }}>
          <img src="/TM-Close-negro.svg" className="pxi-lg icon-muted" alt="" />
        </button>
        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
        <img src="/TM-File-negro.svg" className="pxi-md icon-muted" alt="" style={{ flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--t1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc?.title}</span>
        <div style={{ display: 'flex', gap: 8, fontSize: 12, alignItems: 'center', color: 'var(--t3)', flexShrink: 0 }}>
          <button onClick={() => setStep('recipients')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 12, padding: 0 }}>
            <Users size={12} style={{ display: 'inline', marginRight: 4 }} />1. Recipients
          </button>
          <ChevronRight size={12} />
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>2. Place Fields</span>
          <ChevronRight size={12} />
          <span>3. Send</span>
        </div>
        <button
          onClick={handleSend}
          disabled={isSending}
          style={{ padding: '8px 22px', borderRadius: 8, background: 'var(--brand-1)', color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: isSending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: isSending ? 0.7 : 1, flexShrink: 0 }}
        >
          {isSending ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <img src="/TM-Send-negro.svg" className="pxi-md icon-white" alt="" />}
          Send
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left sidebar ─────────────────────────────────────────────────── */}
        <div style={{ width: 256, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>

          {/* Signers */}
          <div style={{ padding: '16px 14px 0' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Signers</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {signers.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSignerId(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8,
                    border: `1.5px solid ${activeSignerId === s.id ? s.color : 'var(--border)'}`,
                    background: activeSignerId === s.id ? `${s.color}14` : 'var(--surface-2)',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>{s.name[0]?.toUpperCase() || '?'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name || 'Unnamed'}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.role || s.email}</div>
                  </div>
                  <span style={{ fontSize: 10, background: 'var(--surface-3)', borderRadius: 10, padding: '2px 5px', color: 'var(--t2)', flexShrink: 0 }}>
                    {fields.filter(f => f.recipientId === s.id).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />

          {/* Field palette */}
          <div style={{ padding: '0 14px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              {paletteType ? '↑ Click document to place' : 'Add Fields'}
            </p>
            {paletteType && (
              <div style={{ marginBottom: 8, padding: '7px 10px', borderRadius: 6, background: 'var(--status-yellow-bg)', border: '1px solid var(--status-yellow)', fontSize: 11, color: 'var(--status-yellow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Click document to place <strong>{FIELD_PALETTE.find(p => p.type === paletteType)?.label}</strong></span>
                <button onClick={() => setPaletteType(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-yellow)', padding: 0 }}>
                  <img src="/TM-Close-negro.svg" className="pxi-sm icon-muted" alt="" />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {FIELD_PALETTE.map(item => (
                <button
                  key={item.type}
                  onClick={() => setPaletteType(paletteType === item.type ? null : item.type)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 7,
                    border: `1.5px solid ${paletteType === item.type ? (activeSigner?.color || 'var(--primary)') : 'var(--border)'}`,
                    background: paletteType === item.type ? `${activeSigner?.color || 'var(--primary)'}14` : 'var(--surface-2)',
                    cursor: 'pointer', textAlign: 'left', width: '100%', fontSize: 13,
                    color: paletteType === item.type ? (activeSigner?.color || 'var(--primary)') : 'var(--t1)',
                    fontWeight: paletteType === item.type ? 600 : 400,
                  }}
                >
                  <span style={{ color: paletteType === item.type ? (activeSigner?.color || 'var(--primary)') : 'var(--t3)' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />

          {/* Fields on this page */}
          <div style={{ padding: '0 14px 14px', flex: 1, overflow: 'auto' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              Fields — Page {currentPage}
            </p>
            {pageFields.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', padding: '10px 0' }}>No fields on this page.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {pageFields.map(f => {
                  const signer = signers.find(s => s.id === f.recipientId);
                  return (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: signer?.color || 'var(--border)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--t1)' }}>{f.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--t3)' }}>{signer?.name || 'Unknown'}</div>
                      </div>
                      <button onClick={() => removeField(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 2, display: 'flex' }}>
                        <img src="/TM-Close-negro.svg" className="pxi-sm icon-muted" alt="" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Document canvas ───────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Page nav bar */}
          <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', flexShrink: 0, position: 'relative' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface-3)', color: 'var(--t1)', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', opacity: currentPage <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center' }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 500, minWidth: 60, textAlign: 'center' }}>Page {currentPage}</span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface-3)', color: 'var(--t1)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <ChevronRight size={14} />
            </button>
            {paletteType && (
              <div style={{ position: 'absolute', right: 16, fontSize: 12, color: 'var(--status-yellow)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--status-yellow)', display: 'inline-block' }} />
                Click anywhere on the document to place
              </div>
            )}
          </div>

          {/* Scrollable canvas */}
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 32, background: 'var(--bg)' }}>
            {/* Document sheet — 850px wide, height matches actual PDF page aspect ratio */}
            <div style={{ position: 'relative', width: 850, height: sheetHeight, background: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', flexShrink: 0 }}>

              {/* PDF iframe — pointer-events off while placing/dragging */}
              {documentUrl ? (
                <iframe
                  key={`p${currentPage}`}
                  src={`${documentUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  title="Document preview"
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none',
                    pointerEvents: paletteType || dragging ? 'none' : 'auto',
                  }}
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', gap: 10 }}>
                  <img src="/TM-File-negro.svg" className="pxi-xl icon-muted" alt="" />
                  <span style={{ fontSize: 14 }}>No document preview available</span>
                </div>
              )}

              {/* Overlay — captures clicks/drags for field placement */}
              <div
                ref={overlayRef}
                onClick={handleOverlayClick}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                style={{
                  position: 'absolute', inset: 0,
                  cursor: paletteType ? 'crosshair' : dragging ? 'grabbing' : 'default',
                  pointerEvents: paletteType || dragging ? 'auto' : 'none',
                }}
              >
                {pageFields.map(f => {
                  const signer = signers.find(s => s.id === f.recipientId);
                  const color = signer?.color || '#4F46E5';
                  return (
                    <div
                      key={f.id}
                      onMouseDown={e => startDrag(e, f)}
                      onClick={e => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        left: `${f.x}%`, top: `${f.y}%`,
                        width: `${f.width}%`, height: `${f.height}%`,
                        border: `2px solid ${color}`,
                        borderRadius: 4,
                        background: `${color}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'move',
                        userSelect: 'none',
                        pointerEvents: 'auto',
                        boxSizing: 'border-box',
                        minWidth: 50, minHeight: 22,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color, fontWeight: 600, overflow: 'hidden', padding: '0 4px', pointerEvents: 'none' }}>
                        {FIELD_PALETTE.find(p => p.type === f.type)?.icon}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {signer?.name || 'Signer'}
                        </span>
                      </div>
                      <button
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); removeField(f.id); }}
                        style={{ position: 'absolute', top: -9, right: -9, width: 18, height: 18, borderRadius: '50%', background: color, border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', padding: 0 }}
                      >
                        <img src="/TM-Close-negro.svg" className="pxi-sm icon-white" alt="" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
