import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Loader2 } from 'lucide-react';
import PdfThumbnailCanvas from '../components/legal/PdfThumbnailCanvas';
import AddDocumentModal from '../components/legal/AddDocumentModal';
import ContractAnalysisModal from '../components/legal/ContractAnalysisModal';
import * as legalService from '../lib/legalService';
import { getSigningStatusForDocuments } from '../lib/legalService';
import * as signingService from '../lib/signingService';
import { formatDate } from '../lib/utils';

type LegalFilter = 'all' | 'draft' | 'needs_signature' | 'signed';

const LEGAL_FILTERS: Array<{ value: LegalFilter; label: string }> = [
  { value: 'all',             label: 'All' },
  { value: 'draft',           label: 'Draft' },
  { value: 'needs_signature', label: 'Needs Signature' },
  { value: 'signed',          label: 'Signed' },
];


function getStatusBadge(status: legalService.DocumentStatus) {
  switch (status) {
    case 'signed':           return 'badge-green';
    case 'needs_signature':  return 'badge-yellow';
    default:                 return 'badge-neutral';
  }
}

function formatStatus(status: legalService.DocumentStatus) {
  switch (status) {
    case 'draft':           return 'Draft';
    case 'needs_signature': return 'Needs Signature';
    case 'signed':          return 'Signed';
  }
}

/** Returns the single badge to show per document — signing state wins over doc.status */
function effectiveStatus(docStatus: legalService.DocumentStatus, signing: any): { badge: string; label: string } {
  if (signing?.status === 'completed') return { badge: 'badge-green',  label: 'Signed' };
  if (signing?.status === 'pending')   return { badge: 'badge-yellow', label: 'Needs Signature' };
  return { badge: getStatusBadge(docStatus), label: formatStatus(docStatus)! };
}

