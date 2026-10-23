import { ServiceRequest, Quote } from '../../types';
import { MOCK_REQUESTS, MOCK_QUOTES } from '../mockData';

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

export async function getRequests(filters: {
  category?: string;
  urgency?: string;
  customerId?: string;
  status?: string;
} = {}): Promise<ServiceRequest[]> {
  // TODO: Connect supabase.from('service_requests').select('*')...
  await new Promise((r) => setTimeout(r, 150));
  let list = getStoredRequests();

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
  // TODO: Connect supabase.from('service_requests').select('*').eq('id', id).single()
  await new Promise((r) => setTimeout(r, 100));
  const list = getStoredRequests();
  return list.find((r) => r.id === id) || null;
}

export async function createServiceRequest(data: Omit<ServiceRequest, 'id' | 'quotesCount' | 'createdAt' | 'status'>): Promise<ServiceRequest> {
  // TODO: Connect supabase.from('service_requests').insert(...)
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
  // TODO: Connect supabase.from('quotes').select('*').eq('request_id', requestId)
  await new Promise((r) => setTimeout(r, 150));
  const quotes = getStoredQuotes();
  return quotes.filter((q) => q.requestId === requestId);
}

export async function sendQuote(quoteData: Omit<Quote, 'id' | 'createdAt' | 'status'>): Promise<Quote> {
  // TODO: Connect supabase.from('quotes').insert(...)
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
