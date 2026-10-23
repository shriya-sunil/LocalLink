import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Zap,
  Wrench,
  Hammer,
  Sparkles,
  UtensilsCrossed,
  Package,
  Cpu,
  Paintbrush,
  ShieldCheck,
  ArrowRight,
  PlusCircle,
  Clock,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getProviders } from '../../lib/api/providers';
import { getRequests } from '../../lib/api/requests';
import { ProviderProfile, ServiceRequest } from '../../types';
import { ProviderCard } from '../../components/common/ProviderCard';

const CATEGORIES = [
  { id: 'electrician', nameKey: 'categories.electrician', icon: Zap, color: 'text-amber-500 bg-amber-50' },
  { id: 'plumber', nameKey: 'categories.plumber', icon: Wrench, color: 'text-blue-500 bg-blue-50' },
  { id: 'carpenter', nameKey: 'categories.carpenter', icon: Hammer, color: 'text-amber-700 bg-amber-50' },
  { id: 'cleaner', nameKey: 'categories.cleaner', icon: Sparkles, color: 'text-emerald-500 bg-emerald-50' },
  { id: 'cook', nameKey: 'categories.cook', icon: UtensilsCrossed, color: 'text-orange-500 bg-orange-50' },
  { id: 'delivery', nameKey: 'categories.delivery', icon: Package, color: 'text-indigo-500 bg-indigo-50' },
  { id: 'repair', nameKey: 'categories.repair', icon: Cpu, color: 'text-teal bg-teal-light' },
  { id: 'painter', nameKey: 'categories.painter', icon: Paintbrush, color: 'text-rose-500 bg-rose-50' },
];

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isPro } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProviders, setFeaturedProviders] = useState<ProviderProfile[]>([]);
  const [activeRequests, setActiveRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [pros, reqs] = await Promise.all([
          getProviders({ verifiedOnly: true, sortBy: 'rating' }),
          getRequests({ status: 'open' }),
        ]);
        setFeaturedProviders(pros.slice(0, 4));
        setActiveRequests(reqs.slice(0, 2));
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/providers?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/providers');
    }
  };

  return (
    <div className="space-y-6">
      {/* Personalized Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-navy leading-tight">
            {t('home.greeting', { name: user?.name ? user.name.split(' ')[0] : 'Neighbor' })}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <MapPin size={12} className="text-coral" />
            <span>Indiranagar & Nearby, Bengaluru</span>
          </p>
        </div>

        {/* Mode Indicator badge */}
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
          isPro ? 'bg-navy text-white border-teal' : 'bg-teal text-white border-teal-hover'
        }`}>
          {isPro ? t('app.provider') : t('app.customer')}
        </span>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search size={20} className="absolute left-4 top-3.5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('home.search_placeholder')}
          className="ll-input pl-11 pr-24 shadow-sm"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 bottom-2 px-3.5 rounded-lg bg-teal text-white text-xs font-bold hover:bg-teal-hover transition-colors"
        >
          {t('common.submit')}
        </button>
      </form>

      {/* Quick Post Request Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-navy via-navy-hover to-teal-dark text-white p-5 shadow-soft-md">
        <div className="relative z-10 max-w-[85%]">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-coral text-white uppercase tracking-wider mb-2">
            Urgent or Scheduled
          </span>
          <h2 className="text-lg font-black leading-tight text-white">
            {t('home.quick_post_banner_title')}
          </h2>
          <p className="text-xs text-sage mt-1 leading-relaxed opacity-95">
            {t('home.quick_post_banner_desc')}
          </p>

          <div className="mt-4 flex items-center gap-3">
            <Link
              to="/post-request"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal text-white text-xs font-bold hover:bg-teal-hover transition-all shadow-md active:scale-95"
            >
              <PlusCircle size={16} />
              <span>{t('home.post_job_now')}</span>
            </Link>
          </div>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-teal/20 blur-xl pointer-events-none" />
      </div>

      {/* Service Category Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-navy uppercase tracking-wider">
            {t('home.categories_title')}
          </h2>
          <Link
            to="/providers"
            className="text-xs font-bold text-teal hover:underline flex items-center gap-0.5"
          >
            <span>{t('home.view_all')}</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate(`/providers?cat=${cat.id}`)}
                className="ll-card p-3 flex flex-col items-center text-center hover:border-teal/50 hover:bg-white transition-all group active:scale-95 shadow-soft"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-1.5 ${cat.color} group-hover:scale-110 transition-transform shadow-xs`}>
                  <Icon size={22} strokeWidth={2} />
                </div>
                <span className="text-[11px] font-bold text-navy leading-tight line-clamp-2">
                  {t(cat.nameKey).split('(')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Service Requests Section */}
      {activeRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-teal" />
              <h2 className="text-sm font-extrabold text-navy uppercase tracking-wider">
                {t('home.active_requests')}
              </h2>
            </div>
            <Link to="/bookings" className="text-xs font-bold text-teal hover:underline">
              {t('home.view_all')}
            </Link>
          </div>

          <div className="space-y-3">
            {activeRequests.map((req) => (
              <Link
                key={req.id}
                to={`/request/${req.id}`}
                className="block ll-card p-3.5 hover:border-teal transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-sage text-navy">
                    {t(`categories.${req.category}`, { defaultValue: req.category })}
                  </span>
                  <span className="text-xs font-bold text-teal bg-teal-light px-2 py-0.5 rounded-full border border-teal/30">
                    {req.quotesCount || 0} quotes
                  </span>
                </div>
                <h3 className="text-sm font-bold text-navy line-clamp-1">{req.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{req.address}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Verified Providers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={18} className="text-teal" />
              <h2 className="text-sm font-extrabold text-navy uppercase tracking-wider">
                {t('home.featured_pros')}
              </h2>
            </div>
            <p className="text-xs text-gray-500">{t('home.featured_desc')}</p>
          </div>
          <Link
            to="/providers"
            className="text-xs font-bold text-teal hover:underline flex items-center gap-0.5 flex-shrink-0"
          >
            <span>{t('home.view_all')}</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 pt-2">
            {[1, 2].map((i) => (
              <div key={i} className="ll-card p-4 animate-pulse space-y-3">
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
        ) : featuredProviders.length === 0 ? (
          <div className="ll-card p-6 text-center text-xs text-gray-500">
            No featured providers at this moment.
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {featuredProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
