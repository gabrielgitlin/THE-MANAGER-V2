import React, { useState } from 'react';
import { FileText, Upload, Plus, X } from 'lucide-react';
import Modal from '../Modal';
import PerformanceAgreementEditor from './PerformanceAgreementEditor';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { type: 'template' | 'upload', file?: File, template?: string }) => void;
}

const TEMPLATES = [
  {
    id: 'performance_agreement',
    name: 'Performance Agreement',
    description: 'Standard agreement for live performances and appearances',
  },
  {
    id: 'producer_agreement',
    name: 'Producer Agreement',
    description: 'Agreement between artist and producer outlining terms and royalties',
  },
  {
    id: 'collaborator_agreement',
    name: 'Collaborator Agreement',
    description: 'Agreement for musical collaborations and rights sharing',
  },
  {
    id: 'remixer_agreement',
    name: 'Remixer Agreement',
    description: 'Agreement for remix rights and compensation',
  },
  {
    id: 'work_for_hire',
    name: 'Work For Hire Agreement',
    description: 'Agreement for commissioned work and ownership transfer',
  },
  {
    id: 'nda',
    name: 'Non Disclosure Agreement',
    description: 'Confidentiality agreement for sensitive information',
  },
  {
    id: 'management_agreement',
    name: 'Management Agreement',
    description: 'Agreement between artist and management company',
  },
  {
    id: 'record_agreement',
    name: 'Record Agreement',
    description: 'Agreement between artist and record label for recording and distribution',
  },
];

export default function AddDocumentModal({ isOpen, onClose, onSubmit }: AddDocumentModalProps) {
  const [step, setStep] = useState<'select' | 'template' | 'upload' | 'edit'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onSubmit({
        type: 'upload',
        file: selectedFile
      });
      setSelectedFile(null);
      setStep('select');
      onClose();
    }
  };

  const handleTemplateSubmit = (data: any) => {
    // In a real app, this would generate a PDF from the template data
    console.log('Template data:', data);
    
    // For now, we'll just pass the data to the parent
    onSubmit({ 
      type: 'template', 
      template: selectedTemplate,
      data 
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setStep('select');
        setSelectedTemplate('');
        setSelectedFile(null);
        onClose();
      }}
      title="Add New Document"
    >
      {step === 'select' ? (
        <div className="space-y-4">
          <button
            onClick={() => setStep('template')}
            className="w-full p-6 text-left border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Use a Template</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start with a pre-configured document template
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStep('upload')}
            className="w-full p-6 text-left border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Upload Document</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload an existing document from your computer
                </p>
              </div>
            </div>
          </button>
        </div>
      ) : step === 'template' ? (
        <div className="space-y-6">
          <div className="space-y-4">
            {TEMPLATES.map((template) => (
              <label
                key={template.id}
                className={`block p-4 border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors ${
                  selectedTemplate === template.id ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="template"
                    value={template.id}
                    checked={selectedTemplate === template.id}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{template.name}</p>
                    <p className="text-sm text-gray-500">{template.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setStep('select');
                setSelectedTemplate('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep('edit')}
              disabled={!selectedTemplate}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      ) : step === 'edit' ? (
        <PerformanceAgreementEditor
          isOpen={true}
          onClose={() => setStep('template')}
          onSave={handleTemplateSubmit}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 text-gray-400 mb-4" />
                <div className="text-center">
                  {selectedFile ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {selectedFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-1 text-gray-400 hover:text-gray-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500">
                        Drag and drop your file here, or{' '}
                        <label className="text-primary hover:text-primary/80 cursor-pointer">
                          browse
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setSelectedFile(file);
                            }}
                          />
                        </label>
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        PDF, Word documents up to 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setStep('select');
                setSelectedFile(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!selectedFile}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Upload Document
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}