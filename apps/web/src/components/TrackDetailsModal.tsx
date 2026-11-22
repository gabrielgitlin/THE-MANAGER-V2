import React from 'react';
import Modal from './Modal';
import { Track } from '../types';

interface TrackDetailsModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (track: Track) => void;
}

export default function TrackDetailsModal({ track, isOpen, onClose, onEdit }: TrackDetailsModalProps) {
  if (!track) return null;

  const renderSection = (title: string, content: React.ReactNode) => (
    <div className="mb-6">
      <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--t2)' }}>{title}</h3>
      <div style={{ color: 'var(--t1)' }}>{content}</div>
    </div>
  );

  const renderList = (items: string[]) => (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
        >
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Track Details">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold font-title" style={{ color: 'var(--t1)' }}>{track.title}</h2>
            <p className="text-lg" style={{ color: 'var(--t2)' }}>{track.artist}</p>
          </div>
          <button
            onClick={() => onEdit(track)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ backgroundColor: 'var(--brand-1)', borderRadius: 0, '--tw-ring-offset-color': 'var(--bg)', '--tw-ring-color': 'var(--brand-1)' } as any}
          >
            <img src="/TM-Pluma-negro.png" className="pxi-md icon-white mr-1" alt="" />
            Edit Track
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            {renderSection('Status',
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold`}
                style={{
                  backgroundColor: track.status === 'Released' ? 'var(--brand-1)' : 'var(--surface-2)',
                  color: 'var(--t1)',
                  borderRadius: 0
                }}
              >
                {track.status}
              </span>
            )}
            {renderSection('Streams', track.streams)}
            {renderSection('Format', track.format)}
            {renderSection('Release Date', track.releaseDate || 'Not set')}
            {renderSection('Duration', track.duration || 'Not set')}
            {renderSection('Genres', renderList(track.genres))}
          </div>

          <div>
            {renderSection('Label', track.label || 'Not set')}
            {renderSection('Distributor', track.distributor || 'Not set')}
            {renderSection('ISRC', track.isrc || 'Not set')}
            {track.isrcAtmos && renderSection('ISRC Atmos', track.isrcAtmos)}
            {track.isrcVideo && renderSection('ISRC Video', track.isrcVideo)}
            {track.upc && renderSection('UPC', track.upc)}
            {track.upcAtmos && renderSection('UPC Atmos', track.upcAtmos)}
            {track.spotifyUri && renderSection('Spotify URI', track.spotifyUri)}
            {track.appleId && renderSection('Apple ID', track.appleId)}
          </div>
        </div>

        <div className="border-t pt-6" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--t1)' }}>Media Links</h3>
          <div className="grid grid-cols-2 gap-6">
            {track.officialVideoUrl && renderSection('Official Video',
              <a href={track.officialVideoUrl} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--brand-1)' }}>
                Watch Video
              </a>
            )}
            {track.lyricVideoUrl && renderSection('Lyric Video',
              <a href={track.lyricVideoUrl} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--brand-1)' }}>
                Watch Lyric Video
              </a>
            )}
            {track.visualizerUrl && renderSection('Visualizer',
              <a href={track.visualizerUrl} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--brand-1)' }}>
                Watch Visualizer
              </a>
            )}
          </div>
        </div>

        <div className="border-t pt-6" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--t1)' }}>Credits</h3>
          <div className="grid grid-cols-2 gap-6">
            {renderSection('Producers', renderList(track.producers))}
            {renderSection('Songwriters', renderList(track.songwriters))}
            {renderSection('Mix Engineers', renderList(track.mixEngineers))}
            {renderSection('Mastering Engineers', renderList(track.masteringEngineers))}
          </div>
        </div>

        {(track.lyrics || track.lyricsUrl) && (
          <div className="border-t pt-6" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--t1)' }}>Lyrics</h3>
            {track.lyrics && (
              <div className="p-4 whitespace-pre-wrap font-mono text-sm" style={{ backgroundColor: 'var(--surface-2)', borderRadius: 0, color: 'var(--t1)' }}>
                {track.lyrics}
              </div>
            )}
            {track.lyricsUrl && (
              <a href={track.lyricsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline mt-2 inline-block" style={{ color: 'var(--brand-1)' }}>
                View Lyrics
              </a>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}