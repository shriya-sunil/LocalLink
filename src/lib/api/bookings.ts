import { Booking, BookingStatus, PaymentMethod } from '../../types';
import { MOCK_BOOKINGS } from '../mockData';

const BOOKINGS_STORAGE_KEY = 'locallink_bookings_cache';

function getStoredBookings(): Booking[] {
  const cached = localStorage.getItem(BOOKINGS_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return [...MOCK_BOOKINGS];
}

function saveStoredBookings(list: Booking[]) {
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(list));
}

export async function getBookings(userId: string, role: 'customer' | 'provider'): Promise<Booking[]> {
  // TODO: Connect supabase.from('bookings').select('*')
  await new Promise((r) => setTimeout(r, 150));
  const list = getStoredBookings();
  if (role === 'customer') {
    return list.filter((b) => b.customerId === userId || b.customerId === 'usr_priya_01');
  } else {
    return list.filter((b) => b.providerId === userId || b.providerId === 'pro_ramesh_01');
  }
}

export async function getBookingById(id: string): Promise<Booking | null> {
  // TODO: Connect supabase.from('bookings').select('*').eq('id', id).single()
  await new Promise((r) => setTimeout(r, 100));
  const list = getStoredBookings();
  return list.find((b) => b.id === id) || null;
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  // TODO: Connect supabase.from('bookings').update({ status }).eq('id', id)
  await new Promise((r) => setTimeout(r, 200));
  const list = getStoredBookings();
  const idx = list.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error('Booking not found');

  list[idx].status = status;
  if (status === 'completed') {
    list[idx].completedAt = new Date().toISOString();
  }
  saveStoredBookings(list);
  return list[idx];
}

export async function confirmCustomerCompletion(id: string): Promise<Booking> {
  // Customer confirms job done before payment screen opens
  await new Promise((r) => setTimeout(r, 150));
  const list = getStoredBookings();
  const idx = list.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error('Booking not found');

  list[idx].customerConfirmedCompletion = true;
  saveStoredBookings(list);
  return list[idx];
}

/**
 * Placeholder for Payment Gateway (Razorpay, UPI Intent, Cash Settlement)
 * Requirement: "Job completion flow: provider taps 'Mark complete', customer gets a confirmation prompt,
 * then a payment screen with two options, Pay online or Cash. Payment happens only after the customer confirms. No refund features."
 */
export async function processPayment(
  bookingId: string,
  method: PaymentMethod
): Promise<{ success: boolean; transactionId: string; message: string }> {
  // TODO: Connect Razorpay / Stripe / PhonePe payment gateway webhook
  await new Promise((r) => setTimeout(r, 600));
  const list = getStoredBookings();
  const idx = list.findIndex((b) => b.id === bookingId);
  if (idx >= 0) {
    list[idx].paymentStatus = 'completed';
    list[idx].paymentMethod = method;
    list[idx].status = 'completed';
    list[idx].completedAt = new Date().toISOString();
    saveStoredBookings(list);
  }

  return {
    success: true,
    transactionId: method === 'online' ? 'TXN_UPI_' + Date.now() : 'CASH_CONFIRMED_' + Date.now(),
    message: method === 'online' ? 'Online payment processed successfully.' : 'Cash settlement recorded.',
  };
}

export async function cancelBooking(id: string, reason?: string): Promise<Booking> {
  // TODO: Connect supabase.from('bookings').update({ status: 'cancelled', cancel_reason: reason })
  await new Promise((r) => setTimeout(r, 150));
  console.log('Cancelled booking', id, 'reason:', reason);
  return updateBookingStatus(id, 'cancelled');
}

export async function acceptQuoteAndCreateBooking(
  quote: {
    id: string;
    requestId: string;
    providerId: string;
    providerName: string;
    providerAvatar: string;
    price: number;
  },
  request: {
    title: string;
    category: string;
    customerId: string;
    customerName: string;
    customerAvatar?: string;
    address?: string;
  }
): Promise<Booking> {
  // TODO: Connect supabase transaction
  const list = getStoredBookings();
  const newBooking: Booking = {
    id: 'bk_' + Date.now(),
    requestId: quote.requestId,
    customerId: request.customerId,
    customerName: request.customerName,
    customerAvatar: request.customerAvatar,
    customerAddress: request.address,
    providerId: quote.providerId,
    providerName: quote.providerName,
    providerAvatar: quote.providerAvatar,
    serviceTitle: request.title,
    category: request.category,
    price: quote.price,
    status: 'accepted',
    paymentStatus: 'pending',
    customerConfirmedCompletion: false,
    createdAt: new Date().toISOString(),
  };

  list.unshift(newBooking);
  saveStoredBookings(list);
  return newBooking;
}
