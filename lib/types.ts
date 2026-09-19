export type LeadStatus = 'new' | 'contacted' | 'interested' | 'converted' | 'rejected';

export type PriorityLevel = 'high' | 'medium' | 'low';

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
}

export type LinkStatus = 'valid' | 'broken' | 'timeout' | 'unknown';

export interface ValidationState {
  whatsapp?: boolean;
  website?: LinkStatus;
  instagram?: LinkStatus;
  facebook?: LinkStatus;
  tiktok?: LinkStatus;
  validatedAt?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  formattedPhone?: string;
  email?: string;
  address: string;
  city: string;
  country?: string;
  category: string;
  rating: number;
  userRatingsTotal: number;
  website?: string;
  googleMapsUrl?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  status: LeadStatus;
  notes?: string;
  extractedAt: string;
  opportunityScore?: number;
  opportunityReason?: string;
  priority?: PriorityLevel;
  tag?: string;
  socialLinks?: SocialLinks;
  validation?: ValidationState;
  followUpDate?: string;
  followUpNotes?: string;
  listId?: string;
  isNew?: boolean;
  isPreviouslySaved?: boolean;
  hasWhatsApp?: boolean;
}

export interface SavedList {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string;
  createdAt: string;
  leadsCount: number;
}

export interface SearchParams {
  query: string;
  city: string;
  country?: string;
  category?: string;
  minRating?: number;
  hasPhoneOnly?: boolean;
  limit?: number;
  skipDuplicates?: boolean;
  pageToken?: string;
  excludePlaceIds?: string[];
}

export interface FilterState {
  searchTerm: string;
  status: LeadStatus | 'all';
  hasPhoneOnly: boolean;
  websiteFilter: 'all' | 'has_website' | 'no_website';
  socialFilter: 'all' | 'has_social' | 'no_social';
  hasEmailOnly: boolean;
  priorityFilter: 'all' | PriorityLevel;
  followUpFilter: 'all' | 'due_today' | 'scheduled';
  tagFilter: 'all' | string;
  minRating: number;
  sortBy: 'rating' | 'name' | 'userRatingsTotal' | 'opportunityScore';
  sortOrder: 'asc' | 'desc';
}

export interface MarketingTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  template: string;
}

export interface ProposalConfig {
  leadName: string;
  serviceType: string;
  serviceDescription: string;
  price: number;
  currency: string;
  deliverables: string[];
  validUntilDays: number;
  agencyName: string;
  agencyPhone: string;
}
