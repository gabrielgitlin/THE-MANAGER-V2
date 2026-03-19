// User types
export interface User {
  id: string;
  email: string;
  role: string;
  full_name: string;
  avatar_url: string;
}

// Permission types
export type AccessLevel = 'view' | 'comment' | 'edit' | 'full';

export type Permission = 
  | 'view_catalog'
  | 'edit_catalog'
  | 'view_finance'
  | 'edit_finance'
  | 'view_legal'
  | 'edit_legal'
  | 'view_live'
  | 'edit_live'
  | 'view_marketing'
  | 'edit_marketing'
  | 'view_personnel'
  | 'edit_personnel'
  | 'view_sensitive_info'
  | 'edit_sensitive_info'
  | 'view_dashboard'
  | 'edit_dashboard';

export type Role = 
  | 'admin'
  | 'artist_manager'
  | 'artist'
  | 'attorney'
  | 'tour_manager'
  | 'marketing_manager'
  | 'finance_manager'
  | 'team_member';

export type ModulePermissions = {
  catalog?: AccessLevel;
  finance?: AccessLevel;
  legal?: AccessLevel;
  live?: AccessLevel;
  marketing?: AccessLevel;
  personnel?: AccessLevel;
  info?: AccessLevel;
  dashboard?: AccessLevel;
};

// Catalog types
export interface CreditShare {
  name: string;
  masterPercentage?: number;
  publishingPercentage?: number;
  pros?: PRO[];
  publishers?: Publisher[];
}

export interface PRO {
  id: string;
  name: string;
  country?: string;
  ipiNumber: string;
}

export interface Publisher {
  id: string;
  name: string;
  ipiNumber: string;
}

export interface Track {
  id: number;
  albumId: number;
  discNumber: number;
  trackNumber: number;
  title: string;
  duration?: string;
  isrc?: string;
  isrcAtmos?: string;
  isrcVideo?: string;
  upc?: string;
  upcAtmos?: string;
  spotifyUri?: string;
  appleId?: string;
  officialVideoUrl?: string;
  lyricVideoUrl?: string;
  visualizerUrl?: string;
  lyrics?: string;
  lyricsUrl?: string;
  audioUrl?: string;
  status?: 'Released' | 'Unreleased';
  streams?: number;
  format?: string;
  releaseDate?: string;
  label?: string;
  distributor?: string;
  genres: string[];
  producers: string[];
  songwriters: CreditShare[];
  mixEngineers: string[];
  masteringEngineers: string[];
}

export interface Album {
  id: number;
  title: string;
  artist: string;
  releaseDate: string;
  format: string;
  label?: string;
  distributor?: string;
  status: string;
  genres: string[];
  upc?: string;
  artworkUrl?: string;
  artistCredits: CreditShare[];
  producers: CreditShare[];
  mixEngineers: CreditShare[];
  masteringEngineers: CreditShare[];
  tracks: Track[];
}

// Digital Assets
export interface DigitalAsset {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  category: 'artwork' | 'audio' | 'video' | 'document' | 'other';
  uploadDate: string;
  uploadedBy: string;
  description?: string;
  tags?: string[];
}

// Finance types
export type BudgetCategory = 'Art' | 'Digital' | 'Marketing' | 'Music' | 'Press' | 'Other';
export type TransactionType = 'Income' | 'Expense';
export type IncomeStatus = 'received' | 'pending';
export type ExpenseStatus = 'paid' | 'unpaid';
export type PaymentStatus = IncomeStatus | ExpenseStatus;
export type BudgetType = 'release' | 'show' | 'tour';

export interface BudgetItem {
  id: number;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  category: BudgetCategory;
  status: PaymentStatus;
  notes?: string;
  attachments?: string[];
}

export interface BudgetSummary {
  category: BudgetCategory;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
}

export interface Budget {
  id: number;
  type: BudgetType | 'other';
  title: string;
  artist: string;
  status: 'planning' | 'in_progress' | 'completed';

  // Linked entities
  albumId?: number;
  showId?: number;

  // Release specific
  releaseType?: 'single' | 'ep' | 'album';
  releaseDate?: string;
  tracks?: number[];
  newTracks?: {
    tempId: string;
    title: string;
    duration?: string;
    isrc?: string;
  }[];

  // Show specific
  date?: string;
  venue?: string;
  city?: string;

  // Tour specific
  startDate?: string;
  endDate?: string;
  shows?: number[];

  // Budget data
  budgetItems: BudgetItem[];
  categoryBudgets: {
    category: BudgetCategory;
    budgetAmount: number;
  }[];

  // Commission settings
  bookingAgentCommissionRate?: number;
  managementCommissionRate?: number;
  applyCommissions?: boolean;
}

