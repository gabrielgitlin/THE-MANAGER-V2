import { User } from './index';

export interface PersonnelProfile {
  id: string;
  userId: string;
  type: 'songwriter' | 'producer' | 'artist' | 'mix_engineer' | 'mastering_engineer';
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  bio?: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    [key: string]: string | undefined;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PersonnelPRO {
  id: string;
  personnelId: string;
  proId: string;
  ipiNumber: string;
  isPrimary: boolean;
  pro: {
    name: string;
    country?: string;
  };
}

export interface PersonnelPublisher {
  id: string;
  personnelId: string;
  publisherId: string;
  ipiNumber: string;
  isPrimary: boolean;
  publisher: {
    name: string;
  };
}

export interface PersonnelFormData {
  type: PersonnelProfile['type'];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  bio: string;
  website: string;
  socialLinks: PersonnelProfile['socialLinks'];
  pros: Array<{
    proId: string;
    ipiNumber: string;
    isPrimary: boolean;
  }>;
  publishers: Array<{
    publisherId: string;
    ipiNumber: string;
    isPrimary: boolean;
  }>;
}