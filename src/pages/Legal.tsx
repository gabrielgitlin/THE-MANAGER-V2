import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, Pencil, History, FileText, Brain, Send, Loader2, Trash2, XCircle, CheckCircle2, Clock } from 'lucide-react';
import type { DocumentType, DocumentStatus } from '../types';
import Modal from '../components/Modal';
import AddDocumentModal from '../components/legal/AddDocumentModal';
import ContractAnalysisModal from '../components/legal/ContractAnalysisModal';
import SignaturePreparationModal from '../components/legal/SignaturePreparationModal';
import { formatDate } from '../lib/utils';
import * as legalService from '../lib/legalService';
import { getSigningStatusForDocuments } from '../lib/legalService';
import * as signingService from '../lib/signingService';
import type { SigningRequestWithRecipients } from '../lib/signingTypes';

const DOCUMENT_TYPES: legalService.DocumentType[] = ['contract', 'license', 'release', 'agreement', 'other'];
const DOCUMENT_STATUSES: legalService.DocumentStatus[] = ['Draft', 'pending_review', 'pending_signature', 'active', 'expired', 'terminated'];

export default function Legal() {
  const [documents, setDocuments] = useState<legalService.LegalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isViewAnalysisModalOpen, setIsViewAnalysisModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<legalService.LegalDocument | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    type: 'contract' as legalService.DocumentType,
    status: 'Draft' as legalService.DocumentStatus,
    description: '',
    parties: '',
    tags: '',
    version: '',
    signed_date: '',
    expiry_date: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<legalService.DocumentType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<legalService.DocumentStatus | 'all'>('all');
  const [newNote, setNewNote] = useState<string>('');
  const [documentNotes, setDocumentNotes] = useState<legalService.DocumentNote[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [signingStatuses, setSigningStatuses] = useState<Record<string, any>>({});
  const [signingDetails, setSigningDetails] = useState<Record<string, SigningRequestWithRecipients>>({});
  const [expandedSigningDoc, setExpandedSigningDoc] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [voidingRequest, setVoidingRequest] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await legalService.getDocuments();
      setDocuments(docs);
      const docIds = docs.map(d => d.id);
      const statuses = await getSigningStatusForDocuments(docIds);
      setSigningStatuses(statuses);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSigningDetails = async (docId: string) => {
    if (expandedSigningDoc === docId) {
      setExpandedSigningDoc(null);
      return;
    }
    setExpandedSigningDoc(docId);
    if (!signingDetails[docId] && signingStatuses[docId]) {
      try {
        const requestId = signingStatuses[docId].signing_request_id;
        const detail = await signingService.getSigningRequest(requestId);
        if (detail) {
          setSigningDetails(prev => ({ ...prev, [docId]: detail }));
        }
      } catch (err) {
        console.error('Error fetching signing details:', err);
      }
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

  const handleVoidRequest = async (signingRequestId: string, docId: string) => {
    if (!window.confirm('Are you sure you want to void this signing request? This cannot be undone.')) return;
    setVoidingRequest(signingRequestId);
    try {
      await signingService.voidSigningRequest(signingRequestId);
      // Refresh signing statuses
      const docs = await legalService.getDocuments();
      setDocuments(docs);
      const statuses = await getSigningStatusForDocuments(docs.map(d => d.id));
      setSigningStatuses(statuses);
      setSigningDetails(prev => {
        const updated = { ...prev };
        delete updated[docId];
        return updated;
      });
      setExpandedSigningDoc(null);
    } catch (err) {
      console.error('Error voiding signing request:', err);
      alert('Failed to void signing request');
    } finally {
      setVoidingRequest(null);
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
        {
          title,
          type: 'contract',
          status: 'Draft',
          parties: [],
          tags: [],
          version: '1.0',
        },
        data.file,
        data.externalLink
      );
      setDocuments([newDoc, ...documents]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding document:', error);
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
          status: 'pending_review',
          parties: [],
          tags: ['ai_analyzed'],
          version: '1.0',
          ai_analysis: {
            summary: data.summary,
            keyTerms: data.keyTerms,
            risks: data.risks,
            recommendations: data.recommendations
          }
        },
        data.file
      );
      setDocuments([newDoc, ...documents]);
      setIsAnalysisModalOpen(false);
    } catch (error) {
      console.error('Error adding analyzed document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await legalService.deleteDocument(id);
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleDownload = async (doc: legalService.LegalDocument) => {
    if (!doc.file_url) return;

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
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === 'all' || doc.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: legalService.DocumentStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending_review':
      case 'pending_signature':
        return 'bg-beige text-black';
      case 'expired':
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOpenNotes = async (doc: legalService.LegalDocument) => {
    setSelectedDocument(doc);
    setIsNotesModalOpen(true);
    try {
      const notes = await legalService.getDocumentNotes(doc.id);
      setDocumentNotes(notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setDocumentNotes([]);
    }
  };

  const handleAddNote = async () => {
    if (!selectedDocument || !newNote.trim()) return;

    setIsSaving(true);
    try {
      const note = await legalService.addDocumentNote(selectedDocument.id, newNote.trim());
      setDocumentNotes([...documentNotes, note]);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrepareForSignature = (document: legalService.LegalDocument) => {
    setSelectedDocument(document);
    setIsSignatureModalOpen(true);
  };

  const handleOpenEdit = (doc: legalService.LegalDocument) => {
    setSelectedDocument(doc);
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
    if (!selectedDocument) return;

    setIsSaving(true);
    try {
      const updatedDoc = await legalService.updateDocument(selectedDocument.id, {
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
      setDocuments(documents.map(d => d.id === updatedDoc.id ? updatedDoc : d));
      setIsEditModalOpen(false);
      setSelectedDocument(null);
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Failed to update document');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ backgroundColor: 'var(--bg)', color: 'var(--t2)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3">Loading documents...</span>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--t1)' }}>
      <div className="shadow-md p-6 mb-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--t3)' }} />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--t1)',
                  borderColor: 'var(--border)',
                  paddingLeft: '2.5rem'
                }}
                className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as legalService.DocumentType | 'all')}
              style={{
                backgroundColor: 'var(--surface-2)',
                color: 'var(--t1)',
                borderColor: 'var(--border)'
              }}
              className="block shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="all">All Types</option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as legalService.DocumentStatus | 'all')}
              style={{
                backgroundColor: 'var(--surface-2)',
                color: 'var(--t1)',
                borderColor: 'var(--border)'
              }}
              className="block shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="all">All Statuses</option>
              {DOCUMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              New Document
            </button>
            <button
              onClick={() => setIsAnalysisModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Brain className="w-4 h-4" />
              Analyze Contract
            </button>
          </div>
        </div>
      </div>

      <div className="shadow-md overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="min-w-full" style={{ borderColor: 'var(--border)' }}>
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="p-6 relative" style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              <div className="hover:opacity-75 transition-opacity" />
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium" style={{ color: 'var(--t1)' }}>{doc.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {doc.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                    {doc.ai_analysis && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        AI Analyzed
                      </span>
                    )}
                    {signingStatuses[doc.id] && (() => {
                      const s = signingStatuses[doc.id];
                      if (s.status === 'completed') {
                        return (
                          <button
                            onClick={() => handleToggleSigningDetails(doc.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
                            style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: 'rgb(34,197,94)', border: '1px solid rgba(34,197,94,0.3)' }}
                            title="View signing details"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Signed
                          </button>
                        );
                      } else if (s.status === 'voided') {
                        return (
                          <span
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
                            style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: 'rgb(239,68,68)', border: '1px solid rgba(239,68,68,0.3)' }}
                          >
                            <XCircle className="w-3 h-3" />
                            Voided
                          </span>
                        );
                      } else if (s.status === 'pending' || s.status === 'draft') {
                        return (
                          <button
                            onClick={() => handleToggleSigningDetails(doc.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
                            style={{ backgroundColor: 'rgba(234,179,8,0.15)', color: 'rgb(202,138,4)', border: '1px solid rgba(234,179,8,0.3)' }}
                            title="View signing details"
                          >
                            <Clock className="w-3 h-3" />
                            {s.signed_count}/{s.total_count} Signed
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="mt-1 text-sm" style={{ color: 'var(--t3)' }}>{doc.description}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {doc.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: 'var(--brand-1)/10', color: 'var(--brand-1)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.ai_analysis && (
                    <button
                      onClick={() => {
                        setSelectedDocument(doc);
                        setIsViewAnalysisModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:text-blue-700 relative"
                      title="View AI Analysis"
                    >
                      <Brain className="w-5 h-5" />
                    </button>
                  )}
                  {doc.file_url && (
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 hover:opacity-75"
                      style={{ color: 'var(--t3)' }}
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenNotes(doc)}
                    className="p-2 hover:opacity-75"
                    style={{ color: 'var(--t3)' }}
                    title="Notes"
                  >
                    <History className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(doc)}
                    className="p-2 hover:opacity-75"
                    style={{ color: 'var(--t3)' }}
                    title="Edit"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handlePrepareForSignature(doc)}
                    className="p-2 hover:opacity-75"
                    style={{ color: 'var(--t3)' }}
                    title="Prepare for signature"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-2 hover:text-red-500"
                    style={{ color: 'var(--t3)' }}
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <img
                src="/TM-Contrato-negro copy.png"
                alt="Contract Icon"
                className="absolute bottom-4 right-4 w-8 h-8 opacity-30"
              />
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span style={{ color: 'var(--t3)' }}>Parties: </span>
                  <span style={{ color: 'var(--t1)' }}>{doc.parties.join(', ') || 'Not specified'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--t3)' }}>Version: </span>
                  <span style={{ color: 'var(--t1)' }}>{doc.version}</span>
                </div>
                {doc.signed_date && (
                  <div>
                    <span style={{ color: 'var(--t3)' }}>Signed Date: </span>
                    <span style={{ color: 'var(--t1)' }}>{formatDate(doc.signed_date)}</span>
                  </div>
                )}
                {doc.expiry_date && (
                  <div>
                    <span style={{ color: 'var(--t3)' }}>Expiry Date: </span>
                    <span style={{ color: 'var(--t1)' }}>{formatDate(doc.expiry_date)}</span>
                  </div>
                )}
                {doc.file_name && (
                  <div>
                    <span style={{ color: 'var(--t3)' }}>File: </span>
                    <span style={{ color: 'var(--t1)' }}>{doc.file_name}</span>
                  </div>
                )}
              </div>

              {/* Signing Details Panel */}
              {expandedSigningDoc === doc.id && signingStatuses[doc.id] && (
                <div className="mt-4 p-4" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4 }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>Signing Status</h4>
                    <div className="flex items-center gap-2">
                      {signingStatuses[doc.id]?.status === 'completed' && (() => {
                        const detail = signingDetails[doc.id];
                        if (detail?.signed_pdf_path) {
                          return (
                            <a
                              href={detail.signed_pdf_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1 text-xs font-medium"
                              style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: 'rgb(34,197,94)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 4 }}
                            >
                              <Download className="w-3 h-3" />
                              Download Signed PDF
                            </a>
                          );
                        }
                        return null;
                      })()}
                      {signingStatuses[doc.id]?.status !== 'voided' && signingStatuses[doc.id]?.status !== 'completed' && (
                        <button
                          onClick={() => handleVoidRequest(signingStatuses[doc.id].signing_request_id, doc.id)}
                          disabled={voidingRequest === signingStatuses[doc.id].signing_request_id}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium"
                          style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: 'rgb(239,68,68)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, opacity: voidingRequest === signingStatuses[doc.id].signing_request_id ? 0.6 : 1 }}
                        >
                          {voidingRequest === signingStatuses[doc.id].signing_request_id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <XCircle className="w-3 h-3" />
                          }
                          Void Request
                        </button>
                      )}
                    </div>
                  </div>

                  {signingDetails[doc.id] ? (
                    <div className="space-y-1">
                      {signingDetails[doc.id].recipients.map((recipient) => (
                        <div key={recipient.id} className="flex items-center justify-between py-2 px-3" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4 }}>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate" style={{ color: 'var(--t1)' }}>{recipient.name}</div>
                            <div className="text-xs truncate" style={{ color: 'var(--t3)' }}>{recipient.email}</div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            {recipient.status === 'signed' ? (
                              <div className="flex items-center gap-1">
                                <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: 'rgb(34,197,94)' }}>
                                  <CheckCircle2 className="w-3 h-3" />
                                  Signed
                                </span>
                                {recipient.signed_at && (
                                  <span className="text-xs" style={{ color: 'var(--t3)' }}>{formatDate(recipient.signed_at)}</span>
                                )}
                              </div>
                            ) : recipient.status === 'declined' ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: 'rgb(239,68,68)' }}>
                                <XCircle className="w-3 h-3" />
                                Declined
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: 'rgba(234,179,8,0.15)', color: 'rgb(202,138,4)' }}>
                                  <Clock className="w-3 h-3" />
                                  {recipient.status.charAt(0).toUpperCase() + recipient.status.slice(1)}
                                </span>
                                {signingStatuses[doc.id]?.status !== 'voided' && (
                                  <button
                                    onClick={() => handleSendReminder(signingStatuses[doc.id].signing_request_id, recipient.id)}
                                    disabled={sendingReminder === recipient.id}
                                    className="flex items-center gap-1 px-2 py-0.5 text-xs"
                                    style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t2)', border: '1px solid var(--border)', borderRadius: 4, opacity: sendingReminder === recipient.id ? 0.6 : 1 }}
                                    title="Send reminder"
                                  >
                                    {sendingReminder === recipient.id
                                      ? <Loader2 className="w-3 h-3 animate-spin" />
                                      : <Send className="w-3 h-3" />
                                    }
                                    Remind
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--t3)' }}>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading recipients...
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredDocuments.length === 0 && (
            <div className="p-8 text-center" style={{ backgroundColor: 'var(--surface)' }}>
              <FileText className="mx-auto h-12 w-12" style={{ color: 'var(--t3)' }} />
              <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--t1)' }}>No documents found</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--t3)' }}>
                Try adjusting your search or filters, or add a new document.
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90"
                >
                  Add Document
                </button>
                <button
                  onClick={() => setIsAnalysisModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Analyze Contract
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false);
          setSelectedDocument(null);
          setNewNote('');
          setDocumentNotes([]);
        }}
        title={`Notes - ${selectedDocument?.title}`}
      >
        <div className="space-y-6">
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {documentNotes.map((note) => (
              <div key={note.id} className="p-4" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--t1)' }}>{note.content}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--t3)' }}>
                      <span>{note.author?.email || 'Unknown'}</span>
                      <span>-</span>
                      <span>{formatDate(note.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {documentNotes.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--t3)' }}>No notes yet</p>
            )}
          </div>

          <div style={{ borderTopColor: 'var(--border)' }} className="border-t pt-4">
            <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
              Add Note
            </label>
            <div className="mt-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                style={{
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--t1)',
                  borderColor: 'var(--border)'
                }}
                className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Add your note here..."
              />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsNotesModalOpen(false);
                  setSelectedDocument(null);
                  setNewNote('');
                  setDocumentNotes([]);
                }}
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                className="px-4 py-2 text-sm font-medium border hover:opacity-75"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Note
              </button>
            </div>
          </div>
        </div>
      </Modal>

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

      <Modal
        isOpen={isViewAnalysisModalOpen}
        onClose={() => {
          setIsViewAnalysisModalOpen(false);
          setSelectedDocument(null);
        }}
        title="AI Contract Analysis"
        maxWidth="4xl"
      >
        {selectedDocument?.ai_analysis && (
          <div className="space-y-6">
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderLeftColor: 'rgb(59, 130, 246)' }} className="border-l-4 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Brain className="h-5 w-5" style={{ color: 'rgb(59, 130, 246)' }} />
                </div>
                <div className="ml-3">
                  <p className="text-sm" style={{ color: 'var(--t2)' }}>
                    This is an AI-generated analysis of the contract. It should not replace legal advice from a qualified attorney.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--t1)' }}>Summary</h2>
              <div style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }} className="p-4">
                <p className="text-sm whitespace-pre-line" style={{ color: 'var(--t2)' }}>{selectedDocument.ai_analysis.summary}</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--t1)' }}>Key Terms</h2>
              <div className="space-y-2">
                {selectedDocument.ai_analysis.keyTerms.map((term, index) => (
                  <div key={index} style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }} className="p-3">
                    <p className="text-sm" style={{ color: 'var(--t2)' }}>{term}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--t1)' }}>Potential Risks</h2>
              <div className="space-y-2">
                {selectedDocument.ai_analysis.risks.map((risk, index) => (
                  <div key={index} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', border: '1px solid' }} className="p-3">
                    <p className="text-sm" style={{ color: 'rgb(248, 113, 113)' }}>{risk}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--t1)' }}>Recommendations</h2>
              <div className="space-y-2">
                {selectedDocument.ai_analysis.recommendations.map((recommendation, index) => (
                  <div key={index} style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)', border: '1px solid' }} className="p-3">
                    <p className="text-sm" style={{ color: 'rgb(74, 222, 128)' }}>{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsViewAnalysisModalOpen(false)}
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                className="px-4 py-2 text-sm font-medium border hover:opacity-75"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDocument(null);
        }}
        title="Edit Document"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>Title</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              style={{
                backgroundColor: 'var(--surface-2)',
                color: 'var(--t1)',
                borderColor: 'var(--border)'
              }}
              className="mt-1 block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>Type</label>
              <select
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value as legalService.DocumentType })}
                style={{
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--t1)',
                  borderColor: 'var(--border)'
                }}
                className="mt-1 block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as legalService.DocumentStatus })}
                style={{
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--t1)',
                  borderColor: 'var(--border)'
                }}
                className="mt-1 block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                {DOCUMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              style={{
                backgroundColor: 'var(--surface-2)',
                color: 'var(--t1)',
                borderColor: 'var(--border)'
              }}
              className="mt-1 block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>Parties (comma-separated)</label>
            <input
              type="text"
              value={editForm.parties}
              onChange={(e) => setEditForm({ ...editForm, parties: e.target.value })}
              placeholder="Party 1, Party 2"
              style={{
                backgroundColor: 'var(--surface-2)',
                color: 'var(--t1)',
                borderColor: 'var(--border)'
              }}
              className="mt-1 block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>Tags (comma-separated)</label>
            <input
              type="text"
              value={editForm.tags}
              onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
              placeholder="tag1, tag2"
              style={{
                backgroundColor: 'var(--surface-2)',
                color: 'var(--t1)',
                borderColor: 'var(--border)'
              }}
              className="mt-1 block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div className="scroll-row">
            <div className="grid grid-cols-3 gap-4 min-w-[500px]">
              <div>
                <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>Version</label>
                <input
                  type="text"
                  value={editForm.version}
                  onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--t1)',
                    borderColor: 'var(--border)'
                  }}
                  className="mt-1 block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>Signed Date</label>
                <input
                  type="date"
                  value={editForm.signed_date}
                  onChange={(e) => setEditForm({ ...editForm, signed_date: e.target.value })}
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--t1)',
                    borderColor: 'var(--border)'
                  }}
                  className="mt-1 block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>Expiry Date</label>
                <input
                  type="date"
                  value={editForm.expiry_date}
                  onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--t1)',
                    borderColor: 'var(--border)'
                  }}
                  className="mt-1 block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4" style={{ borderTopColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedDocument(null);
              }}
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
              className="px-4 py-2 text-sm font-medium border hover:opacity-75"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isSaving || !editForm.title.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      <SignaturePreparationModal
        isOpen={isSignatureModalOpen}
        onClose={() => {
          setIsSignatureModalOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument ? {
          id: parseInt(selectedDocument.id) || 0,
          title: selectedDocument.title,
          type: selectedDocument.type,
          status: selectedDocument.status as DocumentStatus,
          parties: selectedDocument.parties,
          effectiveDate: selectedDocument.signed_date || selectedDocument.created_at,
          expirationDate: selectedDocument.expiry_date,
          fileName: selectedDocument.file_name,
          lastModified: selectedDocument.updated_at,
          tags: selectedDocument.tags,
          version: selectedDocument.version,
          notes: [],
        } : null}
      />
    </div>
  );
}
