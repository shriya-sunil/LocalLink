import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarCheck,
  Clock,
  MapPin,
  MessageSquare,
  Phone,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Banknote,
  Star,
  X,
  Play,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getBookingById,
  getBookings,
  updateBookingStatus,
  markBookingCompleteByProvider,
  confirmCustomerCompletion,
  processPayment,
  cancelBooking,
} from '../../lib/api/bookings';
import { createReview } from '../../lib/api/reviews';
import { getOrCreateConversation } from '../../lib/api/chat';
import { Booking, BookingStatus, PaymentMethod } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RatingStars } from '../../components/common/RatingStars';
import { isDevDemoMode } from '../../lib/api/supabaseClient';

export const BookingsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, role, isPro } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('active');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Dialogs state
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Screen 9: Customer Job Completion & Payment Modal
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
  const [paymentStep, setPaymentStep] = useState<'confirm_work' | 'choose_method' | 'success'>('confirm_work');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => isDevDemoMode() ? 'online' : 'cash');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Screen 10: Customer Review Modal
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await getBookings(user?.id || 'usr_priya_01', role);
      setBookings(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, role]);

  // Tab filtering
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ['requested', 'accepted', 'in_progress'].includes(b.status);
    if (activeTab === 'completed') return b.status === 'completed';
    if (activeTab === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  // Action: Pro marks job in progress
  const handleStartJob = async (booking: Booking) => {
    try {
      await updateBookingStatus(booking.id, 'in_progress');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Pro marks complete
  const handleMarkCompleteByPro = async (booking: Booking) => {
    try {
      await markBookingCompleteByProvider(booking.id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Customer triggers completion flow
  const handleOpenCompletionFlow = (booking: Booking) => {
    setPaymentBooking(booking);
    setPaymentStep('confirm_work');
    setPaymentError(null);
  };

  const handleCustomerConfirmWork = async () => {
    if (!paymentBooking) return;
    try {
      const updatedBooking = await confirmCustomerCompletion(paymentBooking.id);
      setPaymentBooking({ ...paymentBooking, ...updatedBooking, customerConfirmedCompletion: true });
      setPaymentStep('choose_method');
      setPaymentError(null);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Could not confirm the completed work.');
    }
  };

  const handleProcessPayment = async () => {
    if (!paymentBooking) return;
    setIsProcessingPayment(true);
    setPaymentError(null);
    try {
      const latestBooking = await getBookingById(paymentBooking.id);
      const bookingId = latestBooking?.id || paymentBooking.id;
      if (latestBooking) {
        setPaymentBooking((prev) => prev ? { ...prev, ...latestBooking } : latestBooking);
      }

      await processPayment(bookingId, paymentMethod);
      setPaymentStep('success');
      loadData();
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Payment could not be recorded.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Action: Submit Review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;
    setIsSubmittingReview(true);
    try {
      await createReview({
        bookingId: reviewBooking.id,
        providerId: reviewBooking.providerId,
        customerId: user?.id || 'usr_priya_01',
        customerName: user?.name || 'Priya Sharma',
        customerAvatar: user?.avatar,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setReviewSuccess(true);
      setTimeout(() => {
        setReviewBooking(null);
        setReviewSuccess(false);
        setReviewComment('');
        loadData();
      }, 1500);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Action: Cancel Booking
  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    try {
      await cancelBooking(cancelModalBooking.id, cancelReason);
      setCancelModalBooking(null);
      setCancelReason('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleChat = async (booking: Booking) => {
    const isTargetPro = role === 'customer';
    try {
      const conv = await getOrCreateConversation({
        id: isTargetPro ? booking.providerId : booking.customerId,
        name: isTargetPro ? booking.providerName : booking.customerName,
        avatar: isTargetPro ? booking.providerAvatar : (booking.customerAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80'),
        role: isTargetPro ? 'provider' : 'customer',
        phone: isTargetPro ? booking.providerPhone : booking.customerPhone,
      });
      navigate(`/chat/${conv.id}`);
    } catch (e) {
      navigate('/chat');
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-navy leading-tight">
          {t('bookings.title')}
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {isPro ? 'Track your ongoing and past neighborhood client jobs' : 'Manage your upcoming services and completed appointments'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-sage-light p-1 border border-sage-border overflow-x-auto">
        {(['active', 'completed', 'cancelled', 'all'] as const).map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => setActiveTab(tabKey)}
            className={`flex-1 min-w-[70px] py-1.5 px-2 text-xs font-bold rounded-lg transition-all capitalize ${
              activeTab === tabKey ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'
            }`}
          >
            {t(`bookings.tab_${tabKey}`)}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-3 pt-2">
          {[1, 2].map((i) => (
            <div key={i} className="ll-card p-4 animate-pulse space-y-3">
              <div className="h-4 bg-sage-light rounded w-1/3" />
              <div className="h-5 bg-sage-light rounded w-3/4" />
              <div className="h-3 bg-sage-light rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="ll-card p-8 text-center space-y-2 bg-salmon-light/30 border-salmon">
          <CalendarCheck size={28} className="text-navy mx-auto opacity-60" />
          <h3 className="font-bold text-navy text-sm">{t('bookings.empty')}</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            {role === 'customer'
              ? 'Post a request or search verified providers to make your first booking.'
              : 'Keep an eye on open neighborhood requests to receive jobs.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredBookings.map((booking) => {
            const isCompleted = booking.status === 'completed';
            const isCancelled = booking.status === 'cancelled';
            const canCancel = ['requested', 'accepted'].includes(booking.status);

            const displayPerson = isPro ? {
              name: booking.customerName,
              avatar: booking.customerAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
              phone: booking.customerPhone || '+91 98765 43210',
              roleLabel: 'Customer',
            } : {
              name: booking.providerName,
              avatar: booking.providerAvatar,
              phone: booking.providerPhone || '+91 98450 12345',
              roleLabel: 'Verified Pro',
            };

            return (
              <div key={booking.id} className="ll-card p-4 space-y-3 shadow-soft hover:border-teal/50 transition-all">
                {/* Top Row: Category & Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-sage text-navy">
                      {t(`categories.${booking.category}`, { defaultValue: booking.category })}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      #{booking.id.replace('bk_', '')}
                    </span>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                {/* Service Title & Price */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-navy leading-snug">
                      {booking.serviceTitle}
                    </h2>
                    {booking.customerAddress && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                        <MapPin size={12} className="text-coral flex-shrink-0" />
                        <span className="truncate">{booking.customerAddress}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold block">Agreed</span>
                    <span className="text-base font-extrabold text-navy">₹{booking.price}</span>
                  </div>
                </div>

                {/* Partner Profile Strip */}
                <div className="p-2.5 rounded-xl bg-sage-light flex items-center justify-between gap-2 border border-sage-border/60">
                  <div className="flex items-center gap-2.5 truncate">
                    <img
                      src={displayPerson.avatar}
                      alt={displayPerson.name}
                      className="w-9 h-9 rounded-full object-cover border border-sage-border"
                    />
                    <div className="truncate">
                      <span className="text-xs font-bold text-navy block truncate">
                        {displayPerson.name}
                      </span>
                      <span className="text-[10px] text-teal-dark font-medium">
                        {displayPerson.roleLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={`tel:${displayPerson.phone}`}
                      className="p-2 rounded-lg bg-white text-navy hover:text-teal hover:border-teal border border-sage-border shadow-xs"
                      title={t('common.call')}
                    >
                      <Phone size={15} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleChat(booking)}
                      className="p-2 rounded-lg bg-white text-navy hover:text-teal hover:border-teal border border-sage-border shadow-xs"
                      title={t('nav.chat')}
                    >
                      <MessageSquare size={15} />
                    </button>
                  </div>
                </div>

                {/* Status-specific action buttons */}
                <div className="pt-2 border-t border-sage-border/60 flex items-center flex-wrap gap-2 justify-between">
                  {/* Cancel Button */}
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => setCancelModalBooking(booking)}
                      className="text-xs font-semibold text-coral hover:underline py-1.5"
                    >
                      {t('bookings.cancel_booking')}
                    </button>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    {/* PRO ACTIONS */}
                    {isPro && booking.status === 'accepted' && (
                      <button
                        type="button"
                        onClick={() => handleStartJob(booking)}
                        className="ll-btn-primary text-xs py-1.5 px-3 min-h-[38px] rounded-xl"
                      >
                        <Play size={14} />
                        <span>{t('bookings.mark_in_progress')}</span>
                      </button>
                    )}

                    {isPro && booking.status === 'in_progress' && !booking.providerMarkedComplete && (
                      <button
                        type="button"
                        onClick={() => handleMarkCompleteByPro(booking)}
                        className="ll-btn-primary text-xs py-1.5 px-3 min-h-[38px] rounded-xl bg-teal"
                      >
                        <CheckCircle2 size={14} />
                        <span>{t('bookings.mark_complete')}</span>
                      </button>
                    )}

                    {isPro && booking.status === 'in_progress' && booking.providerMarkedComplete && (
                      <span className="text-xs font-semibold text-teal-dark">Awaiting customer confirmation</span>
                    )}

                    {/* CUSTOMER ACTIONS (Screen 9 & 10) */}
                    {!isPro && booking.status === 'in_progress' && booking.providerMarkedComplete && (
                      <button
                        type="button"
                        onClick={() => handleOpenCompletionFlow(booking)}
                        className="ll-btn-primary text-xs py-1.5 px-3 min-h-[38px] rounded-xl bg-teal shadow-sm"
                      >
                        <CheckCircle2 size={14} />
                        <span>{t('bookings.confirm_completion')}</span>
                      </button>
                    )}

                    {/* Customer Review Button after Completion */}
                    {!isPro && isCompleted && !booking.hasReview && (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewBooking(booking);
                          setReviewRating(5);
                          setReviewComment('');
                        }}
                        className="ll-btn-secondary text-xs py-1.5 px-3 min-h-[38px] rounded-xl flex items-center gap-1.5"
                      >
                        <Star size={14} className="text-coral fill-coral" />
                        <span>{t('bookings.leave_review')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Screen 9: Job Completion & Payment Modal */}
      {paymentBooking && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-sage-border overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-sage-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy">
                {paymentStep === 'confirm_work'
                  ? t('bookings.confirm_completion')
                  : paymentStep === 'choose_method'
                  ? t('payment.title')
                  : t('payment.payment_success')}
              </h3>
              <button
                type="button"
                onClick={() => setPaymentBooking(null)}
                className="p-1 rounded-full text-gray-400 hover:text-navy"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Step 1: Customer inspects & confirms satisfactory work */}
              {paymentStep === 'confirm_work' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-teal-light text-center space-y-2 border border-teal/30">
                    <CheckCircle2 size={36} className="text-teal mx-auto" />
                    <h4 className="font-extrabold text-navy text-base">
                      {t('bookings.customer_confirm_title')}
                    </h4>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {t('bookings.customer_confirm_desc')}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-sage-light text-xs text-navy border border-sage-border space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service:</span>
                      <span className="font-bold">{paymentBooking.serviceTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Professional:</span>
                      <span className="font-bold">{paymentBooking.providerName}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t border-sage-border">
                      <span className="font-bold text-navy">{t('payment.amount_due')}:</span>
                      <span className="font-extrabold text-teal">₹{paymentBooking.price}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCustomerConfirmWork}
                    className="ll-btn-primary w-full min-h-[48px]"
                  >
                    {t('bookings.confirm_and_pay')}
                  </button>
                </div>
              )}

              {/* Step 2: Choose Payment Method (Pay Online vs Cash) */}
              {paymentStep === 'choose_method' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-xs text-gray-500 block uppercase font-medium">
                      {t('payment.amount_due')}
                    </span>
                    <span className="text-3xl font-black text-navy">
                      ₹{paymentBooking.price}
                    </span>
                  </div>

                  {/* Payment Options */}
                  <div className="space-y-2.5">
                    {isDevDemoMode() && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        paymentMethod === 'online'
                          ? 'border-teal bg-teal-light ring-2 ring-teal/40'
                          : 'border-sage-border bg-white hover:bg-sage-light'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-teal text-white">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-navy">
                          {t('payment.pay_online')}
                        </div>
                        <div className="text-[11px] text-gray-600 mt-0.5">
                          {t('payment.pay_online_desc')}
                        </div>
                      </div>
                    </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        paymentMethod === 'cash'
                          ? 'border-teal bg-teal-light ring-2 ring-teal/40'
                          : 'border-sage-border bg-white hover:bg-sage-light'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-navy text-white">
                        <Banknote size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-navy">
                          {t('payment.pay_cash')}
                        </div>
                        <div className="text-[11px] text-gray-600 mt-0.5">
                          {t('payment.pay_cash_desc')}
                        </div>
                      </div>
                    </button>
                  </div>

                  {paymentError && (
                    <p role="alert" className="text-xs font-medium text-coral">{paymentError}</p>
                  )}

                  {/* No Refund Policy Notice */}
                  <div className="p-3 rounded-xl bg-salmon-light/60 border border-salmon text-[11px] text-navy">
                    {t('payment.no_refund_policy')}
                  </div>

                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={handleProcessPayment}
                    className="ll-btn-primary w-full min-h-[48px]"
                  >
                    {isProcessingPayment
                      ? t('common.loading')
                      : t('payment.confirm_payment', { amount: paymentBooking.price })}
                  </button>
                </div>
              )}

              {/* Step 3: Success Confirmation */}
              {paymentStep === 'success' && (
                <div className="p-4 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 size={36} />
                  </div>
                  <h4 className="font-extrabold text-navy text-lg">
                    {t('payment.payment_success')}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                    {t('payment.payment_success_desc')}
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const current = paymentBooking;
                        setPaymentBooking(null);
                        setReviewBooking(current);
                      }}
                      className="ll-btn-primary w-full min-h-[46px]"
                    >
                      <Star size={16} className="text-coral fill-coral" />
                      <span>{t('bookings.leave_review')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screen 10: Review Modal (Only customer of completed booking) */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-sage-border overflow-hidden">
            <div className="px-5 py-4 border-b border-sage-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy">{t('bookings.leave_review')}</h3>
              <button
                type="button"
                onClick={() => setReviewBooking(null)}
                className="p-1 rounded-full text-gray-400 hover:text-navy"
              >
                <X size={20} />
              </button>
            </div>

            {reviewSuccess ? (
              <div className="p-8 text-center space-y-3 bg-teal-light">
                <CheckCircle2 size={40} className="text-teal mx-auto animate-bounce" />
                <h4 className="font-extrabold text-navy text-base">
                  {t('bookings.review_submitted')}
                </h4>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="p-5 space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-xs text-gray-600">
                    {t('bookings.rating_prompt', { name: reviewBooking.providerName })}
                  </p>
                  <div className="flex justify-center pt-1">
                    <RatingStars
                      rating={reviewRating}
                      interactive={true}
                      onChange={setReviewRating}
                      size="lg"
                      showNumber={false}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1.5">
                    Your Feedback
                  </label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={t('bookings.comment_placeholder')}
                    className="ll-input resize-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewBooking(null)}
                    className="flex-1 ll-btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview || !reviewComment.trim()}
                    className="flex-1 ll-btn-primary"
                  >
                    {isSubmittingReview ? t('common.loading') : t('common.submit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Cancel Booking Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 border border-sage-border">
            <div className="w-12 h-12 rounded-full bg-coral-light text-coral flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-navy text-base">{t('bookings.confirm_cancel')}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Booking #{cancelModalBooking.id.replace('bk_', '')} with {cancelModalBooking.providerName}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">Reason (Optional)</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule changed, emergency resolved"
                className="ll-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="ll-btn-secondary"
              >
                {t('bookings.keep_booking')}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="ll-btn-coral"
              >
                {t('bookings.yes_cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
