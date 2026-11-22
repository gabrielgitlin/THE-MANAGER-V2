// src/components/contacts/OverviewTab.tsx
import React from 'react';
import type { Contact } from '../../types/contacts';

const SEATING_LABELS = {
  window: 'Window', aisle: 'Aisle', middle: 'Middle', no_preference: 'No preference',
} as const;

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p
        className="text-t3 text-xs uppercase mb-0.5"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </p>
      <p className="text-t1 text-sm">{value}</p>
    </div>
  );
}

export default function OverviewTab({ contact }: { contact: Contact }) {
  const hasAddress = contact.address || contact.city || contact.state || contact.country;
  const hasTravel = contact.homeAirport || contact.seatingPreference;
  const hasCollab = contact.category === 'collaborator' &&
    (contact.proAffiliations.length > 0 || contact.publisherAffiliations.length > 0);

  return (
    <div className="space-y-[28px]">
      {/* Contact info */}
      <div className="tm-card tm-card-padded">
        <div className="tm-card-header"><h2>Contact Information</h2></div>
        <div className="tm-card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <Field label="Email"   value={contact.email} />
            <Field label="Phone"   value={contact.phone} />
            <Field label="Website" value={contact.website} />
          </div>
        </div>
      </div>

      {/* Address */}
      {hasAddress && (
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Address</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <Field label="Street"       value={contact.address} />
              <Field label="City"         value={contact.city} />
              <Field label="State/Region" value={contact.state} />
              <Field label="Country"      value={contact.country} />
              <Field label="Postal Code"  value={contact.postalCode} />
            </div>
          </div>
        </div>
      )}

      {/* Travel */}
      {hasTravel && (
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Travel Preferences</h2></div>
          <div className="tm-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Home Airport"       value={contact.homeAirport} />
              <Field
                label="Seating Preference"
                value={contact.seatingPreference ? SEATING_LABELS[contact.seatingPreference] : undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* PRO & Publishing (collaborators only) */}
      {hasCollab && (
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>PRO & Publishing</h2></div>
          <div className="tm-card-body space-y-6">
            {contact.proAffiliations.length > 0 && (
              <div>
                <p className="section-header mb-2">PRO Affiliations</p>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Organization</th><th>IPI Number</th></tr></thead>
                    <tbody>
                      {contact.proAffiliations.map((pro, i) => (
                        <tr key={i}>
                          <td className="text-t1">{pro.name}</td>
                          <td className="text-t2">{pro.ipiNumber ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {contact.publisherAffiliations.length > 0 && (
              <div>
                <p className="section-header mb-2">Publisher Affiliations</p>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Publisher</th><th>IPI Number</th></tr></thead>
                    <tbody>
                      {contact.publisherAffiliations.map((pub, i) => (
                        <tr key={i}>
                          <td className="text-t1">{pub.name}</td>
                          <td className="text-t2">{pub.ipiNumber ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bio */}
      {contact.bio && (
        <div className="tm-card tm-card-padded">
          <div className="tm-card-header"><h2>Bio</h2></div>
          <div className="tm-card-body">
            <p className="text-t2 text-sm leading-relaxed whitespace-pre-wrap">{contact.bio}</p>
          </div>
        </div>
      )}

      {/* No data state */}
      {!contact.email && !contact.phone && !contact.website && !hasAddress && !hasTravel && !hasCollab && !contact.bio && (
        <div className="empty-state">
          <p className="empty-state-title">No overview information</p>
          <p className="empty-state-desc">Edit this contact to add details.</p>
        </div>
      )}
    </div>
  );
}
