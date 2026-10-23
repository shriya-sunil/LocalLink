import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, AlertTriangle, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { submitReport } from '../../lib/api/tickets';

const REPORT_REASONS = [
  { id: 'no_show', key: 'report.reasons.no_show' },
  { id: 'overcharging', key: 'report.reasons.overcharging' },
  { id: 'unprofessional', key: 'report.reasons.unprofessional' },
  { id: 'poor_work', key: 'report.reasons.poor_work' },
  { id: 'fraud', key: 'report.reasons.fraud' },
  { id: 'harassment', key: 'report.reasons.harassment' },
];

export const ReportPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const targetType = (searchParams.get('type') || 'user') as 'user' | 'booking' | 'request';
  const targetId = searchParams.get('id') || 'unknown';
  const targetName = searchParams.get('name') || '';

  const [reason, setReason] = useState(REPORT_REASONS[0].id);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    setSubmitting(true);
    try {
      await submitReport({
        reporterId: user?.id || 'usr_priya_01',
        targetType,
        targetId,
        targetName,
        reason,
        details: details.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl text-navy hover:bg-sage-light flex items-center gap-1 text-xs font-bold"
        >
          <ChevronLeft size={20} />
          <span>{t('common.back')}</span>
        </button>
      </div>

      <div>
        <h1 className="text-xl font-extrabold text-navy leading-tight">
          {t('report.title')}
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {t('report.subtitle')}
        </p>
      </div>

      {submitted ? (
        <div className="ll-card p-6 text-center space-y-3 bg-teal-light border-teal animate-in zoom-in-95">
          <div className="w-12 h-12 rounded-full bg-teal text-white flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-base font-extrabold text-navy">{t('report.success_title')}</h2>
          <p className="text-xs text-gray-700 leading-relaxed max-w-sm mx-auto">
            {t('report.success_desc')}
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="ll-btn-primary text-xs mt-3"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {targetName && (
            <div className="p-3 rounded-xl bg-sage-light border border-sage-border text-xs text-navy font-semibold">
              Reporting: <span className="font-extrabold text-coral">{targetName}</span>
            </div>
          )}

          <div className="ll-card p-4 space-y-2.5">
            <label className="block text-xs font-bold text-navy uppercase tracking-wider">
              {t('report.reason_label')}
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                    reason === r.id
                      ? 'border-coral bg-coral-light/60 text-navy ring-1 ring-coral'
                      : 'border-sage-border bg-white text-navy hover:bg-sage-light'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={() => setReason(r.id)}
                    className="accent-coral"
                  />
                  <span>{t(r.key)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="ll-card p-4 space-y-2">
            <label className="block text-xs font-bold text-navy mb-1">
              {t('report.details_label')} *
            </label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t('report.details_placeholder')}
              className="ll-input resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !details.trim()}
            className="ll-btn-coral w-full min-h-[48px] shadow-sm"
          >
            {submitting ? t('common.loading') : t('report.submit')}
          </button>
        </form>
      )}
    </div>
  );
};
