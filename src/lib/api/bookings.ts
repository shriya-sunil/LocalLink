import { Booking, BookingStatus, PaymentMethod } from '../../types';
import { MOCK_BOOKINGS } from '../mockData';
import { categoryIdToName } from './categories';
import { isDevDemoMode, supabase } from './supabaseClient';

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

function mapBooking(row: any): Booking {
  const customer = Array.isArray(row.customer) ? row.customer[0] : row.customer;
  const providerProfile = Array.isArray(row.provider) ? row.provider[0] : row.provider;
  const provider = Array.isArray(providerProfile?.profiles) ? providerProfile.profiles[0] : providerProfile?.profiles;
  const request = Array.isArray(row.request) ? row.request[0] : row.request;
  const requestCategory = Array.isArray(request?.categories) ? request.categories[0] : request?.categories;
  const payment = Array.isArray(row.payments) ? row.payments[0] : row.payments;
  const reviews = Array.isArray(row.reviews) ? row.reviews : [];

  return {
    id: row.id,
    requestId: row.request_id || undefined,
    customerId: row.customer_id,
    customerName: customer?.full_name || 'Neighbor',
    customerAvatar: customer?.avatar_url || undefined,
    customerPhone: customer?.phone || undefined,
    customerAddress: request?.address || undefined,
    providerId: row.provider_id,
    providerName: provider?.full_name || 'Local Professional',
    providerAvatar: provider?.avatar_url || '',
    providerPhone: provider?.phone || undefined,
    serviceTitle: row.title || request?.title || 'Local service',
    category: requestCategory?.name?.toLowerCase() || categoryIdToName(request?.category_id),
    price: Number(row.price || 0),
    status: row.status,
    paymentStatus: payment?.status === 'completed' ? 'completed' : 'pending',
    paymentMethod: payment?.method || undefined,
    customerConfirmedCompletion: Boolean(row.customer_confirmed),
    createdAt: row.created_at,
    completedAt: row.status === 'completed' ? payment?.paid_at || undefined : undefined,
    hasReview: reviews.length > 0,
  };
}

const BOOKING_SELECT = '*, customer:profiles!bookings_customer_id_fkey(full_name, phone, avatar_url), provider:provider_profiles!bookings_provider_id_fkey(profiles!provider_profiles_user_id_fkey(full_name, phone, avatar_url)), request:service_requests!bookings_request_id_fkey(title, address, category_id, categories!service_requests_category_id_fkey(name)), payments(status, method, paid_at), reviews(id)';

export async function getBookings(userId: string, role: 'customer' | 'provider'): Promise<Booking[]> {
  if (isDevDemoMode()) {
    await new Promise((r) => setTimeout(r, 150));
    const list = getStoredBookings();
    if (role === 'customer') {
      return list.filter((b) => b.customerId === userId || b.customerId === 'usr_priya_01');
    }
    return list.filter((b) => b.providerId === userId || b.providerId === 'pro_ramesh_01');
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user || user.id !== userId) return [];

  const ownerColumn = role === 'customer' ? 'customer_id' : 'provider_id';
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq(ownerColumn, user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapBooking);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  if (isDevDemoMode()) {
    await new Promise((r) => setTimeout(r, 100));
    return getStoredBookings().find((b) => b.id === id) || null;
  }

  const { data, error } = await supabase.from('bookings').select(BOOKING_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapBooking(data) : null;
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  if (!isDevDemoMode()) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Booking not found or access denied.');
    const booking = await getBookingById(id);
    if (!booking) throw new Error('Booking could not be loaded after update.');
    return booking;
  }

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
  if (!isDevDemoMode()) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ customer_confirmed: true })
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Booking not found or access denied.');
    const booking = await getBookingById(id);
    if (!booking) throw new Error('Booking could not be loaded after confirmation.');
    return booking;
  }

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
  if (!isDevDemoMode()) {
    if (method === 'online') {
      throw new Error('Online payments are not configured yet. Choose cash settlement or connect a payment gateway.');
    }

    const booking = await getBookingById(bookingId);
    if (!booking) throw new Error('Booking not found or access denied.');
    if (!booking.customerConfirmedCompletion) {
      throw new Error('Confirm the completed work before recording payment.');
    }

    const { data: existingPayment, error: paymentLookupError } = await supabase
      .from('payments')
      .select('id, status')
      .eq('booking_id', bookingId)
      .maybeSingle();
    if (paymentLookupError) throw paymentLookupError;

    if (!existingPayment) {
      const { error: paymentError } = await supabase.from('payments').insert({
        booking_id: bookingId,
        amount: booking.price,
        method: 'cash',
        status: 'completed',
        paid_at: new Date().toISOString(),
      });
      if (paymentError) throw paymentError;
    }

    await updateBookingStatus(bookingId, 'completed');
    return {
      success: true,
      transactionId: 'CASH_CONFIRMED_' + bookingId,
      message: 'Cash settlement recorded.',
    };
  }

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
  if (!isDevDemoMode()) {
    void reason;
    return updateBookingStatus(id, 'cancelled');
  }

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
  if (!isDevDemoMode()) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user || user.id !== request.customerId) throw new Error('Only the request owner can accept a quote.');

    const { data: existing, error: existingError } = await supabase
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('quote_id', quote.id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) return mapBooking(existing);

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        request_id: quote.requestId,
        quote_id: quote.id,
        customer_id: user.id,
        provider_id: quote.providerId,
        title: request.title,
        price: quote.price,
        status: 'accepted',
      })
      .select(BOOKING_SELECT)
      .single();
    if (error) throw error;

    const { error: quoteError } = await supabase.from('quotes').update({ status: 'accepted' }).eq('id', quote.id);
    if (quoteError) throw quoteError;
    const { error: requestError } = await supabase.from('service_requests').update({ status: 'booked' }).eq('id', quote.requestId);
    if (requestError) throw requestError;
    return mapBooking(data);
  }

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
