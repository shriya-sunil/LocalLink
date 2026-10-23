import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Clock,
  Calendar,
  MapPin,
  IndianRupee,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createServiceRequest } from '../../lib/api/requests';
import { ImageUploader } from '../../components/common/ImageUploader';
import { UrgencyType } from '../../types';

const CATEGORIES = [
  'electrician',
  'plumber',
  'carpenter',
  'cleaner',
  'cook',
  'delivery',
  'repair',
  'painter',
];

export const PostRequestPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const defaultCat = searchParams.get('cat') || 'electrician';

  const [category, setCategory] = useState<string>(defaultCat);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<UrgencyType>('emergency');
  const [preferredDate, setPreferredDate] = useState('Today');
  const [preferredTime, setPreferredTime] = useState('Within 2 hours');
  const [address, setAddress] = useState('Flat 402, Green Glen Layout, Bellandur, Bengaluru');
  const [budgetMin, setBudgetMin] = useState<string>('500');
  const [budgetMax, setBudgetMax] = useState<string>('1200');

  const [submitting, setSubmitting] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const newReq = await createServiceRequest({
        customerId: user?.id || 'usr_priya_01',
        customerName: user?.name || 'Priya Sharma',
        customerAvatar: user?.avatar,
        customerPhone: user?.phone || '+91 98765 43210',
        category,
        title: title.trim(),
        description: description.trim(),
        photos,
        urgency,
        preferredDate,
        preferredTime,
        address: address.trim(),
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
      });

      setCreatedRequestId(newReq.id);
      setTimeout(() => {
        navigate(`/request/${newReq.id}`);
      }, 1200);
    } catch (err) {
      console.error('Failed to post request', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-navy leading-tight">
          {t('post_request.title')}
        </h1>
        <p className="text-xs text-gray-600 mt-0.5">
          {t('post_request.subtitle')}
        </p>
      </div>

      {createdRequestId ? (
        <div className="ll-card p-6 text-center space-y-3 bg-teal-light border-teal animate-in zoom-in-95">
          <div className="w-14 h-14 rounded-full bg-teal text-white flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-lg font-extrabold text-navy">{t('post_request.success_title')}</h2>
          <p className="text-xs text-gray-700 leading-relaxed max-w-sm mx-auto">
            {t('post_request.success_desc')}
          </p>
          <div className="pt-2 text-xs font-semibold text-teal-dark animate-pulse">
            Redirecting to live quotes view...
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Category */}
          <div className="ll-card p-4 space-y-2">
            <label className="block text-xs font-bold text-navy uppercase tracking-wider">
              {t('post_request.category')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-1 rounded-xl text-center text-xs font-bold transition-all border ${
                      isSelected
                        ? 'border-teal bg-teal text-white shadow-sm'
                        : 'border-sage-border bg-white text-navy hover:bg-sage-light'
                    }`}
                  >
                    <span className="truncate block">
                      {t(`categories.${cat}`, { defaultValue: cat }).split('(')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Description */}
          <div className="ll-card p-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                {t('post_request.title_label')} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('post_request.title_placeholder')}
                className="ll-input"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                {t('post_request.description')}
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('post_request.description_placeholder')}
                className="ll-input resize-none"
              />
            </div>
          </div>

          {/* Photos Upload */}
          <div className="ll-card p-4">
            <ImageUploader
              images={photos}
              onChange={setPhotos}
              maxImages={4}
              label={t('post_request.photos')}
              hint={t('post_request.photos_hint')}
            />
          </div>

          {/* Urgency */}
          <div className="ll-card p-4 space-y-2.5">
            <label className="block text-xs font-bold text-navy uppercase tracking-wider">
              {t('post_request.urgency')}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setUrgency('emergency');
                  setPreferredDate('Today');
                  setPreferredTime('Within 2 hours');
                }}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  urgency === 'emergency'
                    ? 'border-coral bg-coral-light text-navy ring-2 ring-coral/40'
                    : 'border-sage-border bg-white text-navy hover:bg-sage-light'
                }`}
              >
                <div className={`p-2 rounded-xl ${urgency === 'emergency' ? 'bg-coral text-white' : 'bg-coral-light text-coral'}`}>
                  <AlertCircle size={20} />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-coral uppercase tracking-wide">
                    Emergency
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    Needs immediate attention (Within 2 hrs)
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUrgency('flexible');
                  setPreferredDate('This Week');
                  setPreferredTime('Morning (8 AM - 12 PM)');
                }}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  urgency === 'flexible'
                    ? 'border-teal bg-teal-light text-navy ring-2 ring-teal/40'
                    : 'border-sage-border bg-white text-navy hover:bg-sage-light'
                }`}
              >
                <div className={`p-2 rounded-xl ${urgency === 'flexible' ? 'bg-teal text-white' : 'bg-teal-light text-teal'}`}>
                  <Clock size={20} />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-teal uppercase tracking-wide">
                    Flexible
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    Can schedule within the week
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Date & Time Slot */}
          <div className="ll-card p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  {t('post_request.preferred_date')}
                </label>
                <input
                  type="text"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  placeholder="Today / Tomorrow"
                  className="ll-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  {t('post_request.preferred_time')}
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="ll-input"
                >
                  <option value="Within 2 hours">Within 2 hours (Urgent)</option>
                  <option value="Morning (8 AM - 12 PM)">{t('post_request.morning')}</option>
                  <option value="Afternoon (12 PM - 4 PM)">{t('post_request.afternoon')}</option>
                  <option value="Evening (4 PM - 8 PM)">{t('post_request.evening')}</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                {t('post_request.address')}
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3.5 top-3.5 text-coral" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('post_request.address_placeholder')}
                  className="ll-input pl-10"
                />
              </div>
            </div>

            {/* Budget Range */}
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                {t('post_request.budget_range')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-xs text-gray-500 font-bold">Min ₹</span>
                  <input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    placeholder="300"
                    className="ll-input pl-14"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-xs text-gray-500 font-bold">Max ₹</span>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="1500"
                    className="ll-input pl-14"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="ll-btn-primary w-full shadow-md min-h-[50px] text-sm font-bold"
          >
            {submitting ? t('common.loading') : t('post_request.submit')}
          </button>
        </form>
      )}
    </div>
  );
};
