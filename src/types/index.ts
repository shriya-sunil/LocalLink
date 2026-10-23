export type UserRole = 'customer' | 'provider';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  avatar?: string;
  activeRole: UserRole;
  isProRegistered: boolean;
  createdAt: string;
}

export type AvailabilityStatus = 'available' | 'busy' | 'offline';
export type VerificationStatus = 'unverified' | 'pending' | 'verified';

export interface ProviderProfile {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  phone: string;
  headline: string;
  bio: string;
  skills: string[]; // e.g. ['electrician', 'repair']
  yearsOfExperience: number;
  hourlyRate: number;
  pricingType: 'hourly' | 'visit';
  workingHours: string;
  baseLocation: string;
  serviceRadiusKm: number;
  availabilityStatus: AvailabilityStatus;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
  completedJobsCount: number;
  portfolio: string[];
  idVerificationStatus: VerificationStatus;
  idDocumentType?: string;
  idDocumentNumber?: string;
}

export interface ServiceCategory {
  id: string;
  nameKey: string;
  icon: string;
  popular?: boolean;
}

export type UrgencyType = 'emergency' | 'flexible';

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  customerPhone?: string;
  category: string;
  title: string;
  description: string;
  photos: string[];
  urgency: UrgencyType;
  preferredDate?: string;
  preferredTime?: string;
  address?: string;
  budgetMin?: number;
  budgetMax?: number;
  status: 'open' | 'quoted' | 'booked' | 'cancelled';
  quotesCount: number;
  createdAt: string;
}

export interface Quote {
  id: string;
  requestId: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  providerRating: number;
  providerPhone?: string;
  price: number;
  message: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

export type BookingStatus = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentMethod = 'online' | 'cash';

export interface Booking {
  id: string;
  requestId?: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  customerPhone?: string;
  customerAddress?: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  providerPhone?: string;
  serviceTitle: string;
  category: string;
  price: number;
  status: BookingStatus;
  paymentStatus: 'pending' | 'completed';
  paymentMethod?: PaymentMethod;
  customerConfirmedCompletion: boolean;
  createdAt: string;
  completedAt?: string;
  hasReview?: boolean;
}

export interface Review {
  id: string;
  bookingId: string;
  providerId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantRole: UserRole;
  participantPhone?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'quote' | 'booking' | 'chat' | 'system';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ReportTicket {
  id: string;
  reporterId: string;
  targetType: 'user' | 'booking' | 'request';
  targetId: string;
  targetName?: string;
  reason: string;
  details: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  topic: string;
  message: string;
  screenshotUrl?: string;
  status: 'open' | 'resolved';
  createdAt: string;
}
