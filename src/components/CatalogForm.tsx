import React, { useState } from 'react';
import { Plus, X, Image, FileText, Calendar, Globe, Tag } from 'lucide-react';
import type { Track, CreditShare } from '../types';

const VinylIcon = ({ className }: { className?: string }) => (
  <img src="/tm-vinil-negro_(2).png" alt="Music" className={className} style={{ objectFit: 'contain' }} />
);

interface CreditFormProps {
  credits: CreditShare[];
  onUpdate: (credits: CreditShare[]) => void;
  type: 'producers' | 'songwriters' | 'mixEngineers' | 'masteringEngineers';
  showMaster?: boolean;
  showPublishing?: boolean;
}

function CreditForm({ credits, onUpdate, type, showMaster = true, showPublishing = true }: CreditFormProps) {
  const [newCredit, setNewCredit] = useState<CreditShare>({ name: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePercentages = (updatedCredits: CreditShare[]): boolean => {
    if (showMaster) {
      const totalMaster = updatedCredits.reduce((sum, credit) => sum + (credit.masterPercentage || 0), 0);
      if (totalMaster !== 100 && totalMaster !== 0) {
        setError('Master percentages must total 100%');
        return false;
      }
    }

    if (showPublishing) {
      const totalPublishing = updatedCredits.reduce((sum, credit) => sum + (credit.publishingPercentage || 0), 0);
      if (totalPublishing !== 100 && totalPublishing !== 0) {
        setError('Publishing percentages must total 100%');
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleAdd = () => {
    if (!newCredit.name) return;

    const updatedCredits = [...credits, newCredit];
    if (validatePercentages(updatedCredits)) {
      onUpdate(updatedCredits);
      setNewCredit({ name: '' });
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      {credits.map((credit, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate">{credit.name}</span>
          </div>
          <div className="flex items-center gap-6 flex-shrink-0">
            {showMaster && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">Master:</span>
                <div className="w-20">
                  <input
                    type="number"
                    value={credit.masterPercentage || ''}
                    onChange={(e) => {
                      const updatedCredits = credits.map((c, i) =>
                        i === index ? { ...c, masterPercentage: Number(e.target.value) } : c
                      );
                      if (validatePercentages(updatedCredits)) {
                        onUpdate(updatedCredits);
                      }
                    }}
                    className="block w-full text-sm border-gray-300 rounded-md focus:border-primary focus:ring-primary"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <span className="text-sm text-gray-500">%</span>
              </div>
            )}
            {showPublishing && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">Publishing:</span>
                <div className="w-20">
                  <input
                    type="number"
                    value={credit.publishingPercentage || ''}
                    onChange={(e) => {
                      const updatedCredits = credits.map((c, i) =>
                        i === index ? { ...c, publishingPercentage: Number(e.target.value) } : c
                      );
                      if (validatePercentages(updatedCredits)) {
                        onUpdate(updatedCredits);
                      }
                    }}
                    className="block w-full text-sm border-gray-300 rounded-md focus:border-primary focus:ring-primary"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <span className="text-sm text-gray-500">%</span>
              </div>
            )}
            <button
              onClick={() => onUpdate(credits.filter((_, i) => i !== index))}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
      )}

      {isAdding ? (
        <div className="flex items-center gap-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={newCredit.name}
              onChange={(e) => setNewCredit({ ...newCredit, name: e.target.value })}
              className="block w-full text-sm border-gray-300 rounded-md focus:border-primary focus:ring-primary"
              placeholder="Name"
              autoFocus
            />
          </div>
          {showMaster && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-gray-500 whitespace-nowrap">Master:</span>
              <div className="w-20">
                <input
                  type="number"
                  value={newCredit.masterPercentage || ''}
                  onChange={(e) => setNewCredit({ ...newCredit, masterPercentage: Number(e.target.value) })}
                  className="block w-full text-sm border-gray-300 rounded-md focus:border-primary focus:ring-primary"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <span className="text-sm text-gray-500">%</span>
            </div>
          )}
          {showPublishing && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-gray-500 whitespace-nowrap">Publishing:</span>
              <div className="w-20">
                <input
                  type="number"
                  value={newCredit.publishingPercentage || ''}
                  onChange={(e) => setNewCredit({ ...newCredit, publishingPercentage: Number(e.target.value) })}
                  className="block w-full text-sm border-gray-300 rounded-md focus:border-primary focus:ring-primary"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <span className="text-sm text-gray-500">%</span>
            </div>
          )}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 text-sm text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewCredit({ name: '' });
              }}
              className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add {type === 'mixEngineers' ? 'Mix Engineer' : 
               type === 'masteringEngineers' ? 'Mastering Engineer' :
               type.slice(0, -1)}
        </button>
      )}
    </div>
  );
}

interface CatalogFormProps {
  formData: {
    title: string;
    artist: string;
    genres: string[];
    format: string;
    releaseDate?: string;
    duration?: string;
    label?: string;
    distributor?: string;
    isrc?: string;
    upc?: string;
    spotifyUri?: string;
    appleId?: string;
    artistCredits: CreditShare[];
    producers: CreditShare[];
    songwriters: CreditShare[];
    mixEngineers: CreditShare[];
    masteringEngineers: CreditShare[];
    artwork?: File;
    audioFile?: File;
    lyrics?: string;
    newGenre: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<typeof formData>>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'artwork' | 'audio' | 'lyrics') => void;
  handleSubmit: (e: React.FormEvent) => void;
  editingTrackId: number | null;
}

export default function CatalogForm({
  formData,
  setFormData,
  handleFileChange,
  handleSubmit,
  editingTrackId,
}: CatalogFormProps) {
  const [currentTab, setCurrentTab] = useState<'basic' | 'media' | 'metadata' | 'credits'>('basic');

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'basic', label: 'Basic Info', icon: VinylIcon },
            { id: 'media', label: 'Media & Assets', icon: Image },
            { id: 'metadata', label: 'Metadata', icon: Tag },
            { id: 'credits', label: 'Credits & Rights', icon: Globe },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setCurrentTab(id as typeof currentTab)}
              className={`group pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                currentTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${
                currentTab === id
                  ? 'text-primary'
                  : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Basic Info Tab */}
      {currentTab === 'basic' && (
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
              placeholder="Track title"
            />
          </div>

          <div>
            <label htmlFor="artist" className="block text-sm font-medium text-gray-700">
              Artist
            </label>
            <input
              type="text"
              id="artist"
              value={formData.artist}
              onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Optional"
            />
          </div>

          <div>
            <label htmlFor="format" className="block text-sm font-medium text-gray-700">
              Format
            </label>
            <select
              id="format"
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="Single">Single</option>
              <option value="EP">EP</option>
              <option value="Album">Album</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Genres
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.genres.map((genre, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {genre}
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      genres: formData.genres.filter((_, i) => i !== index)
                    })}
                    className="ml-1 hover:text-primary/80"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                value={formData.newGenre}
                onChange={(e) => setFormData({ ...formData, newGenre: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (formData.newGenre.trim()) {
                      setFormData({
                        ...formData,
                        genres: [...formData.genres, formData.newGenre.trim()],
                        newGenre: ''
                      });
                    }
                  }
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Add a genre"
              />
              <button
                type="button"
                onClick={() => {
                  if (formData.newGenre.trim()) {
                    setFormData({
                      ...formData,
                      genres: [...formData.genres, formData.newGenre.trim()],
                      newGenre: ''
                    });
                  }
                }}
                className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media & Assets Tab */}
      {currentTab === 'media' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Artwork
            </label>
            <div className="mt-2">
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'artwork')}
                accept="image/*"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary/90"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Audio File
            </label>
            <div className="mt-2">
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'audio')}
                accept="audio/*"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary/90"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Lyrics
            </label>
            <div className="mt-2">
              <textarea
                value={formData.lyrics}
                onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                rows={6}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Enter lyrics here..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Metadata Tab */}
      {currentTab === 'metadata' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700">
                Release Date
              </label>
              <input
                type="date"
                id="releaseDate"
                value={formData.releaseDate}
                onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                Duration
              </label>
              <input
                type="text"
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="00:00:00"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700">
                Label
              </label>
              <input
                type="text"
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="distributor" className="block text-sm font-medium text-gray-700">
                Distributor
              </label>
              <input
                type="text"
                id="distributor"
                value={formData.distributor}
                onChange={(e) => setFormData({ ...formData, distributor: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="isrc" className="block text-sm font-medium text-gray-700">
                ISRC
              </label>
              <input
                type="text"
                id="isrc"
                value={formData.isrc}
                onChange={(e) => setFormData({ ...formData, isrc: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="upc" className="block text-sm font-medium text-gray-700">
                UPC
              </label>
              <input
                type="text"
                id="upc"
                value={formData.upc}
                onChange={(e) => setFormData({ ...formData, upc: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="spotifyUri" className="block text-sm font-medium text-gray-700">
                Spotify URI
              </label>
              <input
                type="text"
                id="spotifyUri"
                value={formData.spotifyUri}
                onChange={(e) => setFormData({ ...formData, spotifyUri: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="appleId" className="block text-sm font-medium text-gray-700">
                Apple Music ID
              </label>
              <input
                type="text"
                id="appleId"
                value={formData.appleId}
                onChange={(e) => setFormData({ ...formData, appleId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Credits Tab */}
      {currentTab === 'credits' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Artist
            </label>
            <div className="mt-2">
              <CreditForm
                credits={formData.artistCredits}
                onUpdate={(credits) => setFormData({ ...formData, artistCredits: credits })}
                type="producers"
                showMaster={true}
                showPublishing={false}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Producers
            </label>
            <div className="mt-2">
              <CreditForm
                credits={formData.producers}
                onUpdate={(credits) => setFormData({ ...formData, producers: credits })}
                type="producers"
                showMaster={true}
                showPublishing={false}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Songwriters
            </label>
            <div className="mt-2">
              <CreditForm
                credits={formData.songwriters}
                onUpdate={(credits) => setFormData({ ...formData, songwriters: credits })}
                type="songwriters"
                showMaster={false}
                showPublishing={true}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mix Engineers
            </label>
            <div className="mt-2">
              <CreditForm
                credits={formData.mixEngineers}
                onUpdate={(credits) => setFormData({ ...formData, mixEngineers: credits })}
                type="mixEngineers"
                showMaster={true}
                showPublishing={false}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mastering Engineers
            </label>
            <div className="mt-2">
              <CreditForm
                credits={formData.masteringEngineers}
                onUpdate={(credits) => setFormData({ ...formData, masteringEngineers: credits })}
                type="masteringEngineers"
                showMaster={true}
                showPublishing={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          type="submit"
          disabled={!formData.title}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {editingTrackId ? 'Save Changes' : 'Add Track'}
        </button>
      </div>
    </form>
  );
}