import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../Modal';
import ReactMarkdown from 'react-markdown';
import { analyzeContract } from '../../lib/contractAnalysis';

interface ContractAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { 
    title: string;
    summary: string;
    keyTerms: string[];
    risks: string[];
    recommendations: string[];
    file?: File;
  }) => void;
}

export default function ContractAnalysisModal({ isOpen, onClose, onSave }: ContractAnalysisModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    title: string;
    summary: string;
    keyTerms: string[];
    risks: string[];
    recommendations: string[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'keyTerms' | 'risks' | 'recommendations'>('summary');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || 
          file.type === 'application/msword' || 
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.type === 'text/plain') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please upload a PDF, Word document, or text file');
        setSelectedFile(null);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeContract(selectedFile);
      setAnalysis(result);
    } catch (err) {
      console.error('Error analyzing contract:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to analyze the contract. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!analysis) return;
    
    onSave({
      ...analysis,
      file: selectedFile || undefined
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSelectedFile(null);
        setAnalysis(null);
        setError(null);
        setIsAnalyzing(false);
        onClose();
      }}
      title="AI Contract Analysis"
      maxWidth="5xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {!analysis ? (
          <>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderLeft: `4px solid var(--primary)`, padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex' }}>
                <div style={{ flexShrink: 0 }}>
                  <img src="/TM-File-negro.svg" className="pxi-lg icon-muted" alt="" />
                </div>
                <div style={{ marginLeft: '12px' }}>
                  <p style={{ fontSize: '14px', color: 'rgba(59, 130, 246, 0.7)' }}>
                    Upload a contract to analyze. Our AI will extract key information, identify potential risks, and provide recommendations.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ border: `2px dashed var(--border)`, borderRadius: 0, padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/TM-Upload-negro.svg" className="pxi-xl icon-muted" alt="" style={{ marginBottom: '16px' }} />
                <div style={{ textAlign: 'center' }}>
                  {selectedFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--t1)' }}>
                        {selectedFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        style={{ padding: '4px', color: 'var(--t3)' }}
                        className="hover:opacity-80"
                      >
                        <img src="/TM-Close-negro.svg" className="pxi-md icon-muted" alt="" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: '14px', color: 'var(--t2)' }}>
                        Drag and drop your file here, or{' '}
                        <label style={{ color: 'var(--primary)', cursor: 'pointer' }} className="hover:opacity-80">
                          browse
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                          />
                        </label>
                      </p>
                      <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--t2)' }}>
                        PDF, Word documents, or text files up to 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: `4px solid #dc2626`, padding: '16px' }}>
                <div style={{ display: 'flex' }}>
                  <div style={{ flexShrink: 0 }}>
                    <img src="/TM-Info-negro.svg" className="pxi-lg icon-muted" alt="" />
                  </div>
                  <div style={{ marginLeft: '12px' }}>
                    <p style={{ fontSize: '14px', color: 'rgba(239, 68, 68, 0.8)' }}>{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '8px 16px', fontSize: '14px', fontWeight: '500', color: 'var(--t1)', background: 'var(--surface)', border: `1px solid var(--border)`, borderRadius: 0, cursor: 'pointer' }}
                className="hover:opacity-80"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!selectedFile || isAnalyzing}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '500', color: 'white', background: 'var(--primary)', borderRadius: 0, border: 'none', cursor: 'pointer', opacity: (!selectedFile || isAnalyzing) ? 0.5 : 1 }}
                className="hover:opacity-80"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <img src="/TM-File-negro.svg" className="pxi-md icon-white" alt="" />
                    Analyze Contract
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', borderLeft: `4px solid #22c55e`, padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex' }}>
                <div style={{ flexShrink: 0 }}>
                  <img src="/The Manager_Iconografia-11.svg" className="pxi-lg icon-green" alt="" />
                </div>
                <div style={{ marginLeft: '12px' }}>
                  <p style={{ fontSize: '14px', color: 'rgba(34, 197, 94, 0.8)' }}>
                    Analysis complete! Review the results below.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--t1)', marginBottom: '8px' }}>{analysis.title}</h2>
              <p style={{ fontSize: '14px', color: 'var(--t2)', marginBottom: '16px' }}>
                Analyzed from: {selectedFile?.name}
              </p>
            </div>

            <div style={{ borderBottom: `1px solid var(--border)` }}>
              <nav style={{ display: 'flex', gap: '32px', marginBottom: '-1px' }}>
                <button
                  onClick={() => setActiveTab('summary')}
                  style={{
                    paddingBottom: '16px',
                    paddingLeft: '4px',
                    paddingRight: '4px',
                    borderBottom: activeTab === 'summary' ? `2px solid var(--primary)` : `2px solid transparent`,
                    fontWeight: '500',
                    fontSize: '14px',
                    color: activeTab === 'summary' ? 'var(--primary)' : 'var(--t2)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  className="hover:opacity-80"
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('keyTerms')}
                  style={{
                    paddingBottom: '16px',
                    paddingLeft: '4px',
                    paddingRight: '4px',
                    borderBottom: activeTab === 'keyTerms' ? `2px solid var(--primary)` : `2px solid transparent`,
                    fontWeight: '500',
                    fontSize: '14px',
                    color: activeTab === 'keyTerms' ? 'var(--primary)' : 'var(--t2)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  className="hover:opacity-80"
                >
                  Key Terms
                </button>
                <button
                  onClick={() => setActiveTab('risks')}
                  style={{
                    paddingBottom: '16px',
                    paddingLeft: '4px',
                    paddingRight: '4px',
                    borderBottom: activeTab === 'risks' ? `2px solid var(--primary)` : `2px solid transparent`,
                    fontWeight: '500',
                    fontSize: '14px',
                    color: activeTab === 'risks' ? 'var(--primary)' : 'var(--t2)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  className="hover:opacity-80"
                >
                  Risks
                </button>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  style={{
                    paddingBottom: '16px',
                    paddingLeft: '4px',
                    paddingRight: '4px',
                    borderBottom: activeTab === 'recommendations' ? `2px solid var(--primary)` : `2px solid transparent`,
                    fontWeight: '500',
                    fontSize: '14px',
                    color: activeTab === 'recommendations' ? 'var(--primary)' : 'var(--t2)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  className="hover:opacity-80"
                >
                  Recommendations
                </button>
              </nav>
            </div>

            <div style={{ marginTop: '16px', maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
              {activeTab === 'summary' && (
                <div>
                  <ReactMarkdown>{analysis.summary}</ReactMarkdown>
                </div>
              )}

              {activeTab === 'keyTerms' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {analysis.keyTerms.map((term, index) => (
                    <div key={index} style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <ReactMarkdown>{term}</ReactMarkdown>
                        </div>
                        <button
                          onClick={() => copyToClipboard(term)}
                          style={{ padding: '4px', color: 'var(--t3)' }}
                          className="hover:opacity-80"
                        >
                          <img src="/TM-Copy-negro.svg" className="pxi-md icon-muted" alt="" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'risks' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {analysis.risks.map((risk, index) => (
                    <div key={index} style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <ReactMarkdown>{risk}</ReactMarkdown>
                        </div>
                        <button
                          onClick={() => copyToClipboard(risk)}
                          style={{ padding: '4px', color: 'var(--t3)' }}
                          className="hover:opacity-80"
                        >
                          <img src="/TM-Copy-negro.svg" className="pxi-md icon-muted" alt="" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'recommendations' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {analysis.recommendations.map((recommendation, index) => (
                    <div key={index} style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <ReactMarkdown>{recommendation}</ReactMarkdown>
                        </div>
                        <button
                          onClick={() => copyToClipboard(recommendation)}
                          style={{ padding: '4px', color: 'var(--t3)' }}
                          className="hover:opacity-80"
                        >
                          <img src="/TM-Copy-negro.svg" className="pxi-md icon-muted" alt="" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: `1px solid var(--border)` }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setAnalysis(null);
                  setError(null);
                }}
                style={{ padding: '8px 16px', fontSize: '14px', fontWeight: '500', color: 'var(--t1)', background: 'var(--surface)', border: `1px solid var(--border)`, borderRadius: 0, cursor: 'pointer' }}
                className="hover:opacity-80"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '500', color: 'white', background: 'var(--primary)', borderRadius: 0, border: 'none', cursor: 'pointer' }}
                className="hover:opacity-80"
              >
                <img src="/TM-File-negro.svg" className="pxi-md icon-white" alt="" />
                Save Analysis
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}