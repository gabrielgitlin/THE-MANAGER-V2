import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Star } from 'lucide-react';
import { getArtist } from '../lib/artists';
import type { Artist } from '../lib/artists';
import {
  getRelationsForProject,
  createRelation,
  deleteRelation,
} from '../lib/projectRelations';
import { getContact } from '../lib/contacts';
import { getOrganization } from '../lib/organizations';
import { ROLE_LABELS, displayRole } from '../lib/industryRoles';
import type { ProjectRelation, ProjectRelationFormData } from '../types/projectRelations';
import ProjectRelationModal from '../components/industry/ProjectRelationModal';
import LoadingSpinner from '../components/LoadingSpinner';

// ─── Role category definitions ─────────────────────────────────────────────────

const ROLE_CATEGORIES = [
  {
    label: 'Management',
    roles: ['manager', 'day_to_day_manager', 'tour_manager', 'business_manager'],
  },
  {
    label: 'Representation',
    roles: ['booking_agent', 'publicist', 'lawyer', 'accountant'],
  },
  {
    label: 'Label & Publishing',
    roles: ['label_rep', 'publisher_rep', 'a_and_r'],
  },
  {
    label: 'Creative',
    roles: [
      'producer', 'songwriter', 'composer', 'engineer', 'mixing_engineer',
      'mastering_engineer', 'session_musician', 'vocalist',
    ],
  },
  {
    label: 'Crew',
    roles: [
      'front_of_house', 'monitor_engineer', 'lighting_designer', 'backline_tech',
      'stage_manager', 'driver', 'promoter', 'talent_buyer', 'production_manager',
    ],
  },
  {
    label: 'Other',
    roles: [
      'other', 'photographer', 'videographer', 'stylist', 'journalist',
      'dj', 'sync_agent', 'marketing_manager',
    ],
  },
] as const;

// ─── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'network';

interface ResolvedRelation extends ProjectRelation {
  displayName: string;
  avatarUrl?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ProjectProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [relations, setRelations] = useState<ResolvedRelation[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (id) load(id);
  }, [id]);

  async function load(projectId: string) {
    try {
      setIsLoading(true);
      setError(null);
      const [artistData, rawRelations] = await Promise.all([
        getArtist(projectId),
        getRelationsForProject(projectId),
      ]);
      setArtist(artistData);
      const resolved = await resolveRelations(rawRelations);
      setRelations(resolved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }

  async function resolveRelations(raw: ProjectRelation[]): Promise<ResolvedRelation[]> {
    return Promise.all(
      raw.map(async (rel) => {
        try {
          if (rel.contactId) {
            const contact = await getContact(rel.contactId);
            return {
              ...rel,
              displayName: `${contact.firstName} ${contact.lastName}`.trim(),
              avatarUrl: contact.profilePhotoUrl,
            };
          }
          if (rel.organizationId) {
            const org = await getOrganization(rel.organizationId);
            return {
              ...rel,
              displayName: org?.name ?? 'Unknown Organization',
              avatarUrl: org?.logoUrl,
            };
          }
        } catch {
          // Name resolution failed — fall through to unknown
        }
        return { ...rel, displayName: 'Unknown' };
      })
    );
  }

  async function handleSaveRelation(data: ProjectRelationFormData) {
    await createRelation(data);
    if (id) await load(id);
  }

  async function handleDelete(relationId: string) {
    try {
      setDeletingId(relationId);
      await deleteRelation(relationId);
      setRelations((prev) => prev.filter((r) => r.id !== relationId));
    } catch (err) {
      console.error('Failed to delete relation:', err);
    } finally {
      setDeletingId(null);
    }
  }

  // ─── Loading / error states ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="p-6">
        <div className="empty-state">
          <div className="empty-state-title" style={{ color: 'var(--danger)' }}>
            {error ?? 'Project not found'}
          </div>
          <button
            className="btn btn-ghost btn-sm mt-4"
            onClick={() => navigate('/industry')}
          >
            Back to Industry
          </button>
        </div>
      </div>
    );
  }

  // ─── Group relations by category ───────────────────────────────────────────

  const groupedRelations = ROLE_CATEGORIES.map((cat) => ({
    label: cat.label,
    items: relations.filter((r) => (cat.roles as readonly string[]).includes(r.role)),
  })).filter((group) => group.items.length > 0);

  // Relations that don't match any category (shouldn't happen, but safety net)
  const allCategoryRoles = ROLE_CATEGORIES.flatMap((c) => c.roles as readonly string[]);
  const uncategorized = relations.filter((r) => !allCategoryRoles.includes(r.role));

  // ─── Initials avatar ───────────────────────────────────────────────────────

  function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-0">
      {/* Back nav */}
      <div className="mb-4">
        <button
          className="btn btn-ghost btn-sm flex items-center gap-1.5"
          onClick={() => navigate('/industry')}
          style={{ color: 'var(--t3)', paddingLeft: 0 }}
        >
          <ArrowLeft size={14} />
          Industry
        </button>
      </div>

      {/* Hero / header */}
      <div
        className="tm-card p-5 mb-4 flex items-center gap-4"
        style={{ border: '1px solid var(--border)' }}
      >
        {artist.artworkUrl ? (
          <img
            src={artist.artworkUrl}
            alt={artist.name}
            style={{ width: 56, height: 56, borderRadius: 0, objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              minWidth: 56,
              background: 'var(--surface-3)',
              color: 'var(--t2)',
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {artist.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--t1)',
              lineHeight: 1.2,
            }}
          >
            {artist.name}
          </h1>
          {artist.genre && (
            <div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 2 }}>
              {artist.genre}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
        <nav className="flex gap-0">
          {(['overview', 'network'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 16px',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: activeTab === tab ? 'var(--t1)' : 'var(--t3)',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'color 120ms',
              }}
            >
              {tab === 'overview' ? 'Overview' : 'Network'}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="pt-4">
        {/* ── Overview tab ── */}
        {activeTab === 'overview' && (
          <div className="tm-card p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--t3)',
                    marginBottom: 4,
                  }}
                >
                  Project Name
                </div>
                <div style={{ fontSize: 14, color: 'var(--t1)', fontWeight: 500 }}>
                  {artist.name}
                </div>
              </div>
              {artist.genre && (
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--t3)',
                      marginBottom: 4,
                    }}
                  >
                    Genre
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--t1)', fontWeight: 500 }}>
                    {artist.genre}
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--t3)',
                  marginBottom: 4,
                }}
              >
                Network
              </div>
              <div style={{ fontSize: 14, color: 'var(--t2)' }}>
                {relations.length} connection{relations.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}

        {/* ── Network tab ── */}
        {activeTab === 'network' && (
          <div className="space-y-3">
            {/* Add button */}
            <div className="flex justify-end">
              <button
                className="btn btn-ghost btn-sm flex items-center gap-1.5"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={13} />
                Add to Network
              </button>
            </div>

            {/* Empty state */}
            {relations.length === 0 && (
              <div className="empty-state py-12">
                <div className="empty-state-title">No network connections yet</div>
                <div className="empty-state-desc">
                  Add managers, agents, publicists, and collaborators to this project's network.
                </div>
              </div>
            )}

            {/* Grouped sections */}
            {groupedRelations.map((group) => (
              <div key={group.label}>
                {/* Folder label */}
                <div className="folder-label">{group.label}</div>
                <div className="folder-body space-y-0">
                  {group.items.map((rel, idx) => (
                    <RelationRow
                      key={rel.id}
                      rel={rel}
                      isLast={idx === group.items.length - 1}
                      getInitials={getInitials}
                      onDelete={handleDelete}
                      isDeleting={deletingId === rel.id}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Uncategorized fallback */}
            {uncategorized.length > 0 && (
              <div>
                <div className="folder-label">Uncategorized</div>
                <div className="folder-body space-y-0">
                  {uncategorized.map((rel, idx) => (
                    <RelationRow
                      key={rel.id}
                      rel={rel}
                      isLast={idx === uncategorized.length - 1}
                      getInitials={getInitials}
                      onDelete={handleDelete}
                      isDeleting={deletingId === rel.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add relation modal */}
      {id && (
        <ProjectRelationModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveRelation}
          projectId={id}
        />
      )}
    </div>
  );
}

// ─── Relation row sub-component ───────────────────────────────────────────────

interface RelationRowProps {
  rel: ResolvedRelation;
  isLast: boolean;
  getInitials: (name: string) => string;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function RelationRow({ rel, isLast, getInitials, onDelete, isDeleting }: RelationRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        minHeight: 48,
      }}
    >
      {/* Avatar */}
      {rel.avatarUrl ? (
        <img
          src={rel.avatarUrl}
          alt={rel.displayName}
          style={{
            width: 32,
            height: 32,
            borderRadius: 0,
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 32,
            height: 32,
            minWidth: 32,
            background: 'var(--surface-3)',
            color: 'var(--t3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {getInitials(rel.displayName)}
        </div>
      )}

      {/* Name + role */}
      <div className="flex-1 min-w-0">
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--t1)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span className="truncate">{rel.displayName}</span>
          {rel.isPrimary && (
            <Star
              size={11}
              style={{ color: 'var(--accent)', fill: 'var(--accent)', flexShrink: 0 }}
            />
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
          {displayRole(rel.role, rel.roleCustom)}
        </div>
      </div>

      {/* Primary badge */}
      {rel.isPrimary && (
        <span
          className="status-badge badge-green"
          style={{ fontSize: 10, flexShrink: 0 }}
        >
          Primary
        </span>
      )}

      {/* Delete */}
      {confirmDelete ? (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            className="btn btn-sm"
            style={{
              background: 'var(--danger)',
              color: 'white',
              fontSize: 11,
              padding: '3px 8px',
            }}
            onClick={() => onDelete(rel.id)}
            disabled={isDeleting}
          >
            {isDeleting ? '...' : 'Delete'}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11 }}
            onClick={() => setConfirmDelete(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--t3)', padding: '4px 6px', flexShrink: 0 }}
          onClick={() => setConfirmDelete(true)}
          disabled={isDeleting}
          title="Remove from network"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}