export interface TrackFinance {
  id: number;
  trackId: number;
  artist: string;
  title: string;
  releaseDate: string;
  status: string;
  budgetItems: BudgetItem[];
  categoryBudgets: {
    category: BudgetCategory;
    budgetAmount: number;
  }[];
}

// Live types
export interface Show {
  id: number;
  title: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  country: string;
  venue_address?: string;
  venue_state?: string;
  venue_latitude?: number;
  venue_longitude?: number;
  google_place_id?: string;
  venue_id?: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  capacity: number;
  ticketsSold?: number;
  deal?: ShowDeal;
  advances?: ShowAdvances;
  setlist?: Setlist;
  guestList?: GuestListEntry[];
}

export interface ShowDeal {
  type: 'guarantee' | 'percentage' | 'guarantee_vs_percentage';
  guarantee?: number;
  percentage?: number;
  expenses: {
    [key: string]: number;
  };
  settlement: {
    gross: number;
    expenses: number;
    net: number;
  };
}

export interface ShowAdvances {
  productionManager: {
    name: string;
    email: string;
    phone: string;
  };
  venueContact: {
    name: string;
    email: string;
    phone: string;
  };
  schedule: {
    loadIn: string;
    soundcheck: string;
    doors: string;
    showtime: string;
    curfew: string;
  };
  catering: {
    mealTimes: {
      lunch: string;
      dinner: string;
    };
    requirements: string;
  };
  parking: {
    trucks: string;
    buses: string;
    cars: string;
    location: string;
  };
}

export interface Setlist {
  id: number;
  showId: number;
  songs: SetlistItem[];
  notes?: string;
  lastUpdated: string;
  updatedBy: string;
  status: 'draft' | 'approved' | 'final';
}

export interface SetlistItem {
  id: number;
  position: number;
  songTitle: string;
  duration?: string;
  key?: string;
  notes?: string;
  isEncore?: boolean;
}

export interface GuestListEntry {
  id: number;
  showId: number;
  name: string;
  type: 'vip' | 'industry' | 'friends_family' | 'media' | 'other';
  quantity: number;
  requestedBy: string;
  status: 'approved' | 'pending' | 'declined';
  notes?: string;
  contactInfo?: string;
  ticketsSent?: boolean;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  capacity: number;
  website?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  google_place_id?: string;
  is_verified?: boolean;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GooglePlacePrediction {
  placeId: string;
  name: string;
  address: string;
  fullDescription: string;
  types: string[];
}

export interface GooglePlaceDetails {
  placeId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  phone: string;
  website: string;
  types: string[];
}

export interface VenueSearchResult {
  id?: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  google_place_id?: string;
  capacity?: number;
  website?: string;
  phone?: string;
  is_verified?: boolean;
  usage_count?: number;
  source: 'database' | 'google';
}

export interface CrewMember {
  id: number;
  name: string;
  role: CrewRole;
  email: string;
  phone: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  passportId?: string;
  homeAirport?: string;
  seatingPreference?: string;
  knownTraveler?: string;
  mileagePlan?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  shows?: {
    name: string;
    date: string;
    status: string;
    fee?: number;
  }[];
  standardFee?: number;
  tags?: string[];
}

export type CrewRole = 
  | 'sound' 
  | 'lighting' 
  | 'stage' 
  | 'backline' 
  | 'tour_manager' 
  | 'production_manager' 
  | 'driver' 
  | 'security' 
  | 'other';

export interface MarketingTask {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
}

export interface ProductionFile {
  id: number;
  name: string;
  type: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
  version: string;
}

// Legal types
export type DocumentType = 'contract' | 'license' | 'release' | 'agreement' | 'other';
export type DocumentStatus = 'draft' | 'pending_review' | 'pending_signature' | 'active' | 'expired' | 'terminated';

export interface LegalDocument {
  id: number;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  parties: string[];
  effectiveDate: string;
  expirationDate?: string;
  description?: string;
  fileName: string;
  lastModified: string;
  tags: string[];
  version: string;
  signedBy?: string[];
  pendingSignatures?: string[];
  notes?: Note[];
  aiAnalysis?: {
    summary: string;
    keyTerms: string[];
    risks: string[];
    recommendations: string[];
  };
}

// Notes and Tasks types
export type NoteCategory = 'todo' | 'meeting' | 'idea' | 'other';

export interface Note {
  id: number;
  title?: string;
  content: string;
  category?: NoteCategory;
  color?: string;
  minimized?: boolean;
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  createdAt: string;
  createdBy: string;
  tags?: string[];
}

export interface Comment {
  id: number;
  content: string;
  author: string;
  createdAt: Date;
}

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  completedAt?: Date;
  notes?: string;
  assignedTo?: string;
  comments: Comment[];
}

// Team types
export interface Tag {
  id: string;
  name: string;
  color: string;
}