import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Clock, MapPin, IndianRupee, MessageSquare, ChevronRight } from 'lucide-react';
import { ServiceRequest } from '../../types';
import { StatusBadge } from './StatusBadge';

interface RequestCardProps {
  request: ServiceRequest;
  role?: 'customer' | 'provider';
  onSendQuote?: (request: ServiceRequest) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request, role = 'customer', onSendQuote }) => {
  const { t } = useTranslation();

  const isEmergency = request.urgency === 'emergency';

  return (
    <div className={`ll-card p-4 transition-all duration-200 shadow-soft ${
      isEmergency ? 'border-coral/50 bg-white ring-1 ring-coral/20' : ''
    }`}>
      {/* Top Meta: Category & Urgency */}
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sage text-navy">
          {t(`categories.${request.category}`, { defaultValue: request.category })}
        </span>

        <div className="flex items-center gap-1.5">
          {isEmergency ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-coral text-white shadow-sm animate-pulse">
              <AlertCircle size={12} />
              {t('post_request.urgency_emergency').split('(')[0]}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-salmon-light text-navy border border-salmon">
              <Clock size={12} className="text-navy" />
              {t('post_request.urgency_flexible').split('(')[0]}
            </span>
          )}
          <StatusBadge status={request.status} />
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-navy text-base line-clamp-2 leading-snug">
        {request.title || 'Service Request'}
      </h3>

      {/* Description */}
      <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
        {request.description || 'No description provided.'}
      </p>

      {/* Photos thumbnail preview if available */}
      {request.photos && request.photos.length > 0 && (
        <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1">
          {request.photos.map((photo, i) => (
            <img
              key={i}
              src={photo}
              alt="job preview"
              className="w-14 h-14 rounded-lg object-cover border border-sage-border flex-shrink-0"
              loading="lazy"
            />
          ))}
        </div>
      )}

      {/* Address & Date */}
      <div className="mt-3 pt-2 border-t border-sage-border/50 space-y-1 text-xs text-gray-500">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin size={13} className="text-coral flex-shrink-0" />
          <span className="truncate">{request.address || 'Neighborhood area'}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Clock size={13} className="text-teal flex-shrink-0" />
            <span>{request.preferredDate || 'Flexible'} {request.preferredTime ? `• ${request.preferredTime}` : ''}</span>
          </div>

          {(request.budgetMin || request.budgetMax) && (
            <span className="font-bold text-navy text-xs bg-sage-light px-2 py-0.5 rounded-md border border-sage-border">
              ₹{request.budgetMin || 0} - ₹{request.budgetMax || 'Any'}
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-3.5 pt-2.5 border-t border-sage-border/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-navy">
          <span className="w-2 h-2 rounded-full bg-teal animate-ping" />
          <span>{request.quotesCount || 0} {t('request_details.quotes_received', { count: request.quotesCount || 0 }).split('(')[0]}</span>
        </div>

        {role === 'provider' ? (
          <button
            type="button"
            onClick={() => onSendQuote && onSendQuote(request)}
            className="ll-btn-primary text-xs px-3.5 py-2 min-h-[40px] rounded-xl"
          >
            {t('open_requests.send_quote_btn')}
          </button>
        ) : (
          <Link
            to={`/request/${request.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-teal hover:text-teal-dark p-1"
          >
            <span>{t('request_details.title')}</span>
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
};
