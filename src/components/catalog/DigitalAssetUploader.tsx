import React, { useState } from 'react';
import { Upload, X, FileText, Image, Music, Video, File, Plus, Download, Trash2, ExternalLink } from 'lucide-react';

export type AssetCategory = 'artwork' | 'audio' | 'video' | 'document' | 'other';

export interface DigitalAsset {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  category: AssetCategory;
  uploadDate: string;
  uploadedBy: string;
  description?: string;
  tags?: string[];
}

interface DigitalAssetUploaderProps {
  assets: DigitalAsset[];
  onAssetAdd: (asset: DigitalAsset) => void;
  onAssetDelete: (assetId: string) => void;
  onAssetUpdate: (asset: DigitalAsset) => void;
  entityId: number;
  entityType: 'track' | 'album';
}

export default function DigitalAssetUploader({
  assets,
  onAssetAdd,
  onAssetDelete,
  onAssetUpdate,
  entityId,
  entityType
}: DigitalAssetUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('other');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AssetCategory | 'all'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Auto-detect category based on file type
      const fileType = file.type.split('/')[0];
      if (fileType === 'image') {
        setSelectedCategory('artwork');
      } else if (fileType === 'audio') {
        setSelectedCategory('audio');
      } else if (fileType === 'video') {
        setSelectedCategory('video');
      } else if (fileType === 'application' || fileType === 'text') {
        setSelectedCategory('document');
      } else {
        setSelectedCategory('other');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    
    // In a real app, you would upload to a storage service here
    // For demo purposes, we'll simulate a successful upload after a delay
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      
      // Create a new asset object
      const newAsset: DigitalAsset = {
        id: `asset-${Date.now()}`,
        name: selectedFile.name,
        url: URL.createObjectURL(selectedFile), // In a real app, this would be the URL from your storage service
        size: selectedFile.size,
        type: selectedFile.type,
        category: selectedCategory,
        uploadDate: new Date().toISOString(),
        uploadedBy: 'Current User',
        description: description,
        tags: tags.length > 0 ? tags : undefined
      };
      
      onAssetAdd(newAsset);
      
      // Reset form
      setSelectedFile(null);
      setDescription('');
      setTags([]);
      setNewTag('');
      setIsUploading(false);
      setShowUploadForm(false);
    }, 2000);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const filteredAssets = assets.filter(asset => 
    activeCategory === 'all' || asset.category === activeCategory
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAssetIcon = (asset: DigitalAsset) => {
    switch (asset.category) {
      case 'artwork':
        return <Image className="w-5 h-5 text-blue-500" />;
      case 'audio':
        return <Music className="w-5 h-5 text-green-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-orange-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium text-gray-900">Digital Assets</h2>
          <span className="text-sm text-gray-500">({assets.length})</span>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-900">Upload New Asset</h3>
            <button
              onClick={() => setShowUploadForm(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {!selectedFile ? (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  <span className="font-medium text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, MP3, MP4, PDF, DOC up to 10MB
                </p>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedFile.type.startsWith('image/') ? (
                      <Image className="w-5 h-5 text-blue-500" />
                    ) : selectedFile.type.startsWith('audio/') ? (
                      <Music className="w-5 h-5 text-green-500" />
                    ) : selectedFile.type.startsWith('video/') ? (
                      <Video className="w-5 h-5 text-purple-500" />
                    ) : selectedFile.type.startsWith('application/') || selectedFile.type.startsWith('text/') ? (
                      <FileText className="w-5 h-5 text-orange-500" />
                    ) : (
                      <File className="w-5 h-5 text-gray-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isUploading && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 text-right">{uploadProgress}%</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as AssetCategory)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="artwork">Artwork</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Optional description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Add tags"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setDescription('');
                  setTags([]);
                  setNewTag('');
                  setShowUploadForm(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md ${
            activeCategory === 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveCategory('artwork')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md ${
            activeCategory === 'artwork'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Artwork
        </button>
        <button
          onClick={() => setActiveCategory('audio')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md ${
            activeCategory === 'audio'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Audio
        </button>
        <button
          onClick={() => setActiveCategory('video')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md ${
            activeCategory === 'video'
              ? 'bg-light-blue0 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Video
        </button>
        <button
          onClick={() => setActiveCategory('document')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md ${
            activeCategory === 'document'
              ? 'bg-beige0 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Documents
        </button>
        <button
          onClick={() => setActiveCategory('other')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md ${
            activeCategory === 'other'
              ? 'bg-gray-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Other
        </button>
      </div>

      {/* Assets List */}
      {filteredAssets.length > 0 ? (
        <div className="space-y-3">
          {filteredAssets.map((asset) => (
            <div 
              key={asset.id} 
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getAssetIcon(asset)}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{asset.name}</h3>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(asset.size)} • Uploaded {new Date(asset.uploadDate).toLocaleDateString()}
                    </p>
                    {asset.description && (
                      <p className="mt-1 text-sm text-gray-600">{asset.description}</p>
                    )}
                    {asset.tags && asset.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {asset.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href={asset.url}
                    download={asset.name}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  {showDeleteConfirm === asset.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onAssetDelete(asset.id);
                          setShowDeleteConfirm(null);
                        }}
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
                      onClick={() => setShowDeleteConfirm(asset.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 text-center rounded-lg border border-gray-200">
          <File className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assets found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {assets.length > 0 
              ? 'Try selecting a different category filter'
              : 'Get started by adding your first digital asset'}
          </p>
          {assets.length === 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowUploadForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Add Asset
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}