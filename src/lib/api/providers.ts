import { ProviderProfile } from '../../types';
import { MOCK_PROVIDERS } from '../mockData';
import { categoryIdToName, categoryNameToId } from './categories';
import { isDevDemoMode, supabase } from './supabaseClient';

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

function mapProviderProfile(row: any): ProviderProfile {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  const skills = Array.isArray(row.skills) && row.skills.length > 0
    ? row.skills
    : category?.name ? [category.name.toLowerCase()] : [];
  const isVerified = Boolean(row.is_verified);

  return {
    id: row.user_id,
    userId: row.user_id,
    name: profile?.full_name || 'Local Professional',
    avatar: profile?.avatar_url || '',
    phone: profile?.phone || '',
    headline: row.headline || `${skills[0] || 'Local'} service professional`,
    bio: row.bio || '',
    skills,
    yearsOfExperience: row.years_experience || 0,
    hourlyRate: Number(row.price_amount || 0),
    pricingType: row.price_unit === 'visit' ? 'visit' : 'hourly',
    workingHours: row.working_hours || '',
    baseLocation: row.base_city || '',
    serviceRadiusKm: Number(row.service_radius_km || 10),
    availabilityStatus: row.availability || 'offline',
    isVerified,
    rating: Number(row.rating_avg || 0),
    totalReviews: Number(row.rating_count || 0),
    completedJobsCount: 0,
    portfolio: (row.portfolio_photos || []).map((photo: { url: string }) => photo.url),
    idVerificationStatus: isVerified ? 'verified' : 'pending',
  };
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
  let list: ProviderProfile[];
  if (isDevDemoMode()) {
    await new Promise((r) => setTimeout(r, 200));
    list = getStoredProviders();
  } else {
    const { data, error } = await supabase
      .from('provider_profiles')
      .select('*, profiles!provider_profiles_user_id_fkey(full_name, phone, avatar_url), categories!provider_profiles_category_id_fkey(name), portfolio_photos(url)')
      .order('rating_avg', { ascending: false });
    if (error) throw error;
    list = (data || []).map(mapProviderProfile);
  }

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
  if (isDevDemoMode()) {
    await new Promise((r) => setTimeout(r, 150));
    const list = getStoredProviders();
    return list.find((p) => p.id === id || p.userId === id) || null;
  }

  const { data, error } = await supabase
    .from('provider_profiles')
    .select('*, profiles!provider_profiles_user_id_fkey(full_name, phone, avatar_url), categories!provider_profiles_category_id_fkey(name), portfolio_photos(url)')
    .eq('user_id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProviderProfile(data) : null;
}

export async function saveProviderProfile(profile: Partial<ProviderProfile> & { id?: string }): Promise<ProviderProfile> {
  if (!isDevDemoMode()) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Sign in before saving a provider profile.');
    if (profile.userId && profile.userId !== user.id) {
      throw new Error('You can only edit your own provider profile.');
    }

    const userId = user.id;
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: profile.name })
      .eq('id', userId);
    if (profileError) throw profileError;

    const { data, error } = await supabase
      .from('provider_profiles')
      .upsert({
        user_id: userId,
        category_id: categoryNameToId(profile.skills?.[0] || 'electrician'),
        bio: profile.bio || '',
        skills: profile.skills || [],
        years_experience: profile.yearsOfExperience || 0,
        price_amount: profile.hourlyRate || 0,
        price_unit: profile.pricingType || 'hourly',
        headline: profile.headline || '',
        working_hours: profile.workingHours || '',
        base_city: profile.baseLocation || '',
        service_radius_km: profile.serviceRadiusKm || 10,
        availability: profile.availabilityStatus || 'available',
      }, { onConflict: 'user_id' })
      .select('*, profiles!provider_profiles_user_id_fkey(full_name, phone, avatar_url), categories!provider_profiles_category_id_fkey(name), portfolio_photos(url)')
      .single();
    if (error) throw error;

    const portfolio = profile.portfolio || [];
    const { data: currentPhotos, error: photosError } = await supabase
      .from('portfolio_photos')
      .select('url')
      .eq('provider_id', userId);
    if (photosError) throw photosError;

    const existingUrls = new Set((currentPhotos || []).map((photo) => photo.url));
    const desiredUrls = new Set(portfolio);
    for (const url of existingUrls) {
      if (!desiredUrls.has(url)) {
        const { error: deleteError } = await supabase
          .from('portfolio_photos')
          .delete()
          .eq('provider_id', userId)
          .eq('url', url);
        if (deleteError) throw deleteError;
      }
    }

    const newPhotos = portfolio
      .filter((url) => !existingUrls.has(url))
      .map((url) => ({ provider_id: userId, url }));
    if (newPhotos.length > 0) {
      const { error: insertError } = await supabase.from('portfolio_photos').insert(newPhotos);
      if (insertError) throw insertError;
    }

    const { data: savedProfile, error: refreshError } = await supabase
      .from('provider_profiles')
      .select('*, profiles!provider_profiles_user_id_fkey(full_name, phone, avatar_url), categories!provider_profiles_category_id_fkey(name), portfolio_photos(url)')
      .eq('user_id', userId)
      .single();
    if (refreshError) throw refreshError;
    return mapProviderProfile(savedProfile || data);
  }

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
