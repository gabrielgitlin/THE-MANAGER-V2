export const ORG_TYPES = [
  'label','publisher','management','booking','distributor',
  'pr','marketing','law','accounting','studio','venue',
  'festival','promoter','sync','pro','mech_rights','merch','brand','other',
] as const;
export type OrganizationType = typeof ORG_TYPES[number];

export const ORG_TYPE_LABELS: Record<OrganizationType, string> = {
  label: 'Record Label', publisher: 'Publisher', management: 'Management',
  booking: 'Booking Agency', distributor: 'Distributor', pr: 'PR',
  marketing: 'Marketing', law: 'Law Firm', accounting: 'Accounting',
  studio: 'Studio', venue: 'Venue', festival: 'Festival',
  promoter: 'Promoter', sync: 'Sync Agency', pro: 'PRO',
  mech_rights: 'Mechanical Rights', merch: 'Merch', brand: 'Brand', other: 'Other',
};

export interface Organization {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  type: OrganizationType;
  parentOrgId?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  logoUrl?: string;
  bio?: string;
  notes?: string;
  tags: string[];
  socialLinks: Record<string, string>;
  visibility: 'workspace' | 'private';
  createdAt: string;
  updatedAt: string;
}

export type OrganizationFormData = Omit<Organization,
  'id' | 'workspaceId' | 'createdBy' | 'createdAt' | 'updatedAt'>;
