import React, { useState } from 'react';
import { FileText, Upload, X, Loader2, CheckCheck, AlertTriangle, Download, Copy } from 'lucide-react';
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
      <div className="space-y-6">
        {!analysis ? (
          <>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Upload a contract to analyze. Our AI will extract key information, identify potential risks, and provide recommendations.
                  </p>
                </div>
              </div>
            </div>

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
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                          />
                        </label>
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        PDF, Word documents, or text files up to 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!selectedFile || isAnalyzing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Analyze Contract
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCheck className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Analysis complete! Review the results below.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{analysis.title}</h2>
              <p className="text-sm text-gray-500 mb-4">
                Analyzed from: {selectedFile?.name}
              </p>
            </div>

            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'summary'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('keyTerms')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'keyTerms'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Key Terms
                </button>
                <button
                  onClick={() => setActiveTab('risks')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'risks'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Risks
                </button>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'recommendations'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Recommendations
                </button>
              </nav>
            </div>

            <div className="mt-4 max-h-[400px] overflow-y-auto p-2">
              {activeTab === 'summary' && (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{analysis.summary}</ReactMarkdown>
                </div>
              )}

              {activeTab === 'keyTerms' && (
                <div className="space-y-4">
                  {analysis.keyTerms.map((term, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{term}</ReactMarkdown>
                        </div>
                        <button
                          onClick={() => copyToClipboard(term)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'risks' && (
                <div className="space-y-4">
                  {analysis.risks.map((risk, index) => (
                    <div key={index} className="bg-red-50 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{risk}</ReactMarkdown>
                        </div>
                        <button
                          onClick={() => copyToClipboard(risk)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'recommendations' && (
                <div className="space-y-4">
                  {analysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{recommendation}</ReactMarkdown>
                        </div>
                        <button
                          onClick={() => copyToClipboard(recommendation)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setAnalysis(null);
                  setError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                <FileText className="w-4 h-4" />
                Save Analysis
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}