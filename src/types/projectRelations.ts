export interface ProjectRelation {
  id: string;
  workspaceId: string;
  projectId: string;
  contactId?: string;
  organizationId?: string;
  role: string;
  roleCustom?: string;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
}

export type ProjectRelationFormData = Omit<ProjectRelation, 'id' | 'workspaceId' | 'createdAt'>;
