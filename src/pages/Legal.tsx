import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, Pencil, History, FileText, Brain, Send, Loader2, Trash2 } from 'lucide-react';
import type { DocumentType, DocumentStatus } from '../types';
import Modal from '../components/Modal';
import AddDocumentModal from '../components/legal/AddDocumentModal';
import ContractAnalysisModal from '../components/legal/ContractAnalysisModal';
import SignaturePreparationModal from '../components/legal/SignaturePreparationModal';
import { formatDate } from '../lib/utils';
import * as legalService from '../lib/legalService';

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

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await legalService.getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDocument = async (data: { type: 'template' | 'upload', file?: File, template?: string }) => {
    setIsSaving(true);
    try {
      const newDoc = await legalService.createDocument(
        {
          title: data.type === 'upload' ? data.file?.name || 'New Document' : 'New Document from Template',
          type: 'contract',
          status: 'Draft',
          parties: [],
          tags: [],
          version: '1.0',
        },
        data.file
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-gray-500">Loading documents...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 font-title">LEGAL</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage contracts, licenses, and legal agreements
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as legalService.DocumentType | 'all')}
              className="block rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
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
              className="block rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              New Document
            </button>
            <button
              onClick={() => setIsAnalysisModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <Brain className="w-4 h-4" />
              Analyze Contract
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="min-w-full divide-y divide-gray-200">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="p-6 hover:bg-gray-50 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium text-gray-900">{doc.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                      {doc.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                    {doc.ai_analysis && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        AI Analyzed
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">{doc.description}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {doc.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
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
                      className="p-2 text-gray-400 hover:text-gray-500"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenNotes(doc)}
                    className="p-2 text-gray-400 hover:text-gray-500"
                    title="Notes"
                  >
                    <History className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(doc)}
                    className="p-2 text-gray-400 hover:text-gray-500"
                    title="Edit"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handlePrepareForSignature(doc)}
                    className="p-2 text-gray-400 hover:text-gray-500"
                    title="Prepare for signature"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-2 text-gray-400 hover:text-red-500"
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
                  <span className="text-gray-500">Parties: </span>
                  <span className="text-gray-900">{doc.parties.join(', ') || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Version: </span>
                  <span className="text-gray-900">{doc.version}</span>
                </div>
                {doc.signed_date && (
                  <div>
                    <span className="text-gray-500">Signed Date: </span>
                    <span className="text-gray-900">{formatDate(doc.signed_date)}</span>
                  </div>
                )}
                {doc.expiry_date && (
                  <div>
                    <span className="text-gray-500">Expiry Date: </span>
                    <span className="text-gray-900">{formatDate(doc.expiry_date)}</span>
                  </div>
                )}
                {doc.file_name && (
                  <div>
                    <span className="text-gray-500">File: </span>
                    <span className="text-gray-900">{doc.file_name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredDocuments.length === 0 && (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filters, or add a new document.
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                >
                  Add Document
                </button>
                <button
                  onClick={() => setIsAnalysisModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
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
              <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{note.content}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <span>{note.author?.email || 'Unknown'}</span>
                      <span>-</span>
                      <span>{formatDate(note.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {documentNotes.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
            )}
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700">
              Add Note
            </label>
            <div className="mt-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
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
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Brain className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    This is an AI-generated analysis of the contract. It should not replace legal advice from a qualified attorney.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Summary</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-line">{selectedDocument.ai_analysis.summary}</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Key Terms</h2>
              <div className="space-y-2">
                {selectedDocument.ai_analysis.keyTerms.map((term, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{term}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Potential Risks</h2>
              <div className="space-y-2">
                {selectedDocument.ai_analysis.risks.map((risk, index) => (
                  <div key={index} className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm text-red-700">{risk}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Recommendations</h2>
              <div className="space-y-2">
                {selectedDocument.ai_analysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsViewAnalysisModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value as legalService.DocumentType })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as legalService.DocumentStatus })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
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
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Parties (comma-separated)</label>
            <input
              type="text"
              value={editForm.parties}
              onChange={(e) => setEditForm({ ...editForm, parties: e.target.value })}
              placeholder="Party 1, Party 2"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
            <input
              type="text"
              value={editForm.tags}
              onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
              placeholder="tag1, tag2"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div className="scroll-row">
            <div className="grid grid-cols-3 gap-4 min-w-[500px]">
              <div>
                <label className="block text-sm font-medium text-gray-700">Version</label>
                <input
                  type="text"
                  value={editForm.version}
                  onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Signed Date</label>
                <input
                  type="date"
                  value={editForm.signed_date}
                  onChange={(e) => setEditForm({ ...editForm, signed_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                <input
                  type="date"
                  value={editForm.expiry_date}
                  onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedDocument(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isSaving || !editForm.title.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
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
