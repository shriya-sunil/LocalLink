import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, MapPin, Briefcase, Clock, MessageSquare } from 'lucide-react';
import { ProviderProfile } from '../../types';
import { RatingStars } from './RatingStars';

interface ProviderCardProps {
  provider: ProviderProfile;
  onRequestQuote?: (provider: ProviderProfile) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onRequestQuote }) => {
  const { t } = useTranslation();

  const isAvailable = provider.availabilityStatus === 'available';

  return (
    <div className="ll-card p-4 hover:border-teal/40 transition-all duration-200 shadow-soft">
      <div className="flex items-start gap-3.5">
        {/* Provider Avatar & Status dot */}
        <div className="relative flex-shrink-0">
          <img
            src={provider.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
            alt={provider.name}
            className="w-16 h-16 rounded-2xl object-cover border border-sage-border shadow-sm"
            loading="lazy"
          />
          <span
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              isAvailable ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
            title={isAvailable ? 'Available Now' : 'Busy'}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <Link
              to={`/provider/${provider.id}`}
              className="font-bold text-navy text-base hover:text-teal truncate flex items-center gap-1.5"
            >
              <span className="truncate">{provider.name}</span>
              {provider.isVerified && (
                <CheckCircle2
                  size={16}
                  className="text-teal fill-teal-light flex-shrink-0"
                  aria-label={t('providers.verified_badge')}
                />
              )}
            </Link>
            
            <div className="flex-shrink-0">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sage-light text-navy border border-sage-border">
                {isAvailable ? t('providers.available_badge') : t('providers.busy_badge')}
              </span>
            </div>
          </div>

          <p className="text-xs font-medium text-gray-600 line-clamp-1 mt-0.5">
            {provider.headline || t('providers.title')}
          </p>

          {/* Rating & Experience */}
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
            <RatingStars rating={provider.rating || 5} totalReviews={provider.totalReviews || 0} size="sm" />
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Briefcase size={12} className="text-teal" />
              {t('providers.years_exp', { count: provider.yearsOfExperience || 1 })}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 truncate">
            <MapPin size={12} className="text-coral flex-shrink-0" />
            <span className="truncate">{provider.baseLocation || 'Neighborhood'}</span>
            <span className="text-gray-400">•</span>
            <span>{provider.serviceRadiusKm || 5} km radius</span>
          </div>
        </div>
      </div>

      {/* Skills tags */}
      {provider.skills && provider.skills.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-sage-border/60">
          {provider.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-xs px-2.5 py-0.5 rounded-lg bg-sage text-navy font-medium"
            >
              {t(`categories.${skill}`, { defaultValue: skill })}
            </span>
          ))}
          {provider.skills.length > 3 && (
            <span className="text-xs text-gray-500 font-medium">
              +{provider.skills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Bottom Action Row: Price & CTAs */}
      <div className="mt-3.5 flex items-center justify-between gap-2 pt-2 border-t border-sage-border/60">
        <div>
          <span className="text-[11px] text-gray-500 block uppercase font-medium">{t('providers.starting_at')}</span>
          <span className="text-base font-extrabold text-navy">
            ₹{provider.hourlyRate || 300}
            <span className="text-xs font-normal text-gray-500 ml-0.5">
              {provider.pricingType === 'hourly' ? t('providers.per_hour') : t('providers.per_visit')}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/chat?pro=${provider.id}`}
            className="p-2.5 rounded-xl border border-sage-border bg-white text-navy hover:bg-teal-light hover:text-teal hover:border-teal transition-colors"
            title={t('providers.contact')}
            aria-label={t('providers.contact')}
          >
            <MessageSquare size={18} />
          </Link>

          <Link
            to={`/provider/${provider.id}`}
            className="ll-btn-primary text-xs px-3.5 py-2 min-h-[40px] rounded-xl shadow-sm"
          >
            {t('providers.view_profile')}
          </Link>
        </div>
      </div>
    </div>
  );
};
