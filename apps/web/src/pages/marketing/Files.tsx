import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Filter, Plus, Image, Video, Folder, FolderOpen } from 'lucide-react';
import Modal from '../../components/Modal';

interface MarketingFile {
  id: string;
  name: string;
  type: 'document' | 'image' | 'video' | 'other';
  size: number;
  url: string;
  uploadDate: Date;
  uploadedBy: string;
  description?: string;
  tags: string[];
  folder: string;
}


export default function Files() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<MarketingFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MarketingFile | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folders, setFolders] = useState<string[]>([]);

  // Filter files based on search, type, and folder
  const filteredFiles = files.filter(file => {
    const matchesSearch = 
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'all' || file.type === selectedType;
    const matchesFolder = selectedFolder === 'all' || file.folder === selectedFolder;
    
    return matchesSearch && matchesType && matchesFolder;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    // Create new file objects
    const newFiles = Array.from(fileList).map(file => {
      const fileType = file.type.startsWith('image/') 
        ? 'image' 
        : file.type.startsWith('video/') 
          ? 'video' 
          : file.type.includes('pdf') || file.type.includes('document') || file.type.includes('sheet')
            ? 'document'
            : 'other';
      
      return {
        id: `new-${Date.now()}-${file.name}`,
        name: file.name,
        type: fileType as 'document' | 'image' | 'video' | 'other',
        size: file.size,
        url: URL.createObjectURL(file),
        uploadDate: new Date(),
        uploadedBy: 'Peter Grant',
        tags: [],
        folder: selectedFolder === 'all' ? 'Uncategorized' : selectedFolder
      };
    });
    
    setFiles([...newFiles, ...files]);
    setIsUploadModalOpen(false);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    setFolders([...folders, newFolderName.trim()]);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleDeleteFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
    setShowDeleteConfirm(null);
  };

  const handleShareFile = (file: MarketingFile) => {
    setSelectedFile(file);
    setIsShareModalOpen(true);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <img src="/TM-File-negro.svg" className="pxi-lg icon-white" alt="" />;
      case 'image':
        return <Image className="w-5 h-5 text-green-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-500" />;
      default:
        return <img src="/TM-File-negro.svg" className="pxi-lg icon-muted" alt="" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/marketing')}
          className="flex items-center gap-2 text-sm hover:text-gray-700 mb-4"
          style={{ color: 'var(--t2)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Marketing
        </button>
      </div>

      <div className="shadow-md" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <img src="/TM-Search-negro.svg" className="pxi-lg icon-muted absolute left-3 top-1/2 -translate-y-1/2" alt="" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="block shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
              >
                <option value="all">All Types</option>
                <option value="document">Documents</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="other">Other</option>
              </select>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                <img src="/TM-Upload-negro.svg" className="pxi-md icon-white" alt="" />
                Upload
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Folders Sidebar */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium" style={{ color: 'var(--t1)' }}>Folders</h2>
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="p-1  hover:opacity-80"
                style={{ color: 'var(--t2)' }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {isCreatingFolder ? (
              <div className="flex items-center gap-2 p-2 " style={{ backgroundColor: 'var(--surface-2)' }}>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  style={{ backgroundColor: 'var(--surface-3)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                  placeholder="Folder name"
                  autoFocus
                />
                <button
                  onClick={handleCreateFolder}
                  className="p-1 text-primary hover:text-primary/80"
                >
                  <img src="/The Manager_Iconografia-11.svg" className="pxi-md icon-green" alt="" />
                </button>
                <button
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }}
                  className="p-1 text-gray-400" style={{ color: 'var(--t3)' }} hover:text-gray-600"
                >
                  <img src="/TM-Close-negro.svg" className="pxi-md icon-muted" alt="" />
                </button>
              </div>
            ) : null}

            <button
              onClick={() => setSelectedFolder('all')}
              className={`flex items-center gap-2 w-full p-2 text-left  ${
                selectedFolder === 'all' ? 'bg-primary/10 text-primary' : 'hover:opacity-80'
              }`}
            >
              <Folder className="w-4 h-4" />
              <span className="text-sm">All Files</span>
            </button>

            {folders.map(folder => (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`flex items-center gap-2 w-full p-2 text-left  ${
                  selectedFolder === folder ? 'hover:opacity-80' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: selectedFolder === folder ? 'var(--surface-2)' : 'transparent',
                  color: selectedFolder === folder ? 'var(--brand-1)' : 'var(--t1)',
                }}
              >
                {selectedFolder === folder ? (
                  <FolderOpen className="w-4 h-4" />
                ) : (
                  <Folder className="w-4 h-4" />
                )}
                <span className="text-sm">{folder}</span>
              </button>
            ))}
          </div>

          {/* Files Grid */}
          <div className="md:col-span-3">
            {filteredFiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFiles.map(file => (
                  <div
                    key={file.id}
                    className=" overflow-hidden hover:shadow-md transition-shadow"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}
                  >
                    <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 " style={{ backgroundColor: 'var(--surface-3)' }}>
                            {getFileIcon(file.type)}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium break-all" style={{ color: 'var(--t1)' }}>{file.name}</h3>
                            <p className="text-xs" style={{ color: 'var(--t2)' }}>
                              {formatFileSize(file.size)} • {file.uploadDate.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {file.description && (
                      <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-xs" style={{ color: 'var(--t2)' }}>{file.description}</p>
                      </div>
                    )}
                    
                    {file.tags.length > 0 && (
                      <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex flex-wrap gap-1">
                          {file.tags.map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5  text-xs font-medium"
                              style={{ backgroundColor: 'var(--surface-3)', color: 'var(--t1)' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-2 flex justify-end gap-1">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1  hover:opacity-80"
                        style={{ color: 'var(--t2)' }}
                      >
                        <img src="/TM-ExternalLink-negro.svg" className="pxi-md icon-muted" alt="" />
                      </a>
                      <a
                        href={file.url}
                        download={file.name}
                        className="p-1  hover:opacity-80"
                        style={{ color: 'var(--t2)' }}
                      >
                        <img src="/TM-Download-negro.svg" className="pxi-md icon-muted" alt="" />
                      </a>
                      <button
                        onClick={() => handleShareFile(file)}
                        className="p-1  hover:opacity-80"
                        style={{ color: 'var(--t2)' }}
                      >
                        <img src="/TM-Share-negro.svg" className="pxi-md icon-muted" alt="" />
                      </button>
                      {showDeleteConfirm === file.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-1 text-white bg-red-500  hover:bg-red-600"
                          >
                            <img src="/The Manager_Iconografia-11.svg" className="pxi-md icon-green" alt="" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="p-1 text-gray-400" style={{ color: 'var(--t3)' }} hover:text-gray-600  hover:opacity-80"
                          >
                            <img src="/TM-Close-negro.svg" className="pxi-md icon-muted" alt="" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirm(file.id)}
                          className="p-1 text-gray-400" style={{ color: 'var(--t3)' }} hover:text-red-500  hover:opacity-80"
                        >
                          <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <img src="/TM-File-negro.svg" className="pxi-xl icon-muted mx-auto" alt="" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
                <p className="mt-1 text-sm text-gray-500" style={{ color: 'var(--t3)' }}">
                  {files.length > 0 
                    ? 'Try adjusting your search or filters'
                    : 'Get started by uploading your first file'}
                </p>
                {files.length === 0 && (
                  <div className="mt-6">
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <img src="/TM-Upload-negro.svg" className="pxi-lg icon-white -ml-1 mr-2" alt="" />
                      Upload File
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Files"
      >
        <div className="space-y-6">
          <div className="border-2 border-dashed  p-6" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-col items-center justify-center">
              <img src="/TM-Upload-negro.svg" className="pxi-xl icon-muted mb-4" alt="" />
              <div className="text-center">
                <p className="text-sm" style={{ color: 'var(--t2)' }}>
                  Drag and drop your files here, or{' '}
                  <label className="text-primary hover:text-primary/80 cursor-pointer">
                    browse
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleFileUpload}
                    />
                  </label>
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--t2)' }}>
                  PDF, Word, Excel, JPG, PNG, MP4 up to 50MB
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
              Folder
            </label>
            <select
              value={selectedFolder === 'all' ? '' : selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value || 'all')}
              className="mt-1 block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
            >
              <option value="">Select a folder</option>
              {folders.map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setSelectedFile(null);
        }}
        title="Share File"
      >
        {selectedFile && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 " style={{ backgroundColor: 'var(--surface-2)' }}>
              {getFileIcon(selectedFile.type)}
              <div>
                <h3 className="text-sm font-medium" style={{ color: 'var(--t1)' }}>{selectedFile.name}</h3>
                <p className="text-xs" style={{ color: 'var(--t2)' }}>
                  {formatFileSize(selectedFile.size)} • Uploaded by {selectedFile.uploadedBy}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
                Share Link
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  value={selectedFile.url}
                  readOnly
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:border-primary focus:ring-primary sm:text-sm"
                  style={{ backgroundColor: 'var(--surface-3)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedFile.url);
                    alert('Link copied to clipboard!');
                  }}
                  className="inline-flex items-center px-3 py-2 border border-l-0 rounded-r-md hover:opacity-80"
                  style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t2)', borderColor: 'var(--border)' }}
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
                Share with Team Members
              </label>
              <div className="mt-1">
                <select
                  className="block w-full rounded-none shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                >
                  <option value="">Select team member</option>
                  <option value="1">Sarah Johnson</option>
                  <option value="2">Mike Williams</option>
                  <option value="3">Richard Cole</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsShareModalOpen(false);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-50"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', border: `1px solid var(--border)` }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // In a real app, this would send the share invitation
                  alert('Share invitation sent!');
                  setIsShareModalOpen(false);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                Share
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}