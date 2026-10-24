import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  AlertCircle,
  Clock,
  MapPin,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import { getRequestById, getQuotesForRequest } from '../../lib/api/requests';
import { acceptQuoteAndCreateBooking } from '../../lib/api/bookings';
import { getOrCreateConversation } from '../../lib/api/chat';
import { ServiceRequest, Quote } from '../../types';
import { RatingStars } from '../../components/common/RatingStars';
import { StatusBadge } from '../../components/common/StatusBadge';

export const RequestDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);
  const [quoteSort, setQuoteSort] = useState<'best' | 'rating' | 'experience' | 'price'>('best');
  const [minRating, setMinRating] = useState(0);
  const [minExperience, setMinExperience] = useState(0);
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const [req, qts] = await Promise.all([
          getRequestById(id),
          getQuotesForRequest(id),
        ]);
        setRequest(req);
        setQuotes(qts);
      } catch (err) {
        console.error('Failed to load request details', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleAcceptQuote = async (quote: Quote) => {
    if (!request) return;
    setAcceptingQuoteId(quote.id);
    try {
      const newBooking = await acceptQuoteAndCreateBooking(
        {
          id: quote.id,
          requestId: request.id,
          providerId: quote.providerId,
          providerName: quote.providerName,
          providerAvatar: quote.providerAvatar,
          price: quote.price,
        },
        {
          title: request.title,
          category: request.category,
          customerId: request.customerId,
          customerName: request.customerName,
          customerAvatar: request.customerAvatar,
          address: request.address,
        }
      );

      navigate('/bookings');
    } catch (e) {
      console.error('Failed to accept quote', e);
    } finally {
      setAcceptingQuoteId(null);
    }
  };

  const handleChatWithPro = async (quote: Quote) => {
    try {
      const conv = await getOrCreateConversation({
        id: quote.providerId,
        name: quote.providerName,
        avatar: quote.providerAvatar,
        role: 'provider',
        phone: quote.providerPhone,
      });
      navigate(`/chat/${conv.id}`);
    } catch (e) {
      navigate('/chat');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 pt-4">
        <div className="h-6 bg-sage-light rounded w-1/3 animate-pulse" />
        <div className="ll-card p-6 animate-pulse space-y-3">
          <div className="h-5 bg-sage-light rounded w-3/4" />
          <div className="h-4 bg-sage-light rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="ll-card p-8 text-center space-y-3">
        <p className="font-bold text-navy">Request not found.</p>
        <Link to="/" className="ll-btn-primary text-xs">
          Return Home
        </Link>
      </div>
    );
  }

  const isEmergency = request.urgency === 'emergency';
  const filteredQuotes = quotes
    .filter((quote) => quote.providerRating >= minRating)
    .filter((quote) => (quote.providerExperience || 0) >= minExperience)
    .filter((quote) => !maxPrice || quote.price <= Number(maxPrice))
    .sort((a, b) => {
      if (quoteSort === 'rating') return b.providerRating - a.providerRating || b.price - a.price;
      if (quoteSort === 'experience') return (b.providerExperience || 0) - (a.providerExperience || 0) || b.providerRating - a.providerRating;
      if (quoteSort === 'price') return a.price - b.price || b.providerRating - a.providerRating;
      return b.providerRating - a.providerRating
        || (b.providerExperience || 0) - (a.providerExperience || 0)
        || a.price - b.price;
    });

  return (
    <div className="space-y-5 pb-8">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl text-navy hover:bg-sage-light flex items-center gap-1 text-xs font-bold"
        >
          <ChevronLeft size={20} />
          <span>{t('common.back')}</span>
        </button>

        <StatusBadge status={request.status} />
      </div>

      {/* Request Overview Card */}
      <div className="ll-card p-5 space-y-3 shadow-soft">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sage text-navy">
            {t(`categories.${request.category}`, { defaultValue: request.category })}
          </span>

          {isEmergency ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-coral text-white animate-pulse">
              <AlertCircle size={12} />
              {t('request_details.emergency_tag')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sage-light text-navy border border-sage-border">
              <Clock size={12} className="text-teal" />
              {t('request_details.flexible_tag')}
            </span>
          )}
        </div>

        <h1 className="text-lg font-extrabold text-navy leading-snug">
          {request.title}
        </h1>

        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
          {request.description || 'No additional details provided.'}
        </p>

        {/* Photos Preview */}
        {request.photos && request.photos.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
            {request.photos.map((photo, i) => (
              <img
                key={i}
                src={photo}
                alt="Job attachment"
                className="w-20 h-20 rounded-xl object-cover border border-sage-border flex-shrink-0"
              />
            ))}
          </div>
        )}

        {/* Meta details */}
        <div className="pt-3 border-t border-sage-border/60 space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-teal flex-shrink-0" />
            <span>Preferred: <strong>{request.preferredDate || 'Flexible'} ({request.preferredTime || 'Anytime'})</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-coral flex-shrink-0" />
            <span>{request.address || 'Address provided to booked provider'}</span>
          </div>

          {(request.budgetMin || request.budgetMax) && (
            <div className="flex items-center gap-2 text-navy font-bold">
              <span>Budget Estimate: ₹{request.budgetMin || 0} - ₹{request.budgetMax || 'Any'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quotes List Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-navy uppercase tracking-wider">
            {t('request_details.quotes_received', { count: quotes.length })}
          </h2>
          <span className="text-xs text-gray-500 font-medium">Instant Booking</span>
        </div>

        {quotes.length > 0 && (
          <div className="ll-card p-3 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-navy">
              <SlidersHorizontal size={15} className="text-teal" />
              <span>Compare offers</span>
              <span className="ml-auto font-medium text-gray-500">{filteredQuotes.length} of {quotes.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className="text-[11px] font-semibold text-gray-600">
                Sort by
                <select value={quoteSort} onChange={(event) => setQuoteSort(event.target.value as typeof quoteSort)} className="mt-1 w-full rounded-lg border border-sage-border bg-white p-2 text-xs text-navy">
                  <option value="best">Best match</option>
                  <option value="rating">Rating</option>
                  <option value="experience">Experience</option>
                  <option value="price">Lowest price</option>
                </select>
              </label>
              <label className="text-[11px] font-semibold text-gray-600">
                Min. rating
                <select value={minRating} onChange={(event) => setMinRating(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-sage-border bg-white p-2 text-xs text-navy">
                  <option value={0}>Any rating</option>
                  <option value={3}>3+ stars</option>
                  <option value={4}>4+ stars</option>
                  <option value={4.5}>4.5+ stars</option>
                </select>
              </label>
              <label className="text-[11px] font-semibold text-gray-600">
                Min. experience
                <select value={minExperience} onChange={(event) => setMinExperience(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-sage-border bg-white p-2 text-xs text-navy">
                  <option value={0}>Any experience</option>
                  <option value={1}>1+ years</option>
                  <option value={3}>3+ years</option>
                  <option value={5}>5+ years</option>
                  <option value={10}>10+ years</option>
                </select>
              </label>
              <label className="text-[11px] font-semibold text-gray-600">
                Max. quote (₹)
                <input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="No limit" className="mt-1 w-full rounded-lg border border-sage-border bg-white p-2 text-xs text-navy" />
              </label>
            </div>
          </div>
        )}

        {quotes.length === 0 ? (
          <div className="ll-card p-6 text-center space-y-2 bg-salmon-light/30 border-salmon">
            <div className="w-10 h-10 rounded-full bg-salmon-light text-navy flex items-center justify-center mx-auto">
              <Clock size={20} />
            </div>
            <h3 className="font-bold text-navy text-sm">Nearby pros are reviewing your request</h3>
            <p className="text-xs text-gray-600 max-w-xs mx-auto">
              {t('request_details.no_quotes_yet')}
            </p>
          </div>
        ) : (
          filteredQuotes.length === 0 ? (
            <div className="ll-card p-5 text-center text-xs text-gray-600">
              No quotes match these filters. Try lowering the rating or experience threshold.
            </div>
          ) : (
          <div className="space-y-3">
            {filteredQuotes.map((quote) => {
              const isAccepting = acceptingQuoteId === quote.id;
              return (
                <div
                  key={quote.id}
                  className="ll-card p-4 space-y-3 border-teal/40 hover:border-teal transition-all shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={quote.providerAvatar}
                        alt={quote.providerName}
                        className="w-12 h-12 rounded-2xl object-cover border border-sage-border"
                      />
                      <div>
                        <Link
                          to={`/provider/${quote.providerId}`}
                          className="font-bold text-navy text-sm hover:text-teal flex items-center gap-1"
                        >
                          <span>{quote.providerName}</span>
                          <ShieldCheck size={14} className="text-teal" />
                        </Link>
                        {quote.providerRating > 0 ? (
                          <RatingStars rating={quote.providerRating} totalReviews={quote.providerReviewCount} size="sm" />
                        ) : (
                          <span className="text-[11px] text-gray-500">No ratings yet</span>
                        )}
                        <div className="mt-1 text-[11px] text-gray-500">
                          {quote.providerExperience ? `${quote.providerExperience} years experience` : 'Experience not listed'}
                          {quote.providerReviewCount ? ` · ${quote.providerReviewCount} reviews` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Quoted Price */}
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Offer</span>
                      <span className="text-lg font-black text-navy">
                        ₹{quote.price}
                      </span>
                    </div>
                  </div>

                  {/* Provider Message Note */}
                  <div className="p-3 rounded-xl bg-sage-light text-xs text-navy leading-relaxed border border-sage-border/60">
                    "{quote.message}"
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleChatWithPro(quote)}
                      className="p-2.5 rounded-xl border border-sage-border bg-white text-navy hover:bg-teal-light hover:text-teal hover:border-teal transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <MessageSquare size={16} />
                      <span>{t('request_details.chat_provider')}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isAccepting}
                      onClick={() => handleAcceptQuote(quote)}
                      className="flex-1 ll-btn-primary min-h-[42px] text-xs font-bold shadow-sm"
                    >
                      {isAccepting ? t('common.loading') : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>{t('request_details.accept_quote')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )
        )}
      </div>
    </div>
  );
};
