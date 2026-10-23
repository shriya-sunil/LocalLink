import React from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RoleSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { role, toggleRole } = useAuth();

  const isPro = role === 'provider';

  return (
    <button
      type="button"
      onClick={toggleRole}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
        isPro
          ? 'bg-navy text-white border border-teal/40' // Pro = Navy
          : 'bg-teal text-white border border-teal-hover' // Customer = Teal
      }`}
      title={isPro ? t('app.switch_to_customer') : t('app.switch_to_pro')}
      aria-label={isPro ? t('app.switch_to_customer') : t('app.switch_to_pro')}
    >
      {isPro ? (
        <>
          <Briefcase size={14} className="text-salmon" />
          <span>{t('app.provider')}</span>
        </>
      ) : (
        <>
          <UserIcon size={14} className="text-white" />
          <span>{t('app.customer')}</span>
        </>
      )}
      <span className="text-[10px] opacity-75 font-normal ml-0.5 hidden xs:inline">
        (Tap to switch)
      </span>
    </button>
  );
};
