import React, { useState } from 'react';
import { Globe, Link2, Save } from 'lucide-react';
import Modal from './Modal';

interface SocialLinks {
  spotify: string;
  appleMusic: string;
  youtube: string;
  instagram: string;
  facebook: string;
  twitter: string;
  tiktok: string;
}

interface ArtistInfo {
  name: string;
  photo: string;
  bio: string;
  genre: string[];
  socialLinks: SocialLinks;
}

interface ArtistPortalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (info: ArtistInfo) => void;
  initialInfo?: ArtistInfo;
}

const INITIAL_INFO: ArtistInfo = {
  name: 'Led Zeppelin',
  photo: 'https://img.rtve.es/imagenes/led-zeppelin-starship-mundo-a-pies/1411109953003.jpg',
  bio: 'Led Zeppelin were an English rock band formed in London in 1968. The group consisted of vocalist Robert Plant, guitarist Jimmy Page, bassist/keyboardist John Paul Jones, and drummer John Bonham.',
  genre: ['Rock', 'Hard Rock', 'Blues Rock', 'Folk Rock'],
  socialLinks: {
    spotify: 'https://open.spotify.com/artist/36QJpDe2go2KgaRleHCDTp',
    appleMusic: 'https://music.apple.com/us/artist/led-zeppelin/994656',
    youtube: 'https://www.youtube.com/c/ledzeppelin',
    instagram: 'https://www.instagram.com/ledzeppelin',
    facebook: 'https://www.facebook.com/ledzeppelin',
    twitter: 'https://twitter.com/ledzeppelin',
    tiktok: 'https://www.tiktok.com/@ledzeppelin'
  }
};

export default function ArtistPortal({ isOpen, onClose, onSave, initialInfo = INITIAL_INFO }: ArtistPortalProps) {
  const [info, setInfo] = useState<ArtistInfo>(initialInfo);
  const [activeTab, setActiveTab] = useState<'info' | 'social'>('info');

  const handleSave = () => {
    onSave(info);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Artist Information">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <img src="/tm-vinil-negro_(2).png" alt="Basic" className="w-4 h-4 object-contain" />
                Basic Information
              </div>
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'social'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Social & Streaming
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'info' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Artist Name
              </label>
              <input
                type="text"
                value={info.name}
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Photo URL
              </label>
              <input
                type="url"
                value={info.photo}
                onChange={(e) => setInfo({ ...info, photo: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Biography
              </label>
              <textarea
                value={info.bio}
                onChange={(e) => setInfo({ ...info, bio: e.target.value })}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Genres
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {info.genre.map((g, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-beige text-black"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(info.socialLinks).map(([platform, url]) => (
              <div key={platform}>
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {platform.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    <Link2 className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setInfo({
                      ...info,
                      socialLinks: {
                        ...info.socialLinks,
                        [platform]: e.target.value
                      }
                    })}
                    className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder={`https://${platform}.com/...`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}