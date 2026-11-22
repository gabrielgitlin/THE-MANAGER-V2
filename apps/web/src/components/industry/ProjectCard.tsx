import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  artworkUrl?: string;
  genre?: string;
}

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  return (
    <div
      className="tm-card p-4 flex items-center gap-3 cursor-pointer hover:border-[var(--border-2)] transition-all duration-[120ms]"
      onClick={() => navigate(`/industry/projects/${project.id}`)}
    >
      {project.artworkUrl ? (
        <img
          src={project.artworkUrl}
          alt={project.name}
          className="rounded-full object-cover"
          style={{ width: 48, height: 48, minWidth: 48 }}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: 48,
            height: 48,
            minWidth: 48,
            background: 'var(--surface-3)',
            color: 'var(--t3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {project.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[var(--t1)] truncate">{project.name}</div>
        {project.genre && <div className="text-xs text-[var(--t3)]">{project.genre}</div>}
      </div>
    </div>
  );
}
