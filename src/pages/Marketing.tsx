import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import AnalyticsDashboard from '../components/marketing/AnalyticsDashboard';
import { CreditCard as Edit2, Globe, Image, Instagram, Loader2, Plus, Search, Trash2, Twitter, Youtube, Facebook, AlignJustify as TikTok, X, FileText, Download, ExternalLink, Upload, File } from 'lucide-react';
import { formatDate } from '../lib/utils';
import * as postService from '../lib/marketingPostService';
import * as fileService from '../lib/marketingFileService';

type Platform = 'instagram' | 'twitter' | 'facebook' | 'youtube' | 'tiktok';
type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

interface SocialMediaPost {
  id: string;
  title: string;
  content: string;
  platform: Platform;
  scheduledDate: string;
  scheduledTime: string;
  status: PostStatus;
  mediaUrl?: string;
  tags?: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  done?: boolean;
}

interface MarketingFile {
  id: string;
  name: string;
  type: string;
  size: number;
  category: 'press_kit' | 'brand_assets' | 'campaign' | 'analytics' | 'other';
  uploadDate: string;
  uploadedBy: string;
  description?: string;
  url: string;
  shared?: boolean;
  sharedWith?: string[];
}

export default function Marketing() {
  const [activeTab, setActiveTab] = useState('content-calendar');
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [files, setFiles] = useState<MarketingFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialMediaPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [fileCategoryFilter, setFileCategoryFilter] = useState<fileService.FileCategory | 'all'>('all');
  const [editingFile, setEditingFile] = useState<MarketingFile | null>(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [newFile, setNewFile] = useState<Partial<MarketingFile>>({
    name: '',
    category: 'other',
    description: '',
    shared: false,
    sharedWith: []
  });
  const [pendingFileUpload, setPendingFileUpload] = useState<File | null>(null);
  const [newSharedPerson, setNewSharedPerson] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [newPost, setNewPost] = useState<Partial<SocialMediaPost>>({
    title: '',
    content: '',
    platform: 'instagram',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '12:00',
    status: 'draft',
    tags: [],
    author: 'Peter Grant',
    done: false
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fetchedPosts, fetchedFiles] = await Promise.all([
        postService.getPosts(),
        fileService.getFiles()
      ]);

      const mappedPosts: SocialMediaPost[] = fetchedPosts.map(p => ({
        id: p.id,
        title: p.title,
        content: p.content,
        platform: p.platform as Platform,
        scheduledDate: p.scheduled_date,
        scheduledTime: p.scheduled_time,
        status: p.status as PostStatus,
        mediaUrl: p.media_url,
        tags: p.tags,
        author: p.author,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        done: p.done
      }));

      const mappedFiles: MarketingFile[] = fetchedFiles.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        category: f.category,
        uploadDate: f.created_at,
        uploadedBy: f.uploaded_by || 'Unknown',
        description: f.description,
        url: f.file_url,
        shared: f.shared,
        sharedWith: f.shared_with
      }));

      setPosts(mappedPosts);
      setFiles(mappedFiles);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter;
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
    const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
    return dateB.getTime() - dateA.getTime();
  });

  const filteredFiles = files.filter(file => {
    const matchesSearch =
      file.name.toLowerCase().includes(fileSearchTerm.toLowerCase()) ||
      (file.description && file.description.toLowerCase().includes(fileSearchTerm.toLowerCase()));

    const matchesCategory = fileCategoryFilter === 'all' || file.category === fileCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
  });

  const handleAddPost = async () => {
    if (!newPost.title || !newPost.content || !newPost.platform || !newPost.scheduledDate || !newPost.scheduledTime) {
      return;
    }

    setIsSaving(true);
    try {
      const created = await postService.createPost({
        title: newPost.title,
        content: newPost.content,
        platform: newPost.platform as postService.Platform,
        scheduled_date: newPost.scheduledDate,
        scheduled_time: newPost.scheduledTime,
        status: newPost.status as postService.PostStatus,
        media_url: newPost.mediaUrl,
        tags: newPost.tags,
        author: newPost.author || 'Peter Grant'
      });

      const mappedPost: SocialMediaPost = {
        id: created.id,
        title: created.title,
        content: created.content,
        platform: created.platform as Platform,
        scheduledDate: created.scheduled_date,
        scheduledTime: created.scheduled_time,
        status: created.status as PostStatus,
        mediaUrl: created.media_url,
        tags: created.tags,
        author: created.author,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
        done: created.done
      };

      setPosts([mappedPost, ...posts]);
      setNewPost({
        title: '',
        content: '',
        platform: 'instagram',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '12:00',
        status: 'draft',
        tags: [],
        author: 'Peter Grant',
        done: false
      });
      setIsAddingPost(false);
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;

    setIsSaving(true);
    try {
      await postService.updatePost(editingPost.id, {
        title: editingPost.title,
        content: editingPost.content,
        platform: editingPost.platform as postService.Platform,
        scheduled_date: editingPost.scheduledDate,
        scheduled_time: editingPost.scheduledTime,
        status: editingPost.status as postService.PostStatus,
        media_url: editingPost.mediaUrl,
        tags: editingPost.tags,
        done: editingPost.done
      });

      setPosts(posts.map(post =>
        post.id === editingPost.id ? { ...editingPost, updatedAt: new Date().toISOString() } : post
      ));
      setEditingPost(null);
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await postService.deletePost(id);
      setPosts(posts.filter(post => post.id !== id));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleToggleDone = async (id: string) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    const newDone = !post.done;
    setPosts(posts.map(p => p.id === id ? { ...p, done: newDone } : p));

    try {
      await postService.togglePostDone(id, newDone);
    } catch (error) {
      console.error('Error toggling done:', error);
      setPosts(posts.map(p => p.id === id ? { ...p, done: !newDone } : p));
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;

    if (editingPost) {
      const updatedTags = [...(editingPost.tags || []), tagInput.trim()];
      setEditingPost({ ...editingPost, tags: updatedTags });
    } else {
      const updatedTags = [...(newPost.tags || []), tagInput.trim()];
      setNewPost({ ...newPost, tags: updatedTags });
    }

    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    if (editingPost) {
      const updatedTags = editingPost.tags?.filter(t => t !== tag) || [];
      setEditingPost({ ...editingPost, tags: updatedTags });
    } else {
      const updatedTags = newPost.tags?.filter(t => t !== tag) || [];
      setNewPost({ ...newPost, tags: updatedTags });
    }
  };

  const handleFileUpload = async () => {
    if (!pendingFileUpload || !newFile.category) return;

    setIsSaving(true);
    try {
      const uploaded = await fileService.uploadFile(pendingFileUpload, {
        name: newFile.name || pendingFileUpload.name,
        category: newFile.category as fileService.FileCategory,
        description: newFile.description,
        shared: newFile.shared,
        shared_with: newFile.sharedWith
      });

      const mappedFile: MarketingFile = {
        id: uploaded.id,
        name: uploaded.name,
        type: uploaded.type,
        size: uploaded.size,
        category: uploaded.category,
        uploadDate: uploaded.created_at,
        uploadedBy: uploaded.uploaded_by || 'Unknown',
        description: uploaded.description,
        url: uploaded.file_url,
        shared: uploaded.shared,
        sharedWith: uploaded.shared_with
      };

      setFiles([mappedFile, ...files]);
      setNewFile({
        name: '',
        category: 'other',
        description: '',
        shared: false,
        sharedWith: []
      });
      setPendingFileUpload(null);
      setIsFileModalOpen(false);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateFile = async () => {
    if (!editingFile) return;

    setIsSaving(true);
    try {
      await fileService.updateFile(editingFile.id, {
        name: editingFile.name,
        category: editingFile.category as fileService.FileCategory,
        description: editingFile.description,
        shared: editingFile.shared,
        shared_with: editingFile.sharedWith
      });

      setFiles(files.map(file =>
        file.id === editingFile.id ? editingFile : file
      ));
      setEditingFile(null);
      setIsFileModalOpen(false);
    } catch (error) {
      console.error('Error updating file:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFile = async (id: string) => {
    try {
      await fileService.deleteFile(id);
      setFiles(files.filter(file => file.id !== id));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleAddSharedPerson = () => {
    if (!newSharedPerson.trim()) return;

    if (editingFile) {
      const updatedSharedWith = [...(editingFile.sharedWith || []), newSharedPerson.trim()];
      setEditingFile({ ...editingFile, sharedWith: updatedSharedWith, shared: true });
    } else {
      const updatedSharedWith = [...(newFile.sharedWith || []), newSharedPerson.trim()];
      setNewFile({ ...newFile, sharedWith: updatedSharedWith, shared: true });
    }

    setNewSharedPerson('');
  };

  const handleRemoveSharedPerson = (person: string) => {
    if (editingFile) {
      const updatedSharedWith = editingFile.sharedWith?.filter(p => p !== person) || [];
      setEditingFile({
        ...editingFile,
        sharedWith: updatedSharedWith,
        shared: updatedSharedWith.length > 0
      });
    } else {
      const updatedSharedWith = newFile.sharedWith?.filter(p => p !== person) || [];
      setNewFile({
        ...newFile,
        sharedWith: updatedSharedWith,
        shared: updatedSharedWith.length > 0
      });
    }
  };

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'twitter':
        return <Twitter className="w-5 h-5 text-blue-400" />;
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-600" />;
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-600" />;
      case 'tiktok':
        return <TikTok className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (file: MarketingFile) => {
    if (file.type.includes('image')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (file.type.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else if (file.type.includes('word') || file.type.includes('document')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    } else if (file.type.includes('sheet') || file.type.includes('excel')) {
      return <FileText className="w-5 h-5 text-green-600" />;
    } else if (file.type.includes('zip') || file.type.includes('compressed')) {
      return <File className="w-5 h-5 text-yellow-600" />;
    } else {
      return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryLabel = (category: MarketingFile['category']) => {
    switch (category) {
      case 'press_kit':
        return 'Press Kit';
      case 'brand_assets':
        return 'Brand Assets';
      case 'campaign':
        return 'Campaign';
      case 'analytics':
        return 'Analytics';
      case 'other':
        return 'Other';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: MarketingFile['category']) => {
    switch (category) {
      case 'press_kit':
        return 'bg-light-blue text-black';
      case 'brand_assets':
        return 'bg-blue-100 text-blue-800';
      case 'campaign':
        return 'bg-green-100 text-green-800';
      case 'analytics':
        return 'bg-beige text-black';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-gray-500">Loading marketing data...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-charcoal font-title">MARKETING</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your social media content and analyze performance
        </p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="content-calendar" className="uppercase">
            Content Calendar
          </TabsTrigger>
          <TabsTrigger value="analytics" className="uppercase">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="files" className="uppercase">
            Files
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content-calendar">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value as Platform | 'all')}
                  className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="all">All Platforms</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">Twitter</option>
                  <option value="facebook">Facebook</option>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PostStatus | 'all')}
                  className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="failed">Failed</option>
                </select>
                <button
                  onClick={() => {
                    setIsAddingPost(true);
                    setEditingPost(null);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                  New Post
                </button>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Done
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Platform
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tags
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedPosts.length > 0 ? (
                      sortedPosts.map((post) => (
                        <tr key={post.id} className={`hover:bg-gray-50 ${post.done ? 'bg-green-50' : ''}`}>
                          <td className="px-3 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleToggleDone(post.id)}
                              className={`transition-colors ${
                                post.done
                                  ? ''
                                  : 'w-5 h-5 rounded border border-gray-300 hover:border-primary'
                              }`}
                            >
                              {post.done ? (
                                <img
                                  src="/The Manager_Iconografia-11.svg"
                                  alt="Completed"
                                  className="w-10 h-10"
                                  style={{ filter: 'invert(45%) sepia(97%) saturate(1200%) hue-rotate(116deg) brightness(92%) contrast(101%)' }}
                                />
                              ) : null}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-start">
                              <div>
                                <div className={`text-sm font-medium ${post.done ? 'text-green-600 line-through' : 'text-gray-900'}`}>
                                  {post.title}
                                </div>
                                <div className={`text-sm ${post.done ? 'text-green-600 line-through' : 'text-gray-500'} line-clamp-1`}>
                                  {post.content}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getPlatformIcon(post.platform)}
                              <span className={`ml-2 text-sm capitalize ${post.done ? 'text-green-600' : 'text-gray-900'}`}>
                                {post.platform}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${post.done ? 'text-green-600' : 'text-gray-900'}`}>
                              {formatDate(post.scheduledDate)}
                            </div>
                            <div className={`text-sm ${post.done ? 'text-green-600' : 'text-gray-500'}`}>
                              {post.scheduledTime}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${post.done ? 'bg-green-100 text-green-800' : getStatusColor(post.status)}`}>
                              {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {post.tags && post.tags.map((tag) => (
                                <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  post.done ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingPost(post)}
                                className="text-primary hover:text-primary/80"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                          No posts found. Create a new post or adjust your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {(isAddingPost || editingPost) && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-screen items-center justify-center p-4">
                  <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => {
                    setIsAddingPost(false);
                    setEditingPost(null);
                  }} />

                  <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="text-lg font-medium text-gray-900">
                        {editingPost ? 'Edit Post' : 'Create New Post'}
                      </h3>
                      <button
                        onClick={() => {
                          setIsAddingPost(false);
                          setEditingPost(null);
                        }}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="p-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Title
                          </label>
                          <input
                            type="text"
                            value={editingPost ? editingPost.title : newPost.title}
                            onChange={(e) => {
                              if (editingPost) {
                                setEditingPost({ ...editingPost, title: e.target.value });
                              } else {
                                setNewPost({ ...newPost, title: e.target.value });
                              }
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            placeholder="Enter post title"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Content
                          </label>
                          <textarea
                            value={editingPost ? editingPost.content : newPost.content}
                            onChange={(e) => {
                              if (editingPost) {
                                setEditingPost({ ...editingPost, content: e.target.value });
                              } else {
                                setNewPost({ ...newPost, content: e.target.value });
                              }
                            }}
                            rows={4}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            placeholder="Enter post content"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Platform
                            </label>
                            <select
                              value={editingPost ? editingPost.platform : newPost.platform}
                              onChange={(e) => {
                                if (editingPost) {
                                  setEditingPost({ ...editingPost, platform: e.target.value as Platform });
                                } else {
                                  setNewPost({ ...newPost, platform: e.target.value as Platform });
                                }
                              }}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            >
                              <option value="instagram">Instagram</option>
                              <option value="twitter">Twitter</option>
                              <option value="facebook">Facebook</option>
                              <option value="youtube">YouTube</option>
                              <option value="tiktok">TikTok</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Status
                            </label>
                            <select
                              value={editingPost ? editingPost.status : newPost.status}
                              onChange={(e) => {
                                if (editingPost) {
                                  setEditingPost({ ...editingPost, status: e.target.value as PostStatus });
                                } else {
                                  setNewPost({ ...newPost, status: e.target.value as PostStatus });
                                }
                              }}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            >
                              <option value="draft">Draft</option>
                              <option value="scheduled">Scheduled</option>
                              <option value="published">Published</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Date
                            </label>
                            <input
                              type="date"
                              value={editingPost ? editingPost.scheduledDate : newPost.scheduledDate}
                              onChange={(e) => {
                                if (editingPost) {
                                  setEditingPost({ ...editingPost, scheduledDate: e.target.value });
                                } else {
                                  setNewPost({ ...newPost, scheduledDate: e.target.value });
                                }
                              }}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Time
                            </label>
                            <input
                              type="time"
                              value={editingPost ? editingPost.scheduledTime : newPost.scheduledTime}
                              onChange={(e) => {
                                if (editingPost) {
                                  setEditingPost({ ...editingPost, scheduledTime: e.target.value });
                                } else {
                                  setNewPost({ ...newPost, scheduledTime: e.target.value });
                                }
                              }}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Media URL
                          </label>
                          <input
                            type="url"
                            value={editingPost ? editingPost.mediaUrl || '' : newPost.mediaUrl || ''}
                            onChange={(e) => {
                              if (editingPost) {
                                setEditingPost({ ...editingPost, mediaUrl: e.target.value });
                              } else {
                                setNewPost({ ...newPost, mediaUrl: e.target.value });
                              }
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Tags
                          </label>
                          <div className="mt-1 flex rounded-md shadow-sm">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                              #
                            </span>
                            <input
                              type="text"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddTag();
                                }
                              }}
                              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                              placeholder="Add tag"
                            />
                            <button
                              type="button"
                              onClick={handleAddTag}
                              className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                              Add
                            </button>
                          </div>
                          {((editingPost?.tags && editingPost.tags.length > 0) || (newPost.tags && newPost.tags.length > 0)) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(editingPost ? editingPost.tags : newPost.tags)?.map(tag => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  #{tag}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            id="markAsDone"
                            checked={editingPost ? editingPost.done : newPost.done}
                            onChange={(e) => {
                              if (editingPost) {
                                setEditingPost({ ...editingPost, done: e.target.checked });
                              } else {
                                setNewPost({ ...newPost, done: e.target.checked });
                              }
                            }}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <label htmlFor="markAsDone" className="ml-2 block text-sm text-gray-900">
                            Mark as done
                          </label>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingPost(false);
                            setEditingPost(null);
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={editingPost ? handleUpdatePost : handleAddPost}
                          disabled={isSaving}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {editingPost ? 'Updating...' : 'Creating...'}
                            </>
                          ) : (
                            <>
                              {editingPost ? 'Update Post' : 'Create Post'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="files">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={fileSearchTerm}
                    onChange={(e) => setFileSearchTerm(e.target.value)}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={fileCategoryFilter}
                  onChange={(e) => setFileCategoryFilter(e.target.value as fileService.FileCategory | 'all')}
                  className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="press_kit">Press Kit</option>
                  <option value="brand_assets">Brand Assets</option>
                  <option value="campaign">Campaign</option>
                  <option value="analytics">Analytics</option>
                  <option value="other">Other</option>
                </select>
                <label
                  htmlFor="file-upload"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPendingFileUpload(e.target.files[0]);
                        setNewFile({
                          ...newFile,
                          name: e.target.files[0].name
                        });
                        setIsFileModalOpen(true);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedFiles.length > 0 ? (
                sortedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getFileIcon(file)}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{file.name}</h3>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} - {formatDate(file.uploadDate)}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(file.category)}`}>
                          {getCategoryLabel(file.category)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      {file.description && (
                        <p className="text-sm text-gray-600 mb-3">{file.description}</p>
                      )}

                      {file.shared && file.sharedWith && file.sharedWith.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Shared with:</p>
                          <div className="flex flex-wrap gap-1">
                            {file.sharedWith.map((person, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {person}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Uploaded by {file.uploadedBy}
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Open file"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <a
                            href={file.url}
                            download={file.name}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => {
                              setEditingFile(file);
                              setIsFileModalOpen(true);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Edit file details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {showDeleteConfirm === file.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteFile(file.id)}
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
                              title="Delete file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 py-12 text-center">
                  <File className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Upload a file to get started or adjust your search filters.
                  </p>
                  <div className="mt-6">
                    <label
                      htmlFor="empty-file-upload"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
                    >
                      <Upload className="mr-2 h-5 w-5" />
                      Upload a file
                      <input
                        id="empty-file-upload"
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setPendingFileUpload(e.target.files[0]);
                            setNewFile({
                              ...newFile,
                              name: e.target.files[0].name
                            });
                            setIsFileModalOpen(true);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {isFileModalOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-screen items-center justify-center p-4">
                  <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => {
                    setIsFileModalOpen(false);
                    setEditingFile(null);
                    setPendingFileUpload(null);
                    setNewFile({
                      name: '',
                      category: 'other',
                      description: '',
                      shared: false,
                      sharedWith: []
                    });
                  }} />

                  <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="text-lg font-medium text-gray-900">
                        {editingFile ? 'Edit File Details' : 'File Details'}
                      </h3>
                      <button
                        onClick={() => {
                          setIsFileModalOpen(false);
                          setEditingFile(null);
                          setPendingFileUpload(null);
                          setNewFile({
                            name: '',
                            category: 'other',
                            description: '',
                            shared: false,
                            sharedWith: []
                          });
                        }}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="p-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            File Name
                          </label>
                          <input
                            type="text"
                            value={editingFile ? editingFile.name : newFile.name}
                            onChange={(e) => {
                              if (editingFile) {
                                setEditingFile({ ...editingFile, name: e.target.value });
                              } else {
                                setNewFile({ ...newFile, name: e.target.value });
                              }
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            placeholder="Enter file name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Category
                          </label>
                          <select
                            value={editingFile ? editingFile.category : newFile.category}
                            onChange={(e) => {
                              if (editingFile) {
                                setEditingFile({ ...editingFile, category: e.target.value as MarketingFile['category'] });
                              } else {
                                setNewFile({ ...newFile, category: e.target.value as MarketingFile['category'] });
                              }
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          >
                            <option value="press_kit">Press Kit</option>
                            <option value="brand_assets">Brand Assets</option>
                            <option value="campaign">Campaign</option>
                            <option value="analytics">Analytics</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            value={editingFile ? editingFile.description : newFile.description}
                            onChange={(e) => {
                              if (editingFile) {
                                setEditingFile({ ...editingFile, description: e.target.value });
                              } else {
                                setNewFile({ ...newFile, description: e.target.value });
                              }
                            }}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            placeholder="Enter file description"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700">
                              Share with
                            </label>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="shareFile"
                                checked={editingFile ? editingFile.shared : newFile.shared}
                                onChange={(e) => {
                                  if (editingFile) {
                                    setEditingFile({ ...editingFile, shared: e.target.checked });
                                  } else {
                                    setNewFile({ ...newFile, shared: e.target.checked });
                                  }
                                }}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                              />
                              <label htmlFor="shareFile" className="ml-2 block text-sm text-gray-900">
                                Share this file
                              </label>
                            </div>
                          </div>

                          {(editingFile?.shared || newFile.shared) && (
                            <div className="mt-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newSharedPerson}
                                  onChange={(e) => setNewSharedPerson(e.target.value)}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                  placeholder="Enter name or email"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddSharedPerson}
                                  className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                                >
                                  Add
                                </button>
                              </div>

                              {((editingFile?.sharedWith && editingFile.sharedWith.length > 0) ||
                                (newFile.sharedWith && newFile.sharedWith.length > 0)) && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {(editingFile ? editingFile.sharedWith : newFile.sharedWith)?.map((person, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {person}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSharedPerson(person)}
                                        className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:text-blue-500 focus:outline-none"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsFileModalOpen(false);
                            setEditingFile(null);
                            setPendingFileUpload(null);
                            setNewFile({
                              name: '',
                              category: 'other',
                              description: '',
                              shared: false,
                              sharedWith: []
                            });
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={editingFile ? handleUpdateFile : handleFileUpload}
                          disabled={isSaving}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {editingFile ? 'Updating...' : 'Uploading...'}
                            </>
                          ) : (
                            <>
                              {editingFile ? 'Update File' : 'Upload File'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
