import React, { useState } from 'react';
import Modal from '../Modal';
import PerformanceAgreementEditor from './PerformanceAgreementEditor';
import AssetInput from '../assets/AssetInput';
import type { AssetSubmission } from '../../lib/assetSources';

export interface AddDocumentSubmission {
  type: 'template' | 'upload';
  // For template flow
  template?: string;
  // For upload/link flow
  file?: File;
  externalLink?: {
    sourceType: AssetSubmission['sourceType'];
    url: string;
    name?: string;
  };
}

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddDocumentSubmission) => void;
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

  const handleAssetSubmit = (submission: AssetSubmission) => {
    if (submission.sourceType === 'upload' && submission.file) {
      onSubmit({ type: 'upload', file: submission.file });
    } else if (submission.url) {
      onSubmit({
        type: 'upload',
        externalLink: {
          sourceType: submission.sourceType,
          url: submission.url,
          name: submission.name,
        },
      });
    }
    setStep('select');
    onClose();
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
        onClose();
      }}
      title="Add New Document"
    >
      {step === 'select' ? (
        <div className="space-y-4">
          <button
            onClick={() => setStep('template')}
            className="w-full p-6 text-left border transition-colors"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <img src="/TM-File-negro.svg" className="pxi-xl icon-muted" alt="" />
              </div>
              <div>
                <h3 className="font-medium" style={{ color: 'var(--t1)' }}>Use a Template</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--t3)' }}>
                  Start with a pre-configured document template
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStep('upload')}
            className="w-full p-6 text-left border transition-colors"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <img src="/TM-Upload-negro.svg" className="pxi-xl icon-muted" alt="" />
              </div>
              <div>
                <h3 className="font-medium" style={{ color: 'var(--t1)' }}>Upload Document</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--t3)' }}>
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
                className="block p-4 border rounded-lg cursor-pointer transition-colors"
                style={{
                  borderColor: selectedTemplate === template.id ? 'var(--primary)' : 'var(--border)',
                  background: selectedTemplate === template.id ? 'var(--surface-2)' : 'var(--surface)'
                }}
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
                    <p className="font-medium" style={{ color: 'var(--t1)' }}>{template.name}</p>
                    <p className="text-sm" style={{ color: 'var(--t3)' }}>{template.description}</p>
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
              className="px-4 py-2 text-sm font-medium border"
              style={{ color: 'var(--t1)', background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              Back
            </button>
            <button
              onClick={() => setStep('edit')}
              disabled={!selectedTemplate}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:opacity-80 disabled:opacity-50"
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
        <div className="space-y-4">
          <AssetInput
            accept=".pdf,.doc,.docx"
            onSubmit={handleAssetSubmit}
            submitLabel="Add Document"
            resetOnSubmit={false}
          />
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setStep('select')}
              className="px-4 py-2 text-sm font-medium border"
              style={{ color: 'var(--t1)', background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}