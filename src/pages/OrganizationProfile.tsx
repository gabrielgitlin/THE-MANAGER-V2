// src/pages/OrganizationProfile.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import OrganizationFormModal from '../components/industry/OrganizationFormModal';
import AvatarWithFallback from '../components/contacts/AvatarWithFallback';
import {
  getOrganization,
  updateOrganization,
  deleteOrganization,
} from '../lib/organizations';
import { getAffiliationsForOrganization } from '../lib/affiliations';
import { getProjectsForOrganization } from '../lib/projectRelations';
import { getContact } from '../lib/contacts';
import type { Organization, OrganizationFormData } from '../types/organizations';
import { ORG_TYPE_LABELS } from '../types/organizations';
import type { ContactAffiliation } from '../types/affiliations';
import type { ProjectRelation } from '../types/projectRelations';
import type { Contact } from '../types/contacts';

export default function OrganizationProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [org, setOrg] = useState<Organization | null>(null);
  const [affiliations, setAffiliations] = useState<ContactAffiliation[]>([]);
  const [projects, setProjects] = useState<ProjectRelation[]>([]);
  const [contactMap, setContactMap] = useState<Record<string, Contact>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (id) load(id);
  }, [id]);

  async function load(orgId: string) {
    try {
      setIsLoading(true);
      const [orgData, affilData, projectData] = await Promise.all([
        getOrganization(orgId),
        getAffiliationsForOrganization(orgId),
        getProjectsForOrganization(orgId),
      ]);
      setOrg(orgData);
      setAffiliations(affilData);
      setProjects(projectData);

      // Fetch contact details for each unique contactId in affiliations
      const uniqueContactIds = [...new Set(affilData.map(a => a.contactId))];
      const contactEntries = await Promise.all(
        uniqueContactIds.map(async (cid) => {
          try {
            const c = await getContact(cid);
            return [cid, c] as [string, Contact];
          } catch {
            return null;
          }
        })
      );
      const map: Record<string, Contact> = {};
      for (const entry of contactEntries) {
        if (entry) map[entry[0]] = entry[1];
      }
      setContactMap(map);
    } catch {
      setError('Organization not found.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(form: OrganizationFormData) {
    if (!id) return;
    const updated = await updateOrganization(id, form);
    setOrg(updated);
    setIsEditing(false);
  }

  async function handleDelete() {
    if (!org || !id) return;
    try {
      await deleteOrganization(id);
      navigate('/industry');
    } catch {
      setDeleteError('Failed to delete organization. Please try again.');
      setShowDeleteConfirm(false);
    }
  }

  if (isLoading) return <LoadingSpinner fullScreen={false} />;

  if (error || !org) {
    return (
      <div className="p-6">
        <button
          className="btn btn-ghost btn-sm flex items-center gap-1 mb-6"
          onClick={() => navigate('/industry')}
        >
          <img src="/TM-ArrowLeft-negro.svg" className="pxi-sm icon-muted" alt="" />
          <span className="text-t3 text-xs uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
            Industry
          </span>
        </button>
        <p className="text-t3">{error ?? 'Organization not found.'}</p>
      </div>
    );
  }

  const locationParts = [org.city, org.state, org.country].filter(Boolean);
  const location = locationParts.join(', ');

  return (
    <div className="p-4 md:p-6 space-y-7">
      {/* Back button */}
      <button
        onClick={() => navigate('/industry')}
        className="btn btn-ghost btn-sm flex items-center gap-2"
      >
        <img src="/TM-ArrowLeft-negro.svg" className="pxi-sm icon-muted" alt="" />
        <span className="text-t3 text-xs uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
          Industry
        </span>
      </button>

      {/* Section 1: Overview */}
      <div>
        <div className="folder-label">Overview</div>
        <div className="folder-body">
          <div className="tm-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Logo / initials */}
                {org.logoUrl ? (
                  <img
                    src={org.logoUrl}
                    alt={org.name}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold"
                    style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t2)' }}
                  >
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="space-y-1 min-w-0">
                  <h1 className="text-xl font-bold" style={{ color: 'var(--t1)' }}>
                    {org.name}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="status-badge badge-neutral">
                      {ORG_TYPE_LABELS[org.type]}
                    </span>
                    {org.visibility === 'private' && (
                      <span className="status-badge badge-yellow">Private</span>
                    )}
                  </div>
                  {org.website && (
                    <a
                      href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm"
                      style={{ color: 'var(--brand-1)' }}
                    >
                      {org.website}
                    </a>
                  )}
                  {location && (
                    <p className="text-sm" style={{ color: 'var(--t3)' }}>{location}</p>
                  )}
                </div>
              </div>

              {/* Edit button */}
              <button
                className="btn btn-ghost btn-sm flex-shrink-0"
                onClick={() => setIsEditing(true)}
                title="Edit organization"
              >
                <img src="/TM-Pen-negro.svg" className="pxi-sm icon-muted" alt="Edit" />
              </button>
            </div>

            {/* Contact info */}
            {(org.email || org.phone) && (
              <div className="mt-4 flex flex-wrap gap-4">
                {org.email && (
                  <a
                    href={`mailto:${org.email}`}
                    className="text-sm"
                    style={{ color: 'var(--t2)' }}
                  >
                    {org.email}
                  </a>
                )}
                {org.phone && (
                  <span className="text-sm" style={{ color: 'var(--t2)' }}>{org.phone}</span>
                )}
              </div>
            )}

            {/* Bio */}
            {org.bio && (
              <p className="mt-4 text-sm" style={{ color: 'var(--t2)' }}>
                {org.bio}
              </p>
            )}

            {/* Notes */}
            {org.notes && (
              <div className="mt-4">
                <p
                  className="text-xs uppercase mb-1"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}
                >
                  Notes
                </p>
                <p className="text-sm" style={{ color: 'var(--t2)' }}>{org.notes}</p>
              </div>
            )}

            {/* Tags */}
            {org.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {org.tags.map(tag => (
                  <span key={tag} className="status-badge badge-neutral">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: People (affiliations) */}
      <div>
        <div className="folder-label">People</div>
        <div className="folder-body">
          <div className="tm-card">
            {affiliations.length === 0 ? (
              <div
                className="p-5 text-sm"
                style={{ color: 'var(--t3)' }}
              >
                No people affiliated with this organization yet.
              </div>
            ) : (
              <ul>
                {affiliations.map((aff, idx) => {
                  const contact = contactMap[aff.contactId];
                  const isLast = idx === affiliations.length - 1;
                  const displayRole = aff.role === 'other' && aff.roleCustom
                    ? aff.roleCustom
                    : aff.role;

                  return (
                    <li
                      key={aff.id}
                      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-[var(--surface-2)] transition-colors${isLast ? '' : ' border-b'}`}
                      style={isLast ? {} : { borderColor: 'var(--border)' }}
                      onClick={() => navigate(`/industry/people/${aff.contactId}`)}
                    >
                      {contact ? (
                        <AvatarWithFallback contact={contact} size="sm" />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex-shrink-0"
                          style={{ backgroundColor: 'var(--surface-2)' }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--t1)' }}>
                          {contact
                            ? `${contact.firstName} ${contact.lastName}`
                            : aff.contactId}
                        </p>
                        <p className="text-xs capitalize" style={{ color: 'var(--t3)' }}>
                          {aff.title ? `${aff.title} · ` : ''}{displayRole}
                          {aff.startDate && ` · ${aff.startDate.slice(0, 7)}`}
                          {aff.endDate && ` – ${aff.endDate.slice(0, 7)}`}
                        </p>
                      </div>
                      {aff.isPrimary && (
                        <span className="status-badge badge-green text-xs">Primary</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Projects */}
      <div>
        <div className="folder-label">Projects</div>
        <div className="folder-body">
          <div className="tm-card">
            {projects.length === 0 ? (
              <div
                className="p-5 text-sm"
                style={{ color: 'var(--t3)' }}
              >
                No projects linked to this organization yet.
              </div>
            ) : (
              <ul>
                {projects.map((pr, idx) => {
                  const isLast = idx === projects.length - 1;
                  const displayRole = pr.role === 'other' && pr.roleCustom
                    ? pr.roleCustom
                    : pr.role;
                  return (
                    <li
                      key={pr.id}
                      className={`flex items-center gap-3 p-4${isLast ? '' : ' border-b'}`}
                      style={isLast ? {} : { borderColor: 'var(--border)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--t1)' }}>
                          {pr.projectId}
                        </p>
                        <p className="text-xs capitalize" style={{ color: 'var(--t3)' }}>
                          {displayRole}
                        </p>
                      </div>
                      {pr.isPrimary && (
                        <span className="status-badge badge-green text-xs">Primary</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Delete zone */}
      <div className="tm-card p-5">
        {deleteError && (
          <p className="text-sm mb-3" style={{ color: 'var(--status-red)' }}>{deleteError}</p>
        )}
        {showDeleteConfirm ? (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--t2)' }}>
              Are you sure you want to delete <strong>{org.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
              >
                Yes, Delete
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Organization
          </button>
        )}
      </div>

      {/* Edit modal */}
      {isEditing && (
        <OrganizationFormModal
          org={org}
          onSave={handleSave}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}
