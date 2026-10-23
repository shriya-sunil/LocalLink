import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, ArrowUpDown, X, AlertCircle } from 'lucide-react';
import { getProviders, ProviderFilterOptions } from '../../lib/api/providers';
import { ProviderProfile } from '../../types';
import { ProviderCard } from '../../components/common/ProviderCard';
import { FilterSheet } from '../../components/common/FilterSheet';

const CATEGORY_TABS = [
  { id: 'all', key: 'categories.all' },
  { id: 'electrician', key: 'categories.electrician' },
  { id: 'plumber', key: 'categories.plumber' },
  { id: 'carpenter', key: 'categories.carpenter' },
  { id: 'cleaner', key: 'categories.cleaner' },
  { id: 'cook', key: 'categories.cook' },
  { id: 'repair', key: 'categories.repair' },
];

export const ProviderSearchPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCat = searchParams.get('cat') || 'all';
  const initialQuery = searchParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [searchInput, setSearchInput] = useState<string>(initialQuery);
  const [filters, setFilters] = useState<ProviderFilterOptions>({
    category: initialCat === 'all' ? undefined : initialCat,
    searchQuery: initialQuery,
    maxDistanceKm: 15,
    minRating: 0,
    maxPrice: 2000,
    availableOnly: false,
    verifiedOnly: false,
    sortBy: 'rating',
  });

  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  useEffect(() => {
    async function fetchList() {
      try {
        setLoading(true);
        const res = await getProviders(filters);
        setProviders(res);
      } catch (err) {
        console.error('Failed to load providers', err);
      } finally {
        setLoading(false);
      }
    }
    fetchList();
  }, [filters]);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setFilters((prev) => ({
      ...prev,
      category: catId === 'all' ? undefined : catId,
    }));
    setSearchParams(catId === 'all' ? {} : { cat: catId });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      searchQuery: searchInput.trim(),
    }));
  };

  const activeFilterCount =
    (filters.minRating ? 1 : 0) +
    (filters.availableOnly ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    ((filters.maxDistanceKm && filters.maxDistanceKm < 15) ? 1 : 0) +
    ((filters.maxPrice && filters.maxPrice < 2000) ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('providers.search_placeholder')}
            className="ll-input pl-10 pr-8 min-h-[46px] text-xs sm:text-sm"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setFilters((prev) => ({ ...prev, searchQuery: '' }));
              }}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-navy"
            >
              <X size={16} />
            </button>
          )}
        </form>

        <button
          type="button"
          onClick={() => setIsFilterSheetOpen(true)}
          className={`relative ll-btn-secondary min-h-[46px] px-3.5 rounded-xl flex items-center gap-1.5 ${
            activeFilterCount > 0 ? 'bg-teal text-white' : ''
          }`}
          aria-label={t('providers.filter_btn')}
        >
          <SlidersHorizontal size={18} />
          <span className="hidden sm:inline text-xs font-bold">{t('providers.filter_btn')}</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-coral text-white text-[10px] font-extrabold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Horizontal Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
        {CATEGORY_TABS.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-teal text-white shadow-sm'
                  : 'bg-sage text-navy hover:bg-sage-hover'
              }`}
            >
              {t(cat.key).split('(')[0]}
            </button>
          );
        })}
      </div>

      {/* Results Count & Quick Sort Indicator */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
        <span className="font-semibold text-navy">
          {t('providers.results_count', { count: providers.length })}
        </span>
        <button
          type="button"
          onClick={() => setIsFilterSheetOpen(true)}
          className="flex items-center gap-1 font-semibold text-teal hover:underline"
        >
          <ArrowUpDown size={13} />
          <span>Sort: {filters.sortBy || 'rating'}</span>
        </button>
      </div>

      {/* Providers List */}
      {loading ? (
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="ll-card p-4 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-2xl bg-sage-light" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-sage-light rounded w-3/4" />
                  <div className="h-3 bg-sage-light rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : providers.length === 0 ? (
        /* Empty State */
        <div className="ll-card p-8 text-center space-y-3 bg-salmon-light/30 border-salmon">
          <div className="w-12 h-12 rounded-full bg-salmon-light text-coral flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h3 className="font-bold text-navy text-base">{t('providers.no_providers')}</h3>
          <p className="text-xs text-gray-600 max-w-xs mx-auto">
            Try expanding your distance radius, lowering the rating filter, or changing category.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSelectedCategory('all');
              setFilters({
                category: undefined,
                searchQuery: '',
                maxDistanceKm: 25,
                minRating: 0,
                maxPrice: 2000,
                availableOnly: false,
                verifiedOnly: false,
                sortBy: 'rating',
              });
            }}
            className="ll-btn-secondary text-xs"
          >
            {t('providers.clear_filters')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map((pro) => (
            <ProviderCard key={pro.id} provider={pro} />
          ))}
        </div>
      )}

      {/* Filter Sheet Modal */}
      <FilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
      />
    </div>
  );
};
