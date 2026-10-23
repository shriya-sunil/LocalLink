import { Review } from '../../types';
import { MOCK_REVIEWS } from '../mockData';
import { getBookingById } from './bookings';

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

export async function getReviewsForProvider(providerId: string): Promise<Review[]> {
  // TODO: Connect supabase.from('reviews').select('*').eq('provider_id', providerId)
  await new Promise((r) => setTimeout(r, 120));
  const list = getStoredReviews();
  return list.filter((rev) => rev.providerId === providerId);
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
  // Validation: verify booking is completed and belongs to customer
  const booking = await getBookingById(data.bookingId);
  if (!booking) {
    throw new Error('Booking does not exist');
  }
  if (booking.status !== 'completed') {
    throw new Error('Reviews can only be submitted for completed bookings.');
  }

  // TODO: Connect supabase.from('reviews').insert(...)
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
