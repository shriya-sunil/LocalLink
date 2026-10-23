import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';

export const AppLayout: React.FC = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-sage-light text-navy flex flex-col selection:bg-salmon selection:text-navy">
      <Header />

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-coral text-white text-xs py-2 px-4 flex items-center justify-center gap-2 text-center font-medium shadow-sm">
          <WifiOff size={15} />
          <span>{t('app.offline_notice')}</span>
        </div>
      )}

      {/* Main Content Area (Mobile First Container) */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-4 pb-24 animate-in fade-in duration-150">
        <Outlet />
      </main>

      <BottomNavigation />
    </div>
  );
};
