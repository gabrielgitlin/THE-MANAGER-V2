export type ContactCategory = 'collaborator' | 'crew' | 'business' | 'other';
export type SeatingPreference = 'window' | 'aisle' | 'middle' | 'no_preference';

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  facebook?: string;
  linkedin?: string;
  spotify?: string;
  soundcloud?: string;
}

export interface ProAffiliation {
  name: string;
  ipiNumber?: string;
  isPrimary: boolean;
}

export interface PublisherAffiliation {
  name: string;
  ipiNumber?: string;
  isPrimary: boolean;
}

export interface Contact {
  id: string;
  userId: string;
  workspaceId: string;
  visibility: 'workspace' | 'private';
  category: ContactCategory;
  role?: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl?: string;
  email?: string;
  phone?: string;
  website?: string;
  homeAirport?: string;
  seatingPreference?: SeatingPreference;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  socialLinks: SocialLinks;
  proAffiliations: ProAffiliation[];
  publisherAffiliations: PublisherAffiliation[];
  bio?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type ContactFormData = Omit<Contact, 'id' | 'userId' | 'workspaceId' | 'createdAt' | 'updatedAt'> & {
  visibility?: 'workspace' | 'private';
};

export interface ContactPaymentInfo {
  id: string;
  contactId: string;
  userId: string;
  bankName?: string;
  accountHolderName?: string;
  routingNumber?: string;
  accountNumber?: string;
  accountType?: 'checking' | 'savings';
  swiftCode?: string;
  iban?: string;
  bankAddress?: string;
  paypalEmail?: string;
  venmoHandle?: string;
  zelleContact?: string;
  taxId?: string;
  w9OnFile: boolean;
  w9FileUrl?: string;
  updatedAt: string;
}

export type ContactPaymentFormData = Omit<ContactPaymentInfo, 'id' | 'contactId' | 'userId' | 'updatedAt'>;

export interface ContactFile {
  id: string;
  contactId: string;
  userId: string;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize?: number;
  description?: string;
  uploadedAt: string;
}
