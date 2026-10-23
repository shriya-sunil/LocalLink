import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Search,
  PlusCircle,
  CalendarCheck,
  MessageSquare,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BottomNavigation: React.FC = () => {
  const { t } = useTranslation();
  const { isPro } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-navy text-white border-t border-navy-hover/80 shadow-2xl safe-area-pb">
      <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around">
        {isPro ? (
          /* PRO NAVIGATION */
          <>
            <NavLink
              to="/requests"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[64px] min-h-[48px] py-1 rounded-xl transition-all ${
                  isActive ? 'text-teal font-bold' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              <Briefcase size={20} />
              <span className="text-[10px] mt-1">{t('nav.requests')}</span>
            </NavLink>

            <NavLink
              to="/bookings"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[64px] min-h-[48px] py-1 rounded-xl transition-all ${
                  isActive ? 'text-teal font-bold' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              <CalendarCheck size={20} />
              <span className="text-[10px] mt-1">{t('nav.bookings')}</span>
            </NavLink>

            <NavLink
              to="/chat"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[64px] min-h-[48px] py-1 rounded-xl transition-all ${
                  isActive ? 'text-teal font-bold' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              <MessageSquare size={20} />
              <span className="text-[10px] mt-1">{t('nav.chat')}</span>
            </NavLink>

            <NavLink
              to="/provider/onboarding"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[64px] min-h-[48px] py-1 rounded-xl transition-all ${
                  isActive ? 'text-teal font-bold' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              <UserCheck size={20} />
              <span className="text-[10px] mt-1">{t('nav.profile')}</span>
            </NavLink>
          </>
        ) : (
          /* CUSTOMER NAVIGATION */
          <>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[60px] min-h-[48px] py-1 rounded-xl transition-all ${
                  isActive ? 'text-teal font-bold' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              <Home size={20} />
              <span className="text-[10px] mt-1">{t('nav.home')}</span>
            </NavLink>

            <NavLink
              to="/providers"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[60px] min-h-[48px] py-1 rounded-xl transition-all ${
                  isActive ? 'text-teal font-bold' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              <Search size={20} />
              <span className="text-[10px] mt-1">{t('nav.explore')}</span>
            </NavLink>

            {/* Elevated Primary Action: Post a Request */}
            <NavLink
              to="/post-request"
              className="flex flex-col items-center justify-center -mt-5 min-h-[52px] group"
              aria-label={t('nav.post_request')}
            >
              <div className="w-12 h-12 rounded-full bg-teal text-white flex items-center justify-center shadow-lg ring-4 ring-navy group-hover:scale-105 group-active:scale-95 transition-transform">
                <PlusCircle size={26} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] mt-1 font-bold text-teal">
                {t('nav.post_request')}
              </span>
            </NavLink>

            <NavLink
              to="/bookings"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[60px] min-h-[48px] py-1 rounded-xl transition-all ${
                  isActive ? 'text-teal font-bold' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              <CalendarCheck size={20} />
              <span className="text-[10px] mt-1">{t('nav.bookings')}</span>
            </NavLink>

            <NavLink
              to="/chat"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[60px] min-h-[48px] py-1 rounded-xl transition-all ${
                  isActive ? 'text-teal font-bold' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              <MessageSquare size={20} />
              <span className="text-[10px] mt-1">{t('nav.chat')}</span>
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
};
