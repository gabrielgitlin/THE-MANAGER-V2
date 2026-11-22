import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Image, Music, Plus } from 'lucide-react';
import { formatDate } from '../../../lib/utils';
import type { Show, ProductionFile } from '../../../types';
import AssetInput from '../../../components/assets/AssetInput';
import type { AssetSubmission } from '../../../lib/assetSources';


const FILE_TYPES = [
  { id: 'tech_rider', label: 'Technical Rider', icon: FileText },
  { id: 'hospitality_rider', label: 'Hospitality Rider', icon: FileText },
  { id: 'stage_plot', label: 'Stage Plot', icon: Image },
  { id: 'input_list', label: 'Input List', icon: FileText },
  { id: 'backline', label: 'Backline Requirements', icon: Music },
  { id: 'visuals', label: 'Visual Assets', icon: Image },
];

export default function Production() {
  const navigate = useNavigate();
  const [shows] = useState<Show[]>([]);
  const [files, setFiles] = useState<Record<number, ProductionFile[]>>({});
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const handleAssetSubmit = (showId: number, type: string, submission: AssetSubmission) => {
    let url = '';
    let name = submission.name;
    if (submission.sourceType === 'upload' && submission.file) {
      url = URL.createObjectURL(submission.file);
      name = name || submission.file.name;
    } else if (submission.url) {
      url = submission.url;
    } else {
      return;
    }

    const newFile: ProductionFile = {
      id: Math.max(0, ...Object.values(files).flat().map(f => f.id)) + 1,
      name,
      type,
      url,
      sourceType: submission.sourceType,
      uploadedAt: new Date(),
      uploadedBy: 'Peter Grant',
      version: '1.0',
    };

    setFiles(prev => ({
      ...prev,
      [showId]: [...(prev[showId] || []), newFile],
    }));

    setIsUploading(false);
    setUploadType('');
  };

  const handleDeleteFile = (showId: number, fileId: number) => {
    setFiles(prev => ({
      ...prev,
      [showId]: prev[showId].filter(f => f.id !== fileId),
    }));
    setShowDeleteConfirm(null);
  };

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/live')}
          className="flex items-center gap-2 text-sm mb-4 hover:opacity-80"
          style={{ color: 'var(--t3)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Live Events
        </button>
      </div>

      {/* Show Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--t1)' }}>
          Select Show
        </label>
        <select
          value={selectedShow?.id || ''}
          onChange={(e) => setSelectedShow(shows.find(s => s.id === parseInt(e.target.value)) || null)}
          className="block w-full rounded-md shadow-sm focus:ring-primary sm:text-sm"
          style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
        >
          <option value="">Select a show</option>
          {shows.map((show) => (
            <option key={show.id} value={show.id}>
              {show.title} - {formatDate(show.date)}
            </option>
          ))}
        </select>
      </div>

      {selectedShow && (
        <div className="shadow rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium" style={{ color: 'var(--t1)' }}>{selectedShow.title}</h2>
                <p className="text-sm" style={{ color: 'var(--t3)' }}>
                  {formatDate(selectedShow.date)}
                </p>
              </div>
              <button
                onClick={() => setIsUploading(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md hover:opacity-80"
                style={{ backgroundColor: 'var(--brand-1)', color: 'var(--t1)' }}
              >
                <img src="/TM-Upload-negro.svg" className="pxi-md icon-white" alt="" />
                Upload File
              </button>
            </div>
          </div>

          {/* File Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FILE_TYPES.map(({ id: type, label, icon: Icon }) => {
                const file = files[selectedShow.id]?.find(f => f.type === type);
                
                return (
                  <div
                    key={type}
                    className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{label}</h3>
                          {file ? (
                            <p className="text-xs text-gray-500">
                              Version {file.version} • Updated {formatDate(file.uploadedAt)}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500">No file uploaded</p>
                          )}
                        </div>
                      </div>
                      {file ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-gray-500"
                          >
                            <img src="/TM-ExternalLink-negro.svg" className="pxi-md icon-muted" alt="" />
                          </a>
                          <button
                            onClick={() => window.open(file.url, '_blank')}
                            className="p-1 text-gray-400 hover:text-gray-500"
                          >
                            <img src="/TM-Download-negro.svg" className="pxi-md icon-muted" alt="" />
                          </button>
                          {showDeleteConfirm === file.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeleteFile(selectedShow.id, file.id)}
                                className="px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowDeleteConfirm(file.id)}
                              className="p-1 text-gray-400 hover:text-red-500"
                            >
                              <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setIsUploading(true);
                            setUploadType(type);
                          }}
                          className="p-1 text-gray-400 hover:text-primary"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploading && selectedShow && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => {
              setIsUploading(false);
              setUploadType('');
            }} />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Upload File</h3>
                <button
                  onClick={() => {
                    setIsUploading(false);
                    setUploadType('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <img src="/TM-Close-negro.svg" className="pxi-lg icon-muted" alt="" />
                </button>
              </div>
              
              <div className="p-6">
                {!uploadType ? (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Select File Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {FILE_TYPES.map(({ id: type, label, icon: Icon }) => (
                        <button
                          key={type}
                          onClick={() => setUploadType(type)}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                        >
                          <Icon className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Add {FILE_TYPES.find(t => t.id === uploadType)?.label}
                    </label>
                    <AssetInput
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      onSubmit={(submission) => handleAssetSubmit(selectedShow.id, uploadType, submission)}
                      submitLabel="Attach"
                      resetOnSubmit={false}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}