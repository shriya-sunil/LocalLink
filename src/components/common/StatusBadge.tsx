import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookingStatus } from '../../types';

interface StatusBadgeProps {
  status: BookingStatus | 'open' | 'quoted' | 'booked';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const { t } = useTranslation();

  // Design Tokens requirement:
  // "Job status badges: Requested = Salmon, Accepted = Teal, In progress = Navy, Completed = Sage with dark teal text"
  switch (status) {
    case 'requested':
    case 'open':
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-salmon-light text-navy border border-salmon ${className}`}>
          {t('bookings.status_requested')}
        </span>
      );
    case 'accepted':
    case 'quoted':
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-light text-teal-dark border border-teal ${className}`}>
          {t('bookings.status_accepted')}
        </span>
      );
    case 'in_progress':
    case 'booked':
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-navy text-white shadow-sm ${className}`}>
          {t('bookings.status_in_progress')}
        </span>
      );
    case 'completed':
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sage text-teal-dark border border-sage-hover ${className}`}>
          {t('bookings.status_completed')}
        </span>
      );
    case 'cancelled':
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-coral-light text-coral border border-coral/30 ${className}`}>
          {t('bookings.status_cancelled')}
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ${className}`}>
          {status}
        </span>
      );
  }
};
