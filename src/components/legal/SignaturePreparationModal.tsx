import React, { useState, useRef, useEffect } from 'react';
import { X, Mail, User, Plus, Trash2, FileText, Send, Move, FileSignature as Signature, Edit, Calendar, CheckSquare } from 'lucide-react';
import Modal from '../Modal';
import type { LegalDocument } from '../../types';
import SignatureEmailPreview from './SignatureEmailPreview';

interface SignaturePreparationModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: LegalDocument | null;
}

interface SignatureField {
  id: string;
  type: 'signature' | 'initial' | 'date' | 'text' | 'checkbox';
  label: string;
  required: boolean;
  page: number;
  position: { x: number; y: number; width: number; height: number };
  recipientId: string;
}

interface Signer {
  id: string;
  name: string;
  email: string;
  role: string;
  fields: SignatureField[];
}

export default function SignaturePreparationModal({ isOpen, onClose, document }: SignaturePreparationModalProps) {
  const [step, setStep] = useState<'recipients' | 'fields' | 'message' | 'review'>('recipients');
  const [signers, setSigners] = useState<Signer[]>([
    {
      id: '1',
      name: '',
      email: '',
      role: '',
      fields: []
    }
  ]);
  const [activeSignerId, setActiveSignerId] = useState<string>('1');
  const [emailSubject, setEmailSubject] = useState(`Please sign: ${document?.title || 'Document'}`);
  const [emailMessage, setEmailMessage] = useState('Please review and sign this document at your earliest convenience.');
  const [isSending, setIsSending] = useState(false);
  const [sendComplete, setSendComplete] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState<SignatureField['type'] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(3); // Simulated total pages
  const [isDragging, setIsDragging] = useState(false);
  const [draggedField, setDraggedField] = useState<SignatureField | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [selectedSigner, setSelectedSigner] = useState<Signer | null>(null);
  
  const documentRef = useRef<HTMLDivElement>(null);
  const fieldIdCounter = useRef(1);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep('recipients');
      setSigners([{
        id: '1',
        name: '',
        email: '',
        role: '',
        fields: []
      }]);
      setActiveSignerId('1');
      setEmailSubject(`Please sign: ${document?.title || 'Document'}`);
      setEmailMessage('Please review and sign this document at your earliest convenience.');
      setIsSending(false);
      setSendComplete(false);
      setSelectedFieldType(null);
      setCurrentPage(1);
      setShowEmailPreview(false);
      setSelectedSigner(null);
    }
  }, [isOpen, document]);

  const handleAddSigner = () => {
    const newSigner: Signer = {
      id: `${signers.length + 1}`,
      name: '',
      email: '',
      role: '',
      fields: []
    };
    setSigners([...signers, newSigner]);
  };

  const handleRemoveSigner = (id: string) => {
    if (signers.length > 1) {
      setSigners(signers.filter(signer => signer.id !== id));
      if (activeSignerId === id) {
        setActiveSignerId(signers[0].id === id ? signers[1].id : signers[0].id);
      }
    }
  };

  const handleUpdateSigner = (id: string, updates: Partial<Signer>) => {
    setSigners(signers.map(signer => 
      signer.id === id ? { ...signer, ...updates } : signer
    ));
  };

  const handleAddField = (signerId: string, type: SignatureField['type'], position?: { x: number; y: number }) => {
    const signer = signers.find(s => s.id === signerId);
    if (!signer) return;

    const fieldId = fieldIdCounter.current++;
    
    // Default position in the middle of the document if not provided
    const defaultPosition = {
      x: position?.x || 200,
      y: position?.y || 200,
      width: type === 'signature' ? 150 : type === 'initial' ? 80 : 120,
      height: type === 'signature' || type === 'initial' ? 60 : 40
    };

    const newField: SignatureField = {
      id: `field-${fieldId}`,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${fieldId}`,
      required: true,
      page: currentPage,
      position: defaultPosition,
      recipientId: signerId
    };

    handleUpdateSigner(signerId, {
      fields: [...signer.fields, newField]
    });
    
    setSelectedFieldType(null);
  };

  const handleRemoveField = (signerId: string, fieldId: string) => {
    const signer = signers.find(s => s.id === signerId);
    if (!signer) return;

    handleUpdateSigner(signerId, {
      fields: signer.fields.filter(field => field.id !== fieldId)
    });
  };

  const handleUpdateField = (signerId: string, fieldId: string, updates: Partial<SignatureField>) => {
    const signer = signers.find(s => s.id === signerId);
    if (!signer) return;

    handleUpdateSigner(signerId, {
      fields: signer.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    });
  };

  const handleSendForSignature = () => {
    setIsSending(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSending(false);
      setSendComplete(true);
    }, 1500);
  };

  const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedFieldType || !documentRef.current) return;
    
    const rect = documentRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    handleAddField(activeSignerId, selectedFieldType, { x, y });
  };

  const handleDragStart = (e: React.MouseEvent, field: SignatureField) => {
    if (!documentRef.current) return;
    
    setIsDragging(true);
    setDraggedField(field);
    
    // Prevent default drag behavior
    e.preventDefault();
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedField || !documentRef.current) return;
    
    const rect = documentRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width - draggedField.position.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height - draggedField.position.height));
    
    // Update field position
    handleUpdateField(draggedField.recipientId, draggedField.id, {
      position: {
        ...draggedField.position,
        x,
        y
      }
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedField(null);
  };

  const getFieldIcon = (type: SignatureField['type']) => {
    switch (type) {
      case 'signature':
        return <Signature className="w-4 h-4" />;
      case 'initial':
        return <Edit className="w-4 h-4" />;
      case 'date':
        return <Calendar className="w-4 h-4" />;
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'checkbox':
        return <CheckSquare className="w-4 h-4" />;
    }
  };

  // Add event listener for mouse movement when field type is selected
  useEffect(() => {
    if (typeof window === 'undefined' || !selectedFieldType) return;

    const handleMouseMove = (e: MouseEvent) => {
      const cursor = window.document.querySelector('.fixed.pointer-events-none');
      if (cursor) {
        cursor.setAttribute('style', `left: ${e.clientX + 10}px; top: ${e.clientY + 10}px`);
      }
    };

    window.document.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [selectedFieldType]);

  const handlePreviewEmail = (signer: Signer) => {
    setSelectedSigner(signer);
    setShowEmailPreview(true);
  };

  const renderStep = () => {
    switch (step) {
      case 'recipients':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Add Recipients</h3>
              <p className="text-sm text-gray-500">
                Add the people who need to sign this document
              </p>
            </div>

            <div className="space-y-4">
              {signers.map((signer) => (
                <div key={signer.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-sm font-medium text-gray-900">Recipient {signer.id}</h4>
                    {signers.length > 1 && (
                      <button
                        onClick={() => handleRemoveSigner(signer.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={signer.name}
                          onChange={(e) => handleUpdateSigner(signer.id, { name: e.target.value })}
                          className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          placeholder="John Smith"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={signer.email}
                          onChange={(e) => handleUpdateSigner(signer.id, { email: e.target.value })}
                          className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <input
                        type="text"
                        value={signer.role}
                        onChange={(e) => handleUpdateSigner(signer.id, { role: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder="e.g., Artist, Manager, Attorney"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddSigner}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
              >
                <Plus className="w-4 h-4" />
                Add Another Recipient
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('fields')}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                disabled={signers.some(s => !s.name || !s.email)}
              >
                Continue
              </button>
            </div>
          </div>
        );
      
      case 'fields':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Add Signature Fields</h3>
              <p className="text-sm text-gray-500">
                Specify what each recipient needs to fill out. Click on a field type, then click on the document to place it, or drag existing fields to reposition them.
              </p>
            </div>

            <div className="flex gap-4 border-b border-gray-200 mb-4">
              {signers.map((signer) => (
                <button
                  key={signer.id}
                  onClick={() => setActiveSignerId(signer.id)}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                    activeSignerId === signer.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {signer.name || `Recipient ${signer.id}`}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Signature Fields</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedFieldType('signature')}
                    className={`w-full flex items-center gap-2 p-2 text-sm text-left border rounded-md ${
                      selectedFieldType === 'signature' 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <span className="p-1 bg-primary/10 rounded">
                      <Signature className="w-4 h-4" />
                    </span>
                    Signature
                  </button>
                  <button
                    onClick={() => setSelectedFieldType('initial')}
                    className={`w-full flex items-center gap-2 p-2 text-sm text-left border rounded-md ${
                      selectedFieldType === 'initial' 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <span className="p-1 bg-primary/10 rounded">
                      <Edit className="w-4 h-4" />
                    </span>
                    Initial
                  </button>
                  <button
                    onClick={() => setSelectedFieldType('date')}
                    className={`w-full flex items-center gap-2 p-2 text-sm text-left border rounded-md ${
                      selectedFieldType === 'date' 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <span className="p-1 bg-primary/10 rounded">
                      <Calendar className="w-4 h-4" />
                    </span>
                    Date
                  </button>
                  <button
                    onClick={() => setSelectedFieldType('text')}
                    className={`w-full flex items-center gap-2 p-2 text-sm text-left border rounded-md ${
                      selectedFieldType === 'text' 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <span className="p-1 bg-primary/10 rounded">
                      <FileText className="w-4 h-4" />
                    </span>
                    Text
                  </button>
                  <button
                    onClick={() => setSelectedFieldType('checkbox')}
                    className={`w-full flex items-center gap-2 p-2 text-sm text-left border rounded-md ${
                      selectedFieldType === 'checkbox' 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <span className="p-1 bg-primary/10 rounded">
                      <CheckSquare className="w-4 h-4" />
                    </span>
                    Checkbox
                  </button>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Added Fields</h4>
                  {signers.find(s => s.id === activeSignerId)?.fields.filter(f => f.page === currentPage).length ? (
                    <div className="space-y-2">
                      {signers.find(s => s.id === activeSignerId)?.fields
                        .filter(f => f.page === currentPage)
                        .map((field) => (
                          <div key={field.id} className="flex items-center justify-between p-2 bg-white border rounded-md">
                            <div className="flex items-center gap-2">
                              <span className="p-1 bg-primary/10 rounded text-xs">
                                {getFieldIcon(field.type)}
                              </span>
                              <span className="text-sm">{field.label}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveField(activeSignerId, field.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 p-2 bg-gray-50 rounded-md">
                      No fields added to this page yet. Select a field type and click on the document to add it.
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions</h4>
                  <div className="p-3 bg-blue-50 rounded-md">
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Select a field type from above</li>
                      <li>• Click on the document to place the field</li>
                      <li>• Drag fields to reposition them</li>
                      <li>• Use the page navigation to add fields to different pages</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="md:w-2/3">
                <div className="bg-gray-50 border rounded-lg p-4 h-[500px] flex flex-col">
                  <div className="flex justify-between items-center p-2 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700">Document Preview</h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-gray-500">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-4 overflow-auto">
                    <div 
                      ref={documentRef}
                      className="bg-white border shadow-sm p-8 min-h-full relative cursor-crosshair"
                      onClick={handleDocumentClick}
                      onMouseMove={handleDragMove}
                      onMouseUp={handleDragEnd}
                      onMouseLeave={handleDragEnd}
                    >
                      {/* Simulated document content */}
                      {currentPage === 1 && (
                        <div className="space-y-4">
                          <div className="text-center mb-8">
                            <h1 className="text-xl font-bold">{document?.title || 'Agreement'}</h1>
                            <p className="text-sm text-gray-500">Page 1 of {totalPages}</p>
                          </div>
                          
                          <p className="text-sm">
                            This Agreement (the "Agreement") is made and entered into as of the date of the last signature below (the "Effective Date"), by and between the parties identified below.
                          </p>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">WHEREAS:</p>
                            <p className="text-sm">The parties wish to establish the terms and conditions under which they will work together;</p>
                            <p className="text-sm">NOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows:</p>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">1. DEFINITIONS</p>
                            <p className="text-sm">1.1 "Confidential Information" means any information disclosed by one party to the other party, either directly or indirectly, in writing, orally or by inspection of tangible objects.</p>
                            <p className="text-sm">1.2 "Services" means the services to be provided as described in this Agreement.</p>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">2. TERM</p>
                            <p className="text-sm">2.1 This Agreement shall commence on the Effective Date and shall continue until terminated in accordance with the provisions of this Agreement.</p>
                          </div>
                        </div>
                      )}
                      
                      {currentPage === 2 && (
                        <div className="space-y-4">
                          <div className="text-center mb-8">
                            <p className="text-sm text-gray-500">Page 2 of {totalPages}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">3. COMPENSATION</p>
                            <p className="text-sm">3.1 In consideration for the Services, the Client shall pay the Provider the amounts specified in Exhibit A.</p>
                            <p className="text-sm">3.2 All payments shall be made within thirty (30) days of receipt of an invoice from the Provider.</p>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">4. CONFIDENTIALITY</p>
                            <p className="text-sm">4.1 Each party agrees to maintain the confidentiality of the Confidential Information of the other party and to not disclose such Confidential Information to any third party without the prior written consent of the disclosing party.</p>
                            <p className="text-sm">4.2 The obligations of confidentiality shall survive the termination of this Agreement for a period of three (3) years.</p>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">5. INTELLECTUAL PROPERTY</p>
                            <p className="text-sm">5.1 All intellectual property rights in any materials created or developed by the Provider pursuant to this Agreement shall vest in the Client upon creation.</p>
                          </div>
                        </div>
                      )}
                      
                      {currentPage === 3 && (
                        <div className="space-y-4">
                          <div className="text-center mb-8">
                            <p className="text-sm text-gray-500">Page 3 of {totalPages}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">6. TERMINATION</p>
                            <p className="text-sm">6.1 Either party may terminate this Agreement upon thirty (30) days' written notice to the other party.</p>
                            <p className="text-sm">6.2 Upon termination, the Client shall pay the Provider for all Services performed up to the date of termination.</p>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">7. GENERAL</p>
                            <p className="text-sm">7.1 This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements and understandings, whether written or oral, relating to the subject matter of this Agreement.</p>
                            <p className="text-sm">7.2 This Agreement may only be amended by a written document signed by both parties.</p>
                          </div>
                          
                          <div className="mt-12 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                              <div>
                                <p className="text-sm font-medium">CLIENT:</p>
                                <div className="mt-4 border-t border-gray-300 pt-2">
                                  <p className="text-xs text-gray-500">Signature</p>
                                </div>
                                <div className="mt-4 border-t border-gray-300 pt-2">
                                  <p className="text-xs text-gray-500">Name</p>
                                </div>
                                <div className="mt-4 border-t border-gray-300 pt-2">
                                  <p className="text-xs text-gray-500">Date</p>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium">PROVIDER:</p>
                                <div className="mt-4 border-t border-gray-300 pt-2">
                                  <p className="text-xs text-gray-500">Signature</p>
                                </div>
                                <div className="mt-4 border-t border-gray-300 pt-2">
                                  <p className="text-xs text-gray-500">Name</p>
                                </div>
                                <div className="mt-4 border-t border-gray-300 pt-2">
                                  <p className="text-xs text-gray-500">Date</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Render signature fields */}
                      {signers.map(signer => 
                        signer.fields
                          .filter(field => field.page === currentPage)
                          .map(field => (
                            <div
                              key={field.id}
                              className={`absolute border-2 rounded flex items-center justify-center ${
                                signer.id === activeSignerId 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-gray-300 bg-gray-50'
                              }`}
                              style={{
                                left: `${field.position.x}px`,
                                top: `${field.position.y}px`,
                                width: `${field.position.width}px`,
                                height: `${field.position.height}px`,
                                cursor: signer.id === activeSignerId ? 'move' : 'not-allowed'
                              }}
                              onMouseDown={(e) => {
                                if (signer.id === activeSignerId) {
                                  handleDragStart(e, field);
                                }
                              }}
                            >
                              <div className="flex flex-col items-center justify-center w-full h-full">
                                <div className="flex items-center gap-1">
                                  {getFieldIcon(field.type)}
                                  <span className="text-xs font-medium truncate max-w-[80px]">
                                    {signer.name || `Recipient ${signer.id}`}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">{field.label}</span>
                              </div>
                              {signer.id === activeSignerId && (
                                <button
                                  className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 border border-gray-300 text-gray-500 hover:text-red-500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveField(signer.id, field.id);
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))
                      )}
                      
                      {/* Cursor indicator when field type is selected */}
                      {selectedFieldType && (
                        <div className="fixed pointer-events-none text-primary opacity-70">
                          {getFieldIcon(selectedFieldType)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('recipients')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('message')}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                Continue
              </button>
            </div>
          </div>
        );
      
      case 'message':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Customize Email</h3>
              <p className="text-sm text-gray-500">
                Personalize the message that will be sent to recipients
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Message
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('fields')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('review')}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                Continue
              </button>
            </div>
          </div>
        );
      
      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Review and Send</h3>
              <p className="text-sm text-gray-500">
                Review the document and recipient details before sending
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Document</h4>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{document?.title || 'Document'}</p>
                    <p className="text-xs text-gray-500">{document?.fileName || 'document.pdf'}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recipients</h4>
                <div className="space-y-3">
                  {signers.map((signer) => (
                    <div key={signer.id} className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{signer.name}</p>
                        <p className="text-xs text-gray-500">{signer.email}</p>
                        <p className="text-xs text-gray-500">{signer.role || 'No role specified'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {signer.fields.length} field{signer.fields.length !== 1 ? 's' : ''} to complete
                        </p>
                      </div>
                      <button
                        onClick={() => handlePreviewEmail(signer)}
                        className="px-3 py-1 text-xs text-primary bg-primary/10 rounded hover:bg-primary/20"
                      >
                        Preview Email
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Email Message</h4>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">{emailSubject}</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{emailMessage}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('message')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSendForSignature}
                disabled={isSending || sendComplete}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                      <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : sendComplete ? (
                  <>
                    <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Sent!
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send for Signature
                  </>
                )}
              </button>
            </div>
            
            {sendComplete && (
              <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-400 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Document sent successfully! Recipients will receive an email with instructions to sign.
                    </p>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-2 py-1.5 rounded-md text-sm font-medium text-green-700 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Prepare Document for Signature"
        maxWidth="5xl"
      >
        {renderStep()}
      </Modal>
      
      {/* Email Preview Modal */}
      {selectedSigner && (
        <SignatureEmailPreview
          isOpen={showEmailPreview}
          onClose={() => setShowEmailPreview(false)}
          document={document}
          signerName={selectedSigner.name}
          signerEmail={selectedSigner.email}
          signerRole={selectedSigner.role}
          fields={selectedSigner.fields}
        />
      )}
    </>
  );
}