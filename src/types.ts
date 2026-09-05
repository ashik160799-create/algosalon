export type Role = 'customer' | 'business';

// =============================================================================
// CUSTOMER DOMAIN TYPES
// =============================================================================

/**
 * Primary domain entity for an end-user / salon patron (Customer)
 * Contains all patron-specific preferences, loyalty records, and personal attributes.
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  dateOfBirth?: string;
  nationality?: string;
  appCode?: string;
  savedSalonIds: string[];
  loyaltyPoints: number;
  preferredLocale?: string;
  preferredCurrency?: string;
  marketingOptIn?: boolean;
}

/**
 * Backward-compatible alias for Customer
 */
export type CustomerUser = Customer;

// =============================================================================
// BUSINESS DOMAIN TYPES
// =============================================================================

/**
 * Primary domain entity for a salon owner, manager, or enterprise administrator (Business)
 * Contains all business operations, location, role, and commercial settings.
 */
export interface Business {
  id: string;
  name: string;
  email: string;
  phone?: string;
  salonId: string;
  ownerRole: string;
  businessName?: string;
  category?: string;
  location?: string;
  appCode?: string;
  signUpGmail?: string;
  isGmailLinked?: boolean;
  licenseNumber?: string;
  trnNumber?: string;
  status?: 'pending_review' | 'published' | 'suspended' | 'archived';
}

/**
 * Primary type export for Business domain entity
 */
export type BusinessUser = Business;

/**
 * Alias for Business (accommodating prompt typo "type Businee")
 */
export type Businee = Business;

// =============================================================================
// BUSINESS CONFIGURATION & CATALOG TYPES
// =============================================================================

export interface WorkingDayHour {
  day: string;
  isOpen: boolean;
  open: string;
  close: string;
}

export interface SpecialDateSchedule {
  id: string;
  date: string; // YYYY-MM-DD
  title: string; // e.g. "Christmas Day", "National Day Holiday", "VIP Private Event"
  isOpen: boolean;
  open?: string;
  close?: string;
  reason?: string;
}

export interface StaffMember {
  id: string;
  salonId: string;
  name: string;
  gender?: 'Male' | 'Female';
  roleTitle: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  experienceYears?: number;
  specialties: string[];
  isAvailable: boolean;
  workingDays: string[];
  phone?: string;
  commissionRate?: number;
  shiftHours?: string;
}

export interface ServiceItem {
  id: string;
  salonId: string;
  name: string;
  category: 'Haircut' | 'Styling' | 'Coloring' | 'Beard & Shave' | 'Spa & Facial' | 'Nails & Lashes';
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  genderTarget?: 'Unisex' | 'Male' | 'Female';
  offerTag?: string;
  durationMinutes: number;
  description: string;
  image?: string;
  isPopular?: boolean;
}

export interface SalonDocument {
  id: string;
  name: string;
  type: 'trade_license' | 'health_sanitation' | 'liability_insurance' | 'tax_certificate' | 'other';
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  status: 'verified' | 'pending_review' | 'expired';
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
}

export interface Salon {
  id: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  mapUrl?: string;
  distanceKm: number;
  lat: number;
  lng: number;
  phone: string;
  rating: number;
  reviewCount: number;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  logo?: string;
  image: string;
  coverImage: string;
  amenities: string[];
  isOpenNow: boolean;
  workingHours: WorkingDayHour[];
  specialSchedules?: SpecialDateSchedule[];
  categories: string[];
  featured?: boolean;
  isVerified?: boolean;
  discountBadge?: string;
  genderTarget?: 'All' | 'Men' | 'Women' | 'Unisex';
  startingPrice?: number;
  likesCount?: number;
  documents?: SalonDocument[];
  trnNumber?: string;
  licenseNumber?: string;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'rescheduled_by_business'
  | 'completed'
  | 'cancelled';

export interface Appointment {
  id: string;
  salonId: string;
  salonName: string;
  salonAddress: string;
  salonPhone: string;
  salonImage: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAvatar?: string;
  isVip?: boolean;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  durationMinutes: number;
  staffId: string;
  staffName: string;
  staffAvatar: string;
  date: string;
  timeSlot: string;
  suggestedDate?: string;
  suggestedTimeSlot?: string;
  suggestedNote?: string;
  declineReason?: string;
  declineApology?: string;
  status: AppointmentStatus;
  paymentMethod: 'pay_at_salon' | 'card';
  notes?: string;
  createdAt: string;
  reviewed?: boolean;
}

export interface Review {
  id: string;
  appointmentId?: string;
  salonId: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  rating: number;
  date: string;
  comment: string;
  serviceName?: string;
  staffName?: string;
  reply?: string;
  businessReply?: {
    date: string;
    message: string;
  };
}

export interface NotificationItem {
  id: string;
  userId?: string;
  userType: Role;
  title: string;
  message: string;
  timestamp?: string;
  date?: string;
  read: boolean;
  type?: 'booking' | 'reminder' | 'review' | 'promo' | string;
  linkTab?: string;
  appointmentId?: string;
}

export type ColorThemeId =
  | 'amethyst'
  | 'white_block'
  | 'white_yellow'
  | 'white_purple'
  | 'white_pink'
  | 'monochrome'
  | 'gold'
  | 'rosegold'
  | 'emerald'
  | 'sapphire'
  | 'coral';
export type ColorThemeMode = 'dark' | 'light';

export interface ThemeConfig {
  id: ColorThemeId;
  name: string;
  tagline: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  glowHex: string;
  previewGradient: string;
  badgeClass: string;
}
