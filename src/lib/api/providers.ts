import { ProviderProfile } from '../../types';
import { MOCK_PROVIDERS } from '../mockData';

const PROVIDERS_STORAGE_KEY = 'locallink_providers_cache';

function getStoredProviders(): ProviderProfile[] {
  const cached = localStorage.getItem(PROVIDERS_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return [...MOCK_PROVIDERS];
}

function saveStoredProviders(providers: ProviderProfile[]) {
  localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(providers));
}

export interface ProviderFilterOptions {
  category?: string;
  searchQuery?: string;
  maxDistanceKm?: number;
  minRating?: number;
  maxPrice?: number;
  availableOnly?: boolean;
  verifiedOnly?: boolean;
  sortBy?: 'rating' | 'distance' | 'price' | 'experience';
}

export async function getProviders(filters: ProviderFilterOptions = {}): Promise<ProviderProfile[]> {
  // TODO: Connect supabase.from('providers').select('*')...
  // Simulating network delay
  await new Promise((r) => setTimeout(r, 200));

  let list = getStoredProviders();

  if (filters.category && filters.category !== 'all') {
    list = list.filter((p) => p.skills.includes(filters.category!));
  }

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.headline.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q) ||
        p.baseLocation.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q))
    );
  }

  if (filters.maxDistanceKm) {
    list = list.filter((p) => (p.serviceRadiusKm || 10) <= filters.maxDistanceKm!);
  }

  if (filters.minRating) {
    list = list.filter((p) => p.rating >= filters.minRating!);
  }

  if (filters.maxPrice) {
    list = list.filter((p) => p.hourlyRate <= filters.maxPrice!);
  }

  if (filters.availableOnly) {
    list = list.filter((p) => p.availabilityStatus === 'available');
  }

  if (filters.verifiedOnly) {
    list = list.filter((p) => p.isVerified);
  }

  // Sort
  if (filters.sortBy === 'rating') {
    list.sort((a, b) => b.rating - a.rating);
  } else if (filters.sortBy === 'price') {
    list.sort((a, b) => a.hourlyRate - b.hourlyRate);
  } else if (filters.sortBy === 'experience') {
    list.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
  } else if (filters.sortBy === 'distance') {
    list.sort((a, b) => a.serviceRadiusKm - b.serviceRadiusKm);
  }

  return list;
}

export async function getProviderById(id: string): Promise<ProviderProfile | null> {
  // TODO: Connect supabase.from('providers').select('*').eq('id', id).single()
  await new Promise((r) => setTimeout(r, 150));
  const list = getStoredProviders();
  return list.find((p) => p.id === id || p.userId === id) || null;
}

export async function saveProviderProfile(profile: Partial<ProviderProfile> & { id?: string }): Promise<ProviderProfile> {
  // TODO: Connect supabase.from('providers').upsert(...)
  const list = getStoredProviders();
  const existingIdx = list.findIndex((p) => p.id === profile.id || p.userId === profile.userId);

  let updated: ProviderProfile;
  if (existingIdx >= 0) {
    updated = {
      ...list[existingIdx],
      ...profile,
    } as ProviderProfile;
    list[existingIdx] = updated;
  } else {
    updated = {
      id: profile.id || 'pro_' + Date.now(),
      userId: profile.userId || 'usr_current',
      name: profile.name || 'Local Professional',
      avatar: profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      phone: profile.phone || '+91 98000 00000',
      headline: profile.headline || 'Neighborhood Service Specialist',
      bio: profile.bio || '',
      skills: profile.skills || ['electrician'],
      yearsOfExperience: profile.yearsOfExperience || 3,
      hourlyRate: profile.hourlyRate || 350,
      pricingType: profile.pricingType || 'hourly',
      workingHours: profile.workingHours || '8:00 AM - 7:00 PM',
      baseLocation: profile.baseLocation || 'Neighborhood Area',
      serviceRadiusKm: profile.serviceRadiusKm || 8,
      availabilityStatus: profile.availabilityStatus || 'available',
      isVerified: profile.isVerified || false,
      rating: 5.0,
      totalReviews: 0,
      completedJobsCount: 0,
      portfolio: profile.portfolio || [],
      idVerificationStatus: profile.idVerificationStatus || 'pending',
    };
    list.unshift(updated);
  }

  saveStoredProviders(list);
  return updated;
}

/**
 * Placeholder for Third-party Government ID Verification Integration (e.g., Digilocker, Hyperverge, IDfy)
 */
export async function submitIdVerification(
  _providerId: string,
  _docType: string,
  _docNumber: string,
  _docImage?: string
): Promise<{ success: boolean; status: 'verified' | 'pending'; message: string }> {
  // TODO: Call third-party ID verification API (Hyperverge/IDfy/Digilocker webhook)
  await new Promise((r) => setTimeout(r, 600));
  return {
    success: true,
    status: 'verified',
    message: 'Identity verification processed successfully by security partner.',
  };
}
