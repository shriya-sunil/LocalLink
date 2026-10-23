import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  MapPin,
  Briefcase,
  Clock,
  Phone,
  MessageSquare,
  ChevronLeft,
  Share2,
  ShieldCheck,
  Star,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';
import { getProviderById } from '../../lib/api/providers';
import { getReviewsForProvider } from '../../lib/api/reviews';
import { getOrCreateConversation } from '../../lib/api/chat';
import { ProviderProfile, Review } from '../../types';
import { RatingStars } from '../../components/common/RatingStars';

export const ProviderProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const [pro, revs] = await Promise.all([
          getProviderById(id),
          getReviewsForProvider(id),
        ]);
        setProvider(pro);
        setReviews(revs);
      } catch (e) {
        console.error('Failed to load provider profile', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleStartChat = async () => {
    if (!provider) return;
    try {
      const conv = await getOrCreateConversation({
        id: provider.id,
        name: provider.name,
        avatar: provider.avatar,
        role: 'provider',
        phone: provider.phone,
      });
      navigate(`/chat/${conv.id}`);
    } catch (e) {
      navigate('/chat');
    }
  };

  const handleRequestQuote = () => {
    if (!provider) return;
    const cat = provider.skills?.[0] || 'electrician';
    navigate(`/post-request?cat=${cat}&proId=${provider.id}`);
  };

  if (loading) {
    return (
      <div className="space-y-4 pt-4">
        <div className="h-8 bg-sage-light rounded w-1/3 animate-pulse" />
        <div className="ll-card p-6 animate-pulse space-y-4">
          <div className="w-24 h-24 rounded-3xl bg-sage-light mx-auto" />
          <div className="h-5 bg-sage-light rounded w-1/2 mx-auto" />
          <div className="h-4 bg-sage-light rounded w-3/4 mx-auto" />
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="ll-card p-8 text-center space-y-3">
        <p className="font-bold text-navy">Provider not found.</p>
        <Link to="/providers" className="ll-btn-primary text-xs">
          Browse All Pros
        </Link>
      </div>
    );
  }

  const isAvailable = provider.availabilityStatus === 'available';

  return (
    <div className="space-y-5 pb-6">
      {/* Top back navigation bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl text-navy hover:bg-sage-light flex items-center gap-1 text-xs font-bold"
        >
          <ChevronLeft size={20} />
          <span>{t('common.back')}</span>
        </button>

        <div className="flex items-center gap-1">
          <Link
            to={`/report?type=user&id=${provider.id}&name=${encodeURIComponent(provider.name)}`}
            className="text-xs text-coral hover:underline font-semibold px-2 py-1"
          >
            Report Pro
          </Link>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="ll-card p-6 text-center shadow-soft relative overflow-hidden">
        {/* Availability Badge */}
        <div className="absolute top-4 right-4">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-amber-400'}`}
            />
            {isAvailable ? t('providers.available_badge') : t('providers.busy_badge')}
          </span>
        </div>

        {/* Avatar */}
        <div className="relative inline-block mx-auto mb-3">
          <img
            src={provider.avatar}
            alt={provider.name}
            className="w-24 h-24 rounded-3xl object-cover border-2 border-sage-border shadow-md"
          />
          {provider.isVerified && (
            <div
              className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow"
              title={t('providers.verified_badge')}
            >
              <CheckCircle2 size={22} className="text-teal fill-teal-light" />
            </div>
          )}
        </div>

        {/* Name & Headline */}
        <div className="flex items-center justify-center gap-1.5">
          <h1 className="text-xl font-extrabold text-navy">{provider.name}</h1>
        </div>
        <p className="text-xs font-medium text-gray-600 mt-1 max-w-sm mx-auto leading-relaxed">
          {provider.headline}
        </p>

        {/* Rating and Reviews Counter */}
        <div className="flex items-center justify-center gap-2 mt-2.5">
          <RatingStars rating={provider.rating || 5} totalReviews={provider.totalReviews} size="md" />
          <span className="text-gray-300">•</span>
          <span className="text-xs font-semibold text-teal">
            {provider.completedJobsCount || 10}+ jobs completed
          </span>
        </div>

        {/* Quick Rate Pill */}
        <div className="mt-4 pt-3 border-t border-sage-border/60 flex items-center justify-around text-center">
          <div>
            <span className="text-[11px] text-gray-500 block uppercase font-medium">{t('profile.hourly_rate')}</span>
            <span className="text-base font-extrabold text-navy">
              ₹{provider.hourlyRate}
              <span className="text-xs font-normal text-gray-500 ml-0.5">
                {provider.pricingType === 'hourly' ? t('providers.per_hour') : t('providers.per_visit')}
              </span>
            </span>
          </div>

          <div className="h-8 w-[1px] bg-sage-border" />

          <div>
            <span className="text-[11px] text-gray-500 block uppercase font-medium">{t('profile.experience')}</span>
            <span className="text-base font-extrabold text-navy">
              {provider.yearsOfExperience} <span className="text-xs font-normal text-gray-500">Years</span>
            </span>
          </div>

          <div className="h-8 w-[1px] bg-sage-border" />

          <div>
            <span className="text-[11px] text-gray-500 block uppercase font-medium">Service Area</span>
            <span className="text-base font-extrabold text-navy">
              {provider.serviceRadiusKm} <span className="text-xs font-normal text-gray-500">km</span>
            </span>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons: Contact & Request a Quote */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleStartChat}
          className="ll-btn-secondary w-full"
        >
          <MessageSquare size={18} className="text-teal" />
          <span>{t('providers.contact')}</span>
        </button>

        <button
          type="button"
          onClick={handleRequestQuote}
          className="ll-btn-primary w-full"
        >
          <PlusCircle size={18} />
          <span>{t('providers.request_quote')}</span>
        </button>
      </div>

      {/* About & Bio */}
      <div className="ll-card p-5 space-y-3">
        <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
          {t('profile.bio')}
        </h2>
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {provider.bio || 'Professional neighborhood service provider registered on LocalLink.'}
        </p>

        {/* Operating hours & Base Location */}
        <div className="pt-3 border-t border-sage-border/60 space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-teal flex-shrink-0" />
            <span><strong>{t('profile.working_hours')}:</strong> {provider.workingHours || '8:00 AM - 8:00 PM'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-coral flex-shrink-0" />
            <span><strong>{t('profile.service_area')}:</strong> {provider.baseLocation} (Servicing within {provider.serviceRadiusKm} km)</span>
          </div>
          {provider.isVerified && (
            <div className="flex items-center gap-2 text-teal-dark font-medium">
              <ShieldCheck size={15} className="text-teal flex-shrink-0" />
              <span>Government ID Verified: {provider.idDocumentType || 'Aadhaar Card'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Skills / Categories */}
      {provider.skills && provider.skills.length > 0 && (
        <div className="ll-card p-5 space-y-3">
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
            {t('profile.skills')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {provider.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 rounded-xl bg-sage text-navy text-xs font-semibold"
              >
                {t(`categories.${skill}`, { defaultValue: skill })}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Gallery */}
      {provider.portfolio && provider.portfolio.length > 0 && (
        <div className="ll-card p-5 space-y-3">
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
            {t('profile.portfolio')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {provider.portfolio.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setActivePhoto(img)}
                className="aspect-square rounded-2xl overflow-hidden border border-sage-border cursor-pointer hover:opacity-95 transition-all shadow-xs"
              >
                <img
                  src={img}
                  alt={`Work photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Reviews */}
      <div className="ll-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
            {t('profile.reviews')} ({reviews.length})
          </h2>
          <RatingStars rating={provider.rating} showNumber={false} size="sm" />
        </div>

        {reviews.length === 0 ? (
          <p className="text-xs text-gray-500 py-2">{t('profile.no_reviews')}</p>
        ) : (
          <div className="space-y-3 divide-y divide-sage-border/50">
            {reviews.map((rev) => (
              <div key={rev.id} className="pt-3 first:pt-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={rev.customerAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=128&q=80'}
                      alt={rev.customerName}
                      className="w-7 h-7 rounded-full object-cover border border-sage-border"
                    />
                    <span className="text-xs font-bold text-navy">{rev.customerName}</span>
                  </div>
                  <RatingStars rating={rev.rating} showNumber={false} size="sm" />
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>
                <span className="text-[10px] text-gray-400 block">
                  {new Date(rev.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Lightbox Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-lg w-full max-h-[85vh] rounded-2xl overflow-hidden bg-white shadow-2xl">
            <img src={activePhoto} alt="Enlarged work" className="w-full h-auto max-h-[80vh] object-contain" />
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-navy/80 text-white hover:bg-coral text-xs font-bold"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
