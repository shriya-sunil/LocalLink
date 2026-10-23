import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LifeBuoy, ChevronLeft, CheckCircle2, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { submitSupportTicket } from '../../lib/api/tickets';
import { ImageUploader } from '../../components/common/ImageUploader';

const TOPICS = [
  { id: 'booking_help', key: 'support.topics.booking_help' },
  { id: 'payment_query', key: 'support.topics.payment_query' },
  { id: 'pro_onboarding', key: 'support.topics.pro_onboarding' },
  { id: 'account', key: 'support.topics.account' },
  { id: 'other', key: 'support.topics.other' },
];

export const SupportPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [topic, setTopic] = useState('booking_help');
  const [message, setMessage] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      await submitSupportTicket({
        userId: user?.id || 'usr_priya_01',
        topic,
        message: message.trim(),
        screenshotUrl: screenshots[0],
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
          {t('support.title')}
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {t('support.subtitle')}
        </p>
      </div>

      {submitted ? (
        <div className="ll-card p-6 text-center space-y-3 bg-teal-light border-teal animate-in zoom-in-95">
          <div className="w-12 h-12 rounded-full bg-teal text-white flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-base font-extrabold text-navy">{t('support.success_title')}</h2>
          <p className="text-xs text-gray-700 leading-relaxed max-w-sm mx-auto">
            {t('support.success_desc')}
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="ll-btn-primary text-xs mt-3"
          >
            Back
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="ll-card p-4 space-y-2">
            <label className="block text-xs font-bold text-navy uppercase tracking-wider">
              {t('support.topic_label')}
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="ll-input"
            >
              {TOPICS.map((top) => (
                <option key={top.id} value={top.id}>
                  {t(top.key)}
                </option>
              ))}
            </select>
          </div>

          <div className="ll-card p-4 space-y-2">
            <label className="block text-xs font-bold text-navy mb-1">
              {t('support.message_label')} *
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('support.message_placeholder')}
              className="ll-input resize-none"
              required
            />
          </div>

          <div className="ll-card p-4 space-y-2">
            <ImageUploader
              images={screenshots}
              onChange={setScreenshots}
              maxImages={1}
              label={t('support.screenshot_label')}
              hint="Attach an image if you're reporting a bug or proof of payment."
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="ll-btn-primary w-full min-h-[48px]"
          >
            {submitting ? t('common.loading') : t('support.submit')}
          </button>
        </form>
      )}
    </div>
  );
};
