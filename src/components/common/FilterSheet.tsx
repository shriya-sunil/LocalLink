import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, SlidersHorizontal, Star, ShieldCheck, Check } from 'lucide-react';
import { ProviderFilterOptions } from '../../lib/api/providers';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ProviderFilterOptions;
  onApply: (filters: ProviderFilterOptions) => void;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({ isOpen, onClose, filters, onApply }) => {
  const { t } = useTranslation();

  const [localFilters, setLocalFilters] = useState<ProviderFilterOptions>(filters);

  if (!isOpen) return null;

  const handleReset = () => {
    const resetValues: ProviderFilterOptions = {
      category: filters.category,
      searchQuery: filters.searchQuery,
      maxDistanceKm: 15,
      minRating: 0,
      maxPrice: 2000,
      availableOnly: false,
      verifiedOnly: false,
      sortBy: 'rating',
    };
    setLocalFilters(resetValues);
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl border border-sage-border overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-sage-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-teal" />
            <h2 className="text-lg font-bold text-navy">{t('providers.filters_title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-sage-light text-navy transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="px-5 py-4 overflow-y-auto space-y-5 text-navy">
          {/* Sort By */}
          <div>
            <label className="block text-sm font-bold mb-2">{t('providers.sort_by')}</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'rating', label: t('providers.sort_rating') },
                { id: 'distance', label: t('providers.sort_distance') },
                { id: 'price', label: t('providers.sort_price_low') },
                { id: 'experience', label: t('providers.sort_experience') },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, sortBy: opt.id as any })}
                  className={`p-2.5 rounded-xl text-xs font-semibold text-left border flex items-center justify-between transition-colors ${
                    localFilters.sortBy === opt.id
                      ? 'border-teal bg-teal-light text-teal-dark ring-1 ring-teal'
                      : 'border-sage-border bg-white text-navy hover:bg-sage-light'
                  }`}
                >
                  <span>{opt.label}</span>
                  {localFilters.sortBy === opt.id && <Check size={14} className="text-teal" />}
                </button>
              ))}
            </div>
          </div>

          {/* Distance */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-bold">{t('providers.max_distance')}</label>
              <span className="text-xs font-bold text-teal bg-teal-light px-2 py-0.5 rounded-md">
                {localFilters.maxDistanceKm || 10} km
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={localFilters.maxDistanceKm || 10}
              onChange={(e) => setLocalFilters({ ...localFilters, maxDistanceKm: Number(e.target.value) })}
              className="w-full accent-teal h-2 bg-sage-light rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-gray-500 mt-1">
              <span>1 km (Hyperlocal)</span>
              <span>25 km (Citywide)</span>
            </div>
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="block text-sm font-bold mb-2">{t('providers.min_rating')}</label>
            <div className="flex items-center gap-2">
              {[0, 4.0, 4.5, 4.8].map((ratingVal) => (
                <button
                  key={ratingVal}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, minRating: ratingVal })}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-colors ${
                    (localFilters.minRating || 0) === ratingVal
                      ? 'bg-salmon-light border-salmon text-navy ring-1 ring-salmon'
                      : 'border-sage-border bg-white text-navy hover:bg-sage-light'
                  }`}
                >
                  <Star size={13} className="text-coral fill-coral" />
                  <span>{ratingVal === 0 ? 'Any' : `${ratingVal}+`}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Max Hourly Rate */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-bold">{t('providers.price_range')}</label>
              <span className="text-xs font-bold text-teal bg-teal-light px-2 py-0.5 rounded-md">
                Up to ₹{localFilters.maxPrice || 1000}
              </span>
            </div>
            <input
              type="range"
              min="200"
              max="2500"
              step="50"
              value={localFilters.maxPrice || 1000}
              onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: Number(e.target.value) })}
              className="w-full accent-teal h-2 bg-sage-light rounded-lg cursor-pointer"
            />
          </div>

          {/* Toggles: Available Today & Verified Only */}
          <div className="space-y-2.5 pt-2 border-t border-sage-border">
            <label className="flex items-center justify-between p-3 rounded-xl border border-sage-border hover:bg-sage-light/50 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold">{t('providers.available_now')}</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(localFilters.availableOnly)}
                onChange={(e) => setLocalFilters({ ...localFilters, availableOnly: e.target.checked })}
                className="w-5 h-5 accent-teal rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-sage-border hover:bg-sage-light/50 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-teal" />
                <span className="text-sm font-semibold">{t('providers.verified_only')}</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(localFilters.verifiedOnly)}
                onChange={(e) => setLocalFilters({ ...localFilters, verifiedOnly: e.target.checked })}
                className="w-5 h-5 accent-teal rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-sage-border bg-sage-light/40 flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 ll-btn-secondary min-h-[46px]"
          >
            {t('providers.clear_filters')}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 ll-btn-primary min-h-[46px]"
          >
            {t('providers.apply_filters')}
          </button>
        </div>
      </div>
    </div>
  );
};
