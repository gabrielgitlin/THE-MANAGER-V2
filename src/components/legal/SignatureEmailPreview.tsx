import React, { useState } from 'react';
import { FileText, User, Calendar, CheckSquare, Edit, FileSignature, X, Check } from 'lucide-react';
import Modal from '../Modal';
import type { LegalDocument } from '../../types';

interface SignatureEmailPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  document: LegalDocument | null;
  signerName: string;
  signerEmail: string;
  signerRole?: string;
  fields: Array<{
    id: string;
    type: 'signature' | 'initial' | 'date' | 'text' | 'checkbox';
    label: string;
    required: boolean;
    page: number;
    position: { x: number; y: number; width: number; height: number };
  }>;
}

export default function SignatureEmailPreview({
  isOpen,
  onClose,
  document,
  signerName,
  signerEmail,
  signerRole,
  fields
}: SignatureEmailPreviewProps) {
  const [currentStep, setCurrentStep] = useState<'email' | 'document' | 'complete'>('email');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(3); // Simulated total pages
  const [completedFields, setCompletedFields] = useState<Record<string, any>>({});
  const [signature, setSignature] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const signatureFieldRef = React.useRef<HTMLDivElement>(null);
  
  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep('email');
      setCurrentPage(1);
      setCompletedFields({});
      setSignature('');
    }
  }, [isOpen]);
  
  // Handle signature drawing
  React.useEffect(() => {
    if (!canvasRef.current || currentStep !== 'document') return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match parent div
    if (signatureFieldRef.current) {
      canvas.width = signatureFieldRef.current.clientWidth;
      canvas.height = signatureFieldRef.current.clientHeight;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    let lastX = 0;
    let lastY = 0;
    
    const draw = (e: MouseEvent) => {
      if (!isDrawing) return;
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
      
      lastX = e.offsetX;
      lastY = e.offsetY;
    };
    
    const startDrawing = (e: MouseEvent) => {
      setIsDrawing(true);
      lastX = e.offsetX;
      lastY = e.offsetY;
    };
    
    const stopDrawing = () => {
      setIsDrawing(false);
      // Save signature as data URL
      setSignature(canvas.toDataURL());
    };
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
    };
  }, [currentStep, isDrawing]);
  
  const clearSignature = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  };
  
  const handleFieldComplete = (fieldId: string, value: any) => {
    setCompletedFields(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };
  
  const allFieldsCompleted = () => {
    return fields.every(field => {
      if (!field.required) return true;
      return completedFields[field.id] !== undefined;
    });
  };
  
  const handleSubmit = () => {
    if (!allFieldsCompleted()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setCurrentStep('complete');
    }, 1500);
  };
  
  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'signature':
        return <FileSignature className="w-4 h-4" />;
      case 'initial':
        return <Edit className="w-4 h-4" />;
      case 'date':
        return <Calendar className="w-4 h-4" />;
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'checkbox':
        return <CheckSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };
  
  const renderField = (field: any) => {
    switch (field.type) {
      case 'signature':
        return (
          <div 
            ref={signatureFieldRef}
            className="border-2 border-dashed border-gray-300 rounded p-2 h-24 flex items-center justify-center bg-white"
          >
            {signature ? (
              <div className="relative w-full h-full">
                <img 
                  src={signature} 
                  alt="Signature" 
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={clearSignature}
                  className="absolute top-1 right-1 p-1 bg-white rounded-full border border-gray-300 text-gray-500 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <canvas 
                ref={canvasRef} 
                className="w-full h-full cursor-crosshair"
              />
            )}
          </div>
        );
      case 'initial':
        return (
          <div className="border-2 border-gray-300 rounded p-2 h-12 flex items-center justify-center bg-white">
            <input
              type="text"
              value={completedFields[field.id] || ''}
              onChange={(e) => handleFieldComplete(field.id, e.target.value)}
              className="w-full h-full text-center border-none focus:ring-0 text-lg font-medium"
              placeholder="Your initials"
            />
          </div>
        );
      case 'date':
        return (
          <div className="border-2 border-gray-300 rounded p-2 flex items-center justify-center bg-white">
            <input
              type="date"
              value={completedFields[field.id] || new Date().toISOString().split('T')[0]}
              onChange={(e) => handleFieldComplete(field.id, e.target.value)}
              className="w-full border-none focus:ring-0"
            />
          </div>
        );
      case 'text':
        return (
          <div className="border-2 border-gray-300 rounded p-2 flex items-center justify-center bg-white">
            <input
              type="text"
              value={completedFields[field.id] || ''}
              onChange={(e) => handleFieldComplete(field.id, e.target.value)}
              className="w-full border-none focus:ring-0"
              placeholder="Enter text"
            />
          </div>
        );
      case 'checkbox':
        return (
          <div className="border-2 border-gray-300 rounded p-2 flex items-center justify-center bg-white">
            <input
              type="checkbox"
              checked={completedFields[field.id] || false}
              onChange={(e) => handleFieldComplete(field.id, e.target.checked)}
              className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
            />
          </div>
        );
      default:
        return null;
    }
  };
  
  const renderEmailStep = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Document Signing Request</h3>
                <p className="text-sm text-gray-500">From: THE MANAGER &lt;documents@themanager.com&gt;</p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-base font-medium text-gray-900">Please sign: {document?.title}</h4>
              <p className="mt-2 text-sm text-gray-600">
                Hello {signerName},
              </p>
              <p className="mt-2 text-sm text-gray-600">
                You have been requested to sign the document "{document?.title}". Please review and sign this document at your earliest convenience.
              </p>
              <p className="mt-4 text-sm text-gray-600">
                Thank you,<br />
                THE MANAGER
              </p>
              
              <div className="mt-6">
                <button
                  onClick={() => setCurrentStep('document')}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                >
                  Review Document
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderDocumentStep = () => {
    const fieldsForCurrentPage = fields.filter(field => field.page === currentPage);
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sign Document</h3>
          <p className="text-sm text-gray-500">
            Please review the document and complete all required fields
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
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
                <div className="bg-white border shadow-sm p-8 min-h-full relative">
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
                  
                  {/* Render signature fields for current page */}
                  {fieldsForCurrentPage.map(field => (
                    <div
                      key={field.id}
                      className="absolute border-2 border-primary bg-primary/5 rounded"
                      style={{
                        left: `${field.position.x}px`,
                        top: `${field.position.y}px`,
                        width: `${field.position.width}px`,
                        height: `${field.position.height}px`,
                      }}
                    >
                      {/* Field content will be rendered in the sidebar */}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/3 space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Required Fields</h4>
            
            {fieldsForCurrentPage.length > 0 ? (
              <div className="space-y-4">
                {fieldsForCurrentPage.map(field => (
                  <div key={field.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getFieldIcon(field.type)}
                      <h5 className="text-sm font-medium text-gray-900">{field.label}</h5>
                      {field.required && (
                        <span className="text-xs text-red-500">Required</span>
                      )}
                    </div>
                    
                    {renderField(field)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                No fields to complete on this page. Navigate to other pages to complete all required fields.
              </p>
            )}
            
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                disabled={!allFieldsCompleted() || isSubmitting}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                      <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Sign Document'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderCompleteStep = () => {
    return (
      <div className="space-y-6">
        <div className="p-8 bg-green-50 rounded-lg text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Document Signed Successfully!</h3>
          <p className="text-sm text-gray-600 mb-6">
            Thank you for signing "{document?.title}". All parties will be notified once everyone has signed the document.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        currentStep === 'email' 
          ? 'Document Signing Request' 
          : currentStep === 'document'
            ? `Sign: ${document?.title || 'Document'}`
            : 'Signing Complete'
      }
      maxWidth="5xl"
    >
      {currentStep === 'email' && renderEmailStep()}
      {currentStep === 'document' && renderDocumentStep()}
      {currentStep === 'complete' && renderCompleteStep()}
    </Modal>
  );
}