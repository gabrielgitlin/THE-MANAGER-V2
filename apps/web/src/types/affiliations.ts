export interface ContactAffiliation {
  id: string;
  workspaceId: string;
  contactId: string;
  organizationId: string;
  role: string;
  roleCustom?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
}

export type AffiliationFormData = Omit<ContactAffiliation, 'id' | 'workspaceId' | 'createdAt'>;
