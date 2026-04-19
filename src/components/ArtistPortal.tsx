import React, { useState } from 'react';
import { Globe, Link2 } from 'lucide-react';
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
        <div className="sub-tabs">
          <button
            onClick={() => setActiveTab('info')}
            className={`sub-tab ${activeTab === 'info' ? 'active' : ''}`}
          >
            <img src="/tm-vinil-negro_(2).png" alt="" className="tab-icon" style={{ filter: 'invert(1)' }} />
            Basic Information
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`sub-tab ${activeTab === 'social' ? 'active' : ''}`}
          >
            <Globe className="tab-icon" />
            Social & Streaming
          </button>
        </div>

        {/* Content */}
        {activeTab === 'info' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
                Artist Name
              </label>
              <input
                type="text"
                value={info.name}
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
                className="mt-1 block w-full border shadow-sm sm:text-sm"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--t1)', borderRadius: 0 }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
                Photo URL
              </label>
              <input
                type="url"
                value={info.photo}
                onChange={(e) => setInfo({ ...info, photo: e.target.value })}
                className="mt-1 block w-full border shadow-sm sm:text-sm"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--t1)', borderRadius: 0 }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
                Biography
              </label>
              <textarea
                value={info.bio}
                onChange={(e) => setInfo({ ...info, bio: e.target.value })}
                rows={4}
                className="mt-1 block w-full border shadow-sm sm:text-sm"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--t1)', borderRadius: 0 }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
                Genres
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {info.genre.map((g, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderRadius: 0 }}
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
                <label className="block text-sm font-medium capitalize" style={{ color: 'var(--t1)' }}>
                  {platform.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <div className="mt-1 flex shadow-sm">
                  <span className="inline-flex items-center px-3 border border-r-0" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--t2)', borderRadius: 0 }}>
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
                    className="flex-1 block w-full border-r border-t border-b sm:text-sm"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--t1)', borderRadius: 0 }}
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
            className="px-4 py-2 text-sm font-medium border"
            style={{ color: 'var(--t1)', backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 0 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--brand-1)', borderRadius: 0 }}
          >
            <img src="/The Manager_Iconografia-11.svg" className="pxi-md icon-white" alt="" />
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}