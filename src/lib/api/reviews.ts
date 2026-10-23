import { Review } from '../../types';
import { MOCK_REVIEWS } from '../mockData';
import { getBookingById } from './bookings';
import { isDevDemoMode, supabase } from './supabaseClient';

const REVIEWS_STORAGE_KEY = 'locallink_reviews_cache';

function getStoredReviews(): Review[] {
  const cached = localStorage.getItem(REVIEWS_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return [...MOCK_REVIEWS];
}

function saveStoredReviews(list: Review[]) {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(list));
}

function mapReview(row: any): Review {
  const customer = Array.isArray(row.customer) ? row.customer[0] : row.customer;
  return {
    id: row.id,
    bookingId: row.booking_id,
    providerId: row.provider_id,
    customerId: row.customer_id,
    customerName: customer?.full_name || 'Neighbor',
    customerAvatar: customer?.avatar_url || undefined,
    rating: row.rating,
    comment: row.comment || '',
    createdAt: row.created_at,
  };
}

export async function getReviewsForProvider(providerId: string): Promise<Review[]> {
  if (!isDevDemoMode()) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, customer:profiles!reviews_customer_id_fkey(full_name, avatar_url)')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapReview);
  }

  await new Promise((r) => setTimeout(r, 120));
  return getStoredReviews().filter((rev) => rev.providerId === providerId);
}

export async function createReview(data: {
  bookingId: string;
  providerId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
}): Promise<Review> {
  if (!isDevDemoMode()) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user || user.id !== data.customerId) throw new Error('Sign in to submit a review for your own account.');
  }

  // Validation: verify booking is completed and belongs to customer
  const booking = await getBookingById(data.bookingId);
  if (!booking) {
    throw new Error('Booking does not exist');
  }
  if (booking.customerId !== data.customerId || booking.providerId !== data.providerId) {
    throw new Error('The booking does not belong to this customer and provider.');
  }
  if (booking.status !== 'completed') {
    throw new Error('Reviews can only be submitted for completed bookings.');
  }

  if (!isDevDemoMode()) {
    const { data: row, error } = await supabase
      .from('reviews')
      .insert({
        booking_id: data.bookingId,
        provider_id: data.providerId,
        customer_id: data.customerId,
        rating: data.rating,
        comment: data.comment,
      })
      .select('*, customer:profiles!reviews_customer_id_fkey(full_name, avatar_url)')
      .single();
    if (error) throw error;
    return mapReview(row);
  }

  await new Promise((r) => setTimeout(r, 200));
  const list = getStoredReviews();

  const newReview: Review = {
    ...data,
    id: 'rev_' + Date.now(),
    createdAt: new Date().toISOString(),
  };

  list.unshift(newReview);
  saveStoredReviews(list);
  return newReview;
}
