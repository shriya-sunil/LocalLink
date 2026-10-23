import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, ShieldAlert, Sparkles, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleSwitcher } from './RoleSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';
import { getNotifications } from '../../lib/api/notifications';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isPro } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(1);

  useEffect(() => {
    getNotifications().then((list) => {
      const count = list.filter((n) => !n.isRead).length;
      setUnreadCount(count);
    });
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-navy text-white shadow-soft transition-colors duration-200">
      {/* Top Main Bar */}
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight leading-none text-white">
              Local<span className="text-salmon">Link</span>
            </span>
            <span className="text-[10px] text-sage tracking-wider uppercase font-semibold">
              {isPro ? 'Pro Partner' : 'Neighborhood'}
            </span>
          </div>
        </Link>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2">
          {/* Role Switcher */}
          <RoleSwitcher />

          {/* Language Switcher */}
          <LanguageSwitcher variant="compact" />

          {/* Notifications */}
          <Link
            to="/notifications"
            className="relative p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            aria-label={t('nav.notifications')}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-coral ring-2 ring-navy animate-pulse" />
            )}
          </Link>

          {/* User Profile Avatar */}
          <Link
            to="/settings"
            className="p-1 rounded-full border border-teal/40 hover:border-teal transition-colors flex-shrink-0"
            aria-label={t('nav.profile')}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-teal-light text-teal-dark flex items-center justify-center font-bold text-xs">
                {user?.name?.[0] || 'U'}
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Pro profile completion reminder banner if user is in Pro mode */}
      {isPro && (
        <div className="bg-gradient-to-r from-teal-dark to-navy px-4 py-1.5 text-xs text-white flex items-center justify-between border-t border-white/10">
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles size={14} className="text-salmon flex-shrink-0" />
            <span className="truncate">Boost neighborhood trust with ID Verification & Portfolio</span>
          </div>
          <Link
            to="/provider/onboarding"
            className="text-[11px] font-bold underline text-salmon hover:text-white flex-shrink-0 ml-2"
          >
            Complete Profile →
          </Link>
        </div>
      )}
    </header>
  );
};
