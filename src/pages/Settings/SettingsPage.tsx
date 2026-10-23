import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Bell,
  Shield,
  LogOut,
  HelpCircle,
  FileText,
  User,
  Briefcase,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher';
import { RoleSwitcher } from '../../components/layout/RoleSwitcher';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, role, isPro, logout, switchToDemoUser } = useAuth();

  const [jobAlerts, setJobAlerts] = useState(true);
  const [chatAlerts, setChatAlerts] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-navy leading-tight">
          {t('settings.title')}
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          App language, profile, and notification settings
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="ll-card p-4 space-y-3.5 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80'}
              alt={user?.name}
              className="w-14 h-14 rounded-2xl object-cover border border-sage-border shadow-xs"
            />
            <div>
              <h2 className="text-sm font-bold text-navy">{user?.name}</h2>
              <p className="text-xs text-gray-500">{user?.phone || user?.email}</p>
              <div className="mt-1">
                <RoleSwitcher />
              </div>
            </div>
          </div>
        </div>

        {isPro && (
          <Link
            to="/provider/onboarding"
            className="block p-3 rounded-xl bg-teal-light text-xs font-bold text-teal-dark border border-teal/30 hover:bg-teal hover:text-white transition-colors text-center"
          >
            Edit Trade Skills, Pricing & ID Verification →
          </Link>
        )}
      </div>

      {/* Section 1: Regional Language Switcher */}
      <div className="ll-card p-4 space-y-3 shadow-soft">
        <div className="flex items-center gap-2 text-navy">
          <Globe size={18} className="text-teal" />
          <h2 className="text-xs font-bold uppercase tracking-wider">
            {t('settings.language_section')}
          </h2>
        </div>
        <LanguageSwitcher variant="full" />
      </div>

      {/* Section 2: Notification Preferences */}
      <div className="ll-card p-4 space-y-3 shadow-soft">
        <div className="flex items-center gap-2 text-navy">
          <Bell size={18} className="text-teal" />
          <h2 className="text-xs font-bold uppercase tracking-wider">
            {t('settings.notifications_section')}
          </h2>
        </div>

        <div className="space-y-2.5 divide-y divide-sage-border/50 text-xs">
          <label className="flex items-center justify-between pt-2 first:pt-0 cursor-pointer">
            <span className="font-semibold text-navy">{t('settings.job_alerts')}</span>
            <input
              type="checkbox"
              checked={jobAlerts}
              onChange={(e) => setJobAlerts(e.target.checked)}
              className="w-5 h-5 accent-teal rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between pt-2.5 cursor-pointer">
            <span className="font-semibold text-navy">{t('settings.chat_messages')}</span>
            <input
              type="checkbox"
              checked={chatAlerts}
              onChange={(e) => setChatAlerts(e.target.checked)}
              className="w-5 h-5 accent-teal rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between pt-2.5 cursor-pointer">
            <span className="font-semibold text-navy">{t('settings.promos')}</span>
            <input
              type="checkbox"
              checked={promoAlerts}
              onChange={(e) => setPromoAlerts(e.target.checked)}
              className="w-5 h-5 accent-teal rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Quick Switch Demo Accounts (Behind Dev Flag) */}
      <div className="ll-card p-4 space-y-3 bg-gradient-to-br from-white to-salmon-light/30 border-salmon/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-coral text-white tracking-wider">
              DEV FLAG
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
              Demo Accounts Mode
            </h2>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Switch to offline mock accounts for development and demo walkthroughs:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => switchToDemoUser('customer')}
            className="p-2.5 rounded-xl border border-teal text-xs font-bold text-teal-dark bg-white hover:bg-teal-light transition-colors text-left"
          >
            Priya (Demo Customer)
          </button>
          <button
            type="button"
            onClick={() => switchToDemoUser('provider')}
            className="p-2.5 rounded-xl border border-navy text-xs font-bold text-navy bg-white hover:bg-navy-light transition-colors text-left"
          >
            Ramesh (Demo Pro)
          </button>
        </div>
      </div>

      {/* Support & Community Links */}
      <div className="ll-card divide-y divide-sage-border/50 text-xs overflow-hidden shadow-soft">
        <Link
          to="/support"
          className="p-3.5 flex items-center justify-between hover:bg-sage-light transition-colors"
        >
          <div className="flex items-center gap-2.5 text-navy font-semibold">
            <HelpCircle size={16} className="text-teal" />
            <span>{t('support.title')}</span>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </Link>

        <Link
          to="/report"
          className="p-3.5 flex items-center justify-between hover:bg-sage-light transition-colors"
        >
          <div className="flex items-center gap-2.5 text-navy font-semibold">
            <Shield size={16} className="text-coral" />
            <span>{t('report.title')}</span>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </Link>
      </div>

      {/* Log Out */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-3 px-4 rounded-xl border border-coral/40 bg-coral-light text-coral font-bold text-xs hover:bg-coral hover:text-white transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={16} />
        <span>{t('auth.logout')}</span>
      </button>

      {/* Version info */}
      <div className="text-center text-[11px] text-gray-400 pt-1">
        LocalLink PWA • {t('settings.version')}
      </div>
    </div>
  );
};
