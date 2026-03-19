import React from 'react';
import { Pencil } from 'lucide-react';
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
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="text-gray-900">{content}</div>
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
            <h2 className="text-2xl font-bold text-gray-900 font-title">{track.title}</h2>
            <p className="text-lg text-gray-600">{track.artist}</p>
          </div>
          <button
            onClick={() => onEdit(track)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit Track
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            {renderSection('Status', 
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                track.status === 'Released' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-beige text-black'
              }`}>
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

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Media Links</h3>
          <div className="grid grid-cols-2 gap-6">
            {track.officialVideoUrl && renderSection('Official Video', 
              <a href={track.officialVideoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Watch Video
              </a>
            )}
            {track.lyricVideoUrl && renderSection('Lyric Video', 
              <a href={track.lyricVideoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Watch Lyric Video
              </a>
            )}
            {track.visualizerUrl && renderSection('Visualizer', 
              <a href={track.visualizerUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Watch Visualizer
              </a>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Credits</h3>
          <div className="grid grid-cols-2 gap-6">
            {renderSection('Producers', renderList(track.producers))}
            {renderSection('Songwriters', renderList(track.songwriters))}
            {renderSection('Mix Engineers', renderList(track.mixEngineers))}
            {renderSection('Mastering Engineers', renderList(track.masteringEngineers))}
          </div>
        </div>

        {(track.lyrics || track.lyricsUrl) && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Lyrics</h3>
            {track.lyrics && (
              <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap font-mono text-sm">
                {track.lyrics}
              </div>
            )}
            {track.lyricsUrl && (
              <a href={track.lyricsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-2 inline-block">
                View Lyrics
              </a>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}