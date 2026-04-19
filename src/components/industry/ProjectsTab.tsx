import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import ProjectCard from './ProjectCard';
import { getArtists } from '../../lib/artists';
import type { Artist } from '../../lib/artists';

export default function ProjectsTab() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getArtists()
      .then(setArtists)
      .catch((err) => setError(err.message ?? 'Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? artists.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.genre ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : artists;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-title text-[var(--danger)]">Error loading projects</div>
        <div className="empty-state-desc">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--t3)]"
          size={14}
        />
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="tm-input pl-8 w-full"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <img src="/TM-File-negro.svg" className="pxi-xl icon-muted" alt="" />
          </div>
          <div className="empty-state-title">
            {search ? 'No projects match your search' : 'No projects yet'}
          </div>
          <div className="empty-state-desc">
            {search ? 'Try a different search term.' : 'Artists and projects in your workspace will appear here.'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((artist) => (
            <ProjectCard
              key={artist.id}
              project={{
                id: artist.id,
                name: artist.name,
                artworkUrl: artist.artworkUrl,
                genre: artist.genre,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
