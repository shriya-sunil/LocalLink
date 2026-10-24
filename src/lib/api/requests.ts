import { ServiceRequest, Quote } from '../../types';
import { MOCK_REQUESTS, MOCK_QUOTES } from '../mockData';
import { categoryIdToName, categoryNameToId } from './categories';
import { isDevDemoMode, supabase } from './supabaseClient';

const REQUESTS_STORAGE_KEY = 'locallink_requests_cache';
const QUOTES_STORAGE_KEY = 'locallink_quotes_cache';

function getStoredRequests(): ServiceRequest[] {
  const cached = localStorage.getItem(REQUESTS_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return [...MOCK_REQUESTS];
}

function saveStoredRequests(list: ServiceRequest[]) {
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(list));
}

function getStoredQuotes(): Quote[] {
  const cached = localStorage.getItem(QUOTES_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return [...MOCK_QUOTES];
}

function saveStoredQuotes(list: Quote[]) {
  localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(list));
}

function mapRequest(row: any): ServiceRequest {
  const customer = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  const quoteRows = Array.isArray(row.quotes) ? row.quotes : [];

  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: customer?.full_name || 'Neighbor',
    customerAvatar: customer?.avatar_url || undefined,
    customerPhone: customer?.phone || undefined,
    category: category?.name?.toLowerCase() || categoryIdToName(row.category_id),
    title: row.title,
    description: row.description || '',
    photos: row.media_urls || [],
    urgency: row.urgency,
    preferredDate: row.preferred_date ? new Date(row.preferred_date).toLocaleDateString() : undefined,
    preferredTime: row.preferred_time || undefined,
    address: row.address || undefined,
    budgetMin: row.budget_min === null ? undefined : Number(row.budget_min),
    budgetMax: row.budget_max === null ? undefined : Number(row.budget_max),
    status: row.status,
    quotesCount: quoteRows[0]?.count || 0,
    createdAt: row.created_at,
  };
}

function mapQuote(row: any): Quote {
  const providerProfile = Array.isArray(row.provider_profiles) ? row.provider_profiles[0] : row.provider_profiles;
  const provider = Array.isArray(providerProfile?.profiles) ? providerProfile.profiles[0] : providerProfile?.profiles;

  return {
    id: row.id,
    requestId: row.request_id,
    providerId: row.provider_id,
    providerName: provider?.full_name || 'Local Professional',
    providerAvatar: provider?.avatar_url || '',
    providerRating: Number(providerProfile?.rating_avg || 0),
    providerExperience: Number(providerProfile?.years_experience || 0),
    providerReviewCount: Number(providerProfile?.rating_count || 0),
    providerPhone: provider?.phone || undefined,
    price: Number(row.price),
    message: row.message || '',
    createdAt: row.created_at,
    status: row.status,
  };
}

function toPreferredDate(date?: string, time?: string): string | null {
  if (!date) return null;
  const normalized = date.trim().toLowerCase();
  const parsed = new Date(date);

  if (normalized === 'today' || normalized === 'tomorrow') {
    const day = new Date();
    if (normalized === 'tomorrow') day.setDate(day.getDate() + 1);
    day.setHours(0, 0, 0, 0);
    return day.toISOString();
  }

  if (Number.isNaN(parsed.getTime())) return null;
  if (time) {
    const timeMatch = time.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (timeMatch) {
      let hours = Number(timeMatch[1]) % 12;
      if (timeMatch[3].toLowerCase() === 'pm') hours += 12;
      parsed.setHours(hours, Number(timeMatch[2] || 0), 0, 0);
    }
  }
  return parsed.toISOString();
}

export async function getRequests(filters: {
  category?: string;
  urgency?: string;
  customerId?: string;
  status?: string;
} = {}): Promise<ServiceRequest[]> {
  let list: ServiceRequest[];
  if (isDevDemoMode()) {
    await new Promise((r) => setTimeout(r, 150));
    list = getStoredRequests();
  } else {
    let query = supabase
      .from('service_requests')
      .select('*, profiles!service_requests_customer_id_fkey(full_name, phone, avatar_url), categories!service_requests_category_id_fkey(name), quotes(count)')
      .order('created_at', { ascending: false });

    if (filters.customerId) query = query.eq('customer_id', filters.customerId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.urgency && filters.urgency !== 'all') query = query.eq('urgency', filters.urgency);
    if (filters.category && filters.category !== 'all') query = query.eq('category_id', categoryNameToId(filters.category));

    const { data, error } = await query;
    if (error) throw error;
    list = (data || []).map(mapRequest);
  }

  if (filters.customerId) {
    list = list.filter((r) => r.customerId === filters.customerId);
  }

  if (filters.category && filters.category !== 'all') {
    list = list.filter((r) => r.category === filters.category);
  }

  if (filters.urgency && filters.urgency !== 'all') {
    list = list.filter((r) => r.urgency === filters.urgency);
  }

  if (filters.status) {
    list = list.filter((r) => r.status === filters.status);
  }

  return list;
}

export async function getRequestById(id: string): Promise<ServiceRequest | null> {
  if (isDevDemoMode()) {
    await new Promise((r) => setTimeout(r, 100));
    const list = getStoredRequests();
    return list.find((r) => r.id === id) || null;
  }

  const { data, error } = await supabase
    .from('service_requests')
    .select('*, profiles!service_requests_customer_id_fkey(full_name, phone, avatar_url), categories!service_requests_category_id_fkey(name), quotes(count)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRequest(data) : null;
}

export async function createServiceRequest(data: Omit<ServiceRequest, 'id' | 'quotesCount' | 'createdAt' | 'status'>): Promise<ServiceRequest> {
  if (!isDevDemoMode()) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Sign in before posting a service request.');
    if (data.customerId !== user.id) throw new Error('You can only post requests for your own account.');

    const { data: row, error } = await supabase
      .from('service_requests')
      .insert({
        customer_id: user.id,
        category_id: categoryNameToId(data.category),
        title: data.title,
        description: data.description,
        urgency: data.urgency,
        preferred_date: toPreferredDate(data.preferredDate, data.preferredTime),
        preferred_time: data.preferredTime || null,
        address: data.address || null,
        budget_min: data.budgetMin ?? null,
        budget_max: data.budgetMax ?? null,
        media_urls: data.photos || [],
        status: 'open',
      })
      .select('*, profiles!service_requests_customer_id_fkey(full_name, phone, avatar_url), categories!service_requests_category_id_fkey(name), quotes(count)')
      .single();
    if (error) throw error;
    return mapRequest(row);
  }

  await new Promise((r) => setTimeout(r, 300));
  const list = getStoredRequests();

  const newReq: ServiceRequest = {
    ...data,
    id: 'req_' + Date.now(),
    quotesCount: 0,
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  list.unshift(newReq);
  saveStoredRequests(list);
  return newReq;
}

export async function getQuotesForRequest(requestId: string): Promise<Quote[]> {
  if (!isDevDemoMode()) {
    const { data, error } = await supabase
      .from('quotes')
      .select('*, provider_profiles!quotes_provider_id_fkey(rating_avg, rating_count, years_experience, profiles!provider_profiles_user_id_fkey(full_name, avatar_url, phone))')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapQuote);
  }

  await new Promise((r) => setTimeout(r, 150));
  return getStoredQuotes().filter((q) => q.requestId === requestId);
}

export async function sendQuote(quoteData: Omit<Quote, 'id' | 'createdAt' | 'status'>): Promise<Quote> {
  if (!isDevDemoMode()) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Sign in before sending a quote.');
    if (quoteData.providerId !== user.id) throw new Error('You can only send quotes from your provider account.');

    const { data, error } = await supabase
      .from('quotes')
      .insert({
        request_id: quoteData.requestId,
        provider_id: user.id,
        price: quoteData.price,
        message: quoteData.message,
        status: 'pending',
      })
      .select('*, provider_profiles!quotes_provider_id_fkey(rating_avg, rating_count, years_experience, profiles!provider_profiles_user_id_fkey(full_name, avatar_url, phone))')
      .single();
    if (error) throw error;
    return mapQuote(data);
  }

  await new Promise((r) => setTimeout(r, 250));
  const quotes = getStoredQuotes();
  const requests = getStoredRequests();

  const newQuote: Quote = {
    ...quoteData,
    id: 'quo_' + Date.now(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  quotes.unshift(newQuote);
  saveStoredQuotes(quotes);

  // increment count on request
  const reqIdx = requests.findIndex((r) => r.id === quoteData.requestId);
  if (reqIdx >= 0) {
    requests[reqIdx].quotesCount = (requests[reqIdx].quotesCount || 0) + 1;
    saveStoredRequests(requests);
  }

  return newQuote;
}