function DocThumbnail({ type, status, fileUrl, fileName }: {
  type: legalService.DocumentType;
  status: legalService.DocumentStatus;
  fileUrl?: string;
  fileName?: string;
}) {
  const statusAccent: Record<legalService.DocumentStatus, string> = {
    signed:           'var(--status-green)',
    needs_signature:  'var(--status-yellow)',
    draft:            'var(--border-3)',
  };

  const accent = statusAccent[status];
  const isPdf = !!fileUrl && (!fileName || fileName.toLowerCase().endsWith('.pdf'));

  if (isPdf) {
    return (
      <div style={{
        flexShrink: 0, overflow: 'hidden', position: 'relative',
        borderTop: '1px solid var(--border)',
        borderRight: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        borderLeft: `3px solid ${accent}`,
      }}>
        <PdfThumbnailCanvas url={fileUrl!} width={44} />
      </div>
    );
  }

  const typeBg: Record<legalService.DocumentType, string> = {
    contract:  'rgba(0, 156, 85, 0.10)',
    license:   'rgba(204, 219, 226, 0.10)',
    release:   'rgba(221, 170, 68, 0.10)',
    agreement: 'rgba(224, 138, 60, 0.10)',
    other:     'var(--surface-3)',
  };

  return (
    <div style={{
      width: 44, height: 44, flexShrink: 0,
      background: typeBg[type],
      borderTop: '1px solid var(--border)',
      borderRight: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      borderLeft: `3px solid ${accent}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <img src="/TM-File-negro.svg" style={{ width: 20, height: 20, opacity: 0.45 }} alt="" />
    </div>
  );
}

export default function Legal() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<legalService.LegalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [signingStatuses, setSigningStatuses] = useState<Record<string, any>>({});

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<LegalFilter>('all');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'idle' | 'deleting' | 'reminding' | 'downloading'>('idle');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await legalService.getDocuments();
      setDocuments(docs);
      const statuses = await getSigningStatusForDocuments(docs.map(d => d.id));
      setSigningStatuses(statuses);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDocument = async (data: {
    type: 'template' | 'upload';
    file?: File;
    template?: string;
    externalLink?: { sourceType: any; url: string; name?: string };
  }) => {
    setIsSaving(true);
    try {
      const title =
        data.file?.name ||
        data.externalLink?.name ||
        (data.type === 'upload' ? 'New Document' : 'New Document from Template');
      const newDoc = await legalService.createDocument(
        { title, type: 'contract', status: 'draft', parties: [], tags: [], version: '1.0' },
        data.file,
        data.externalLink
      );
      setDocuments([newDoc, ...documents]);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error adding document:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAnalysis = async (data: {
    title: string;
    summary: string;
    keyTerms: string[];
    risks: string[];
    recommendations: string[];
    file?: File;
  }) => {
    setIsSaving(true);
    try {
      const newDoc = await legalService.createDocument(
        {
          title: data.title,
          type: 'contract',
          status: 'draft',
          parties: [],
          tags: ['ai_analyzed'],
          version: '1.0',
          ai_analysis: {
            summary: data.summary,
            keyTerms: data.keyTerms,
            risks: data.risks,
            recommendations: data.recommendations,
          },
        },
        data.file
      );
      setDocuments([newDoc, ...documents]);
      setIsAnalysisModalOpen(false);
    } catch (err) {
      console.error('Error adding analyzed document:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} document(s)? This cannot be undone.`)) return;
    setBulkAction('deleting');
    try {
      await Promise.allSettled([...selectedIds].map(id => legalService.deleteDocument(id)));
      setDocuments(prev => prev.filter(d => !selectedIds.has(d.id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Bulk delete error:', err);
    } finally {
      setBulkAction('idle');
    }
  };

  const handleBulkDownload = async () => {
    setBulkAction('downloading');
    try {
      const docsToDownload = documents.filter(d => selectedIds.has(d.id) && d.file_url);
      for (const doc of docsToDownload) {
        const blob = await legalService.downloadDocumentFile(doc.file_url);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name || doc.title || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Bulk download error:', err);
    } finally {
      setBulkAction('idle');
    }
  };

  const handleBulkReminder = async () => {
    setBulkAction('reminding');
    try {
      const pendingIds = [...selectedIds].filter(id => signingStatuses[id]?.status === 'pending');
      for (const docId of pendingIds) {
        const { signing_request_id } = signingStatuses[docId];
        const request = await signingService.getSigningRequest(signing_request_id);
        if (!request) continue;
        await Promise.allSettled(
          request.recipients
            .filter(r => r.status !== 'signed' && r.status !== 'declined')
            .map(r => signingService.sendReminder(signing_request_id, r.id))
        );
      }
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Bulk reminder error:', err);
    } finally {
      setBulkAction('idle');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const signing = signingStatuses[doc.id];
    const es = effectiveStatus(doc.status, signing);
    const effectiveDocStatus: legalService.DocumentStatus =
      es.badge === 'badge-green'  ? 'signed' :
      es.badge === 'badge-yellow' ? 'needs_signature' :
      'draft';
    const matchesFilter = filter === 'all' || effectiveDocStatus === filter;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--t2)' }}>
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-3 text-sm">Loading documents...</span>
      </div>
    );
  }

  return (
    <div>

      {/* ── Sub-tabs ─────────────────────────────────────────────── */}
      <div className="sub-tabs mb-6">
        {LEGAL_FILTERS.map(f => (
          <button
            key={f.value}
            className={`sub-tab ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-[28px]">

      {/* ── Search + actions ─────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <img
            src="/TM-Search-negro.svg"
            className="pxi-md icon-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            alt=""
          />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4"
          />
        </div>
        <button
          onClick={() => setIsAnalysisModalOpen(true)}
          className="btn btn-secondary btn-icon btn-md flex-shrink-0"
          title="Analyze Contract"
        >
          <Brain className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary btn-icon btn-md flex-shrink-0"
          title="New Document"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          </svg>
        </button>
      </div>

      {/* ── Document list ─────────────────────────────────────────── */}
      <div className="tm-card">
        {filteredDocuments.length === 0 ? (
          <div className="empty-state py-16">
            <img src="/TM-File-negro.svg" className="empty-state-icon pxi-xl icon-muted" alt="" />
            <div className="empty-state-title">No documents found</div>
            <div className="empty-state-desc">
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Add a document to get started.'}
            </div>
          </div>
        ) : (<>

          {/* ── Select-all header ──────────────────────────────── */}
          {(() => {
            const allSelected = filteredDocuments.every(d => selectedIds.has(d.id));
            const someSelected = filteredDocuments.some(d => selectedIds.has(d.id)) && !allSelected;
            return (
              <div
                className="flex items-center gap-4 px-5 py-2"
                style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}
              >
                {/* Select-all checkbox */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (allSelected) setSelectedIds(new Set());
                    else setSelectedIds(new Set(filteredDocuments.map(d => d.id)));
                  }}
                  style={{
                    width: 16, height: 16, flexShrink: 0,
                    border: `1px solid ${allSelected || someSelected ? 'var(--brand-1)' : 'var(--border-2)'}`,
                    background: allSelected ? 'var(--brand-1)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', padding: 0,
                  }}
                >
                  {allSelected && <img src="/The Manager_Iconografia-11.svg" style={{ width: 10, height: 10, filter: 'brightness(0) invert(1)' }} alt="" />}
                  {someSelected && <div style={{ width: 8, height: 2, background: 'var(--brand-1)' }} />}
                </button>

                {selectedIds.size > 0 ? (
                  /* ── Bulk action bar ─────────────────────────── */
                  <>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--t2)' }}>
                      {selectedIds.size} selected
                    </span>
                    <div style={{ flex: 1 }} />
                    {[...selectedIds].some(id => signingStatuses[id]?.status === 'pending') && (
                      <button
                        onClick={handleBulkReminder}
                        disabled={bulkAction !== 'idle'}
                        className="btn btn-ghost btn-sm btn-icon"
                        title="Send reminders"
                      >
                        {bulkAction === 'reminding'
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <img src="/TM-Send-negro.svg" className="pxi-sm icon-muted" alt="" />}
                      </button>
                    )}
                    {[...selectedIds].some(id => documents.find(d => d.id === id)?.file_url) && (
                      <button
                        onClick={handleBulkDownload}
                        disabled={bulkAction !== 'idle'}
                        className="btn btn-ghost btn-sm btn-icon"
                        title="Download selected"
                      >
                        {bulkAction === 'downloading'
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <img src="/TM-Download-negro.svg" className="pxi-sm icon-muted" alt="" />}
                      </button>
                    )}
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkAction !== 'idle'}
                      className="btn btn-ghost btn-sm btn-icon"
                      title="Delete selected"
                    >
                      {bulkAction === 'deleting'
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <img src="/TM-Trash-negro.svg" className="pxi-sm icon-danger" alt="" />}
                    </button>
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      className="btn btn-ghost btn-sm"
                      title="Clear selection"
                    >
                      <img src="/TM-Close-negro.svg" className="pxi-sm icon-muted" alt="" />
                    </button>
                  </>
                ) : (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--t4)' }}>
                    Select all
                  </span>
                )}
              </div>
            );
          })()}

          {/* ── Rows ───────────────────────────────────────────── */}
          {filteredDocuments.map((doc, idx) => {
            const signing = signingStatuses[doc.id];
            const isSelected = selectedIds.has(doc.id);
            return (
              <div
                key={doc.id}
                className="flex items-center gap-4 px-5 py-3 transition-colors"
                style={{
                  borderBottom: idx < filteredDocuments.length - 1 ? '1px solid var(--border)' : 'none',
                  background: isSelected ? 'rgba(0,156,85,0.05)' : 'transparent',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/legal/${doc.id}`)}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(0,156,85,0.05)' : 'transparent'; }}
              >
                {/* Checkbox */}
                <button
                  onClick={e => toggleSelect(doc.id, e)}
                  style={{
                    width: 16, height: 16, flexShrink: 0,
                    border: `1px solid ${isSelected ? 'var(--brand-1)' : 'var(--border-2)'}`,
                    background: isSelected ? 'var(--brand-1)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', padding: 0,
                  }}
                >
                  {isSelected && <img src="/The Manager_Iconografia-11.svg" style={{ width: 10, height: 10, filter: 'brightness(0) invert(1)' }} alt="" />}
                </button>

                <DocThumbnail
                  type={doc.type}
                  status={doc.status}
                  fileUrl={doc.file_url || undefined}
                  fileName={doc.file_name || undefined}
                />

                {/* Middle: title + badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--t1)' }}>
                      {doc.title}
                    </span>
                    {(() => { const es = effectiveStatus(doc.status, signing); return (
                      <span className={`status-badge ${es.badge}`}>{es.label}</span>
                    ); })()}
                    {doc.ai_analysis && (
                      <span className="status-badge badge-blue">AI</span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--t3)', marginTop: 2 }}>
                    {doc.type}{doc.parties.length > 0 ? ` · ${doc.parties.join(', ')}` : ''}
                  </div>
                </div>

                {/* Right: date */}
                <div className="flex-shrink-0 text-right">
                  {doc.expiry_date ? (
                    <>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--t3)' }}>Expires</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--t2)' }}>{formatDate(doc.expiry_date)}</div>
                    </>
                  ) : doc.signed_date ? (
                    <>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--t3)' }}>Signed</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--t2)' }}>{formatDate(doc.signed_date)}</div>
                    </>
                  ) : (
                    <div className="text-xs" style={{ color: 'var(--t3)' }}>{formatDate(doc.created_at)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </>)}
      </div>

      </div>{/* end space-y */}

      <AddDocumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddDocument}
      />

      <ContractAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        onSave={handleAddAnalysis}
      />
    </div>
  );
}
