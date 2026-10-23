import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Briefcase,
  IndianRupee,
  Upload,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getProviderById, saveProviderProfile, submitIdVerification } from '../../lib/api/providers';
import { ProviderProfile } from '../../types';
import { ImageUploader } from '../../components/common/ImageUploader';

const ALL_SKILLS = [
  'electrician',
  'plumber',
  'carpenter',
  'cleaner',
  'cook',
  'delivery',
  'repair',
  'painter',
  'gardener',
  'pest_control',
];

export const ProviderOnboardingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'id'>('profile');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['electrician']);
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(5);
  const [pricingType, setPricingType] = useState<'hourly' | 'visit'>('hourly');
  const [hourlyRate, setHourlyRate] = useState<number>(350);
  const [workingHours, setWorkingHours] = useState('8:00 AM - 8:00 PM');
  const [baseLocation, setBaseLocation] = useState('Indiranagar, Bengaluru');
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(8);
  const [portfolio, setPortfolio] = useState<string[]>([]);

  // ID Verification Placeholder state
  const [docType, setDocType] = useState('Aadhaar Card');
  const [docNumber, setDocNumber] = useState('');
  const [idVerified, setIdVerified] = useState(false);
  const [idSubmitting, setIdSubmitting] = useState(false);
  const [idFeedback, setIdFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitial() {
      if (!user) return;
      const existing = await getProviderById(user.id);
      if (existing) {
        setHeadline(existing.headline || '');
        setBio(existing.bio || '');
        if (existing.skills && existing.skills.length > 0) setSelectedSkills(existing.skills);
        setYearsOfExperience(existing.yearsOfExperience || 3);
        setPricingType(existing.pricingType || 'hourly');
        setHourlyRate(existing.hourlyRate || 350);
        setWorkingHours(existing.workingHours || '8:00 AM - 8:00 PM');
        setBaseLocation(existing.baseLocation || 'Bengaluru');
        setServiceRadiusKm(existing.serviceRadiusKm || 8);
        setPortfolio(existing.portfolio || []);
        setIdVerified(existing.idVerificationStatus === 'verified');
        setDocType(existing.idDocumentType || 'Aadhaar Card');
        setDocNumber(existing.idDocumentNumber || '');
      }
    }
    loadInitial();
  }, [user]);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      if (selectedSkills.length > 1) {
        setSelectedSkills(selectedSkills.filter((s) => s !== skill));
      }
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);

    try {
      await saveProviderProfile({
        userId: user?.id || 'usr_current',
        name: user?.name || 'Local Pro',
        headline,
        bio,
        skills: selectedSkills,
        yearsOfExperience,
        pricingType,
        hourlyRate,
        workingHours,
        baseLocation,
        serviceRadiusKm,
        portfolio,
        idVerificationStatus: idVerified ? 'verified' : 'pending',
        isVerified: idVerified,
      });

      // Ensure active role is provider
      await setRole('provider');
      setSuccessMsg(t('onboarding.profile_saved'));
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateIdVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber) return;
    setIdSubmitting(true);
    setIdFeedback(null);

    try {
      const res = await submitIdVerification(user?.id || 'usr_current', docType, docNumber);
      if (res.success) {
        setIdVerified(true);
        setIdFeedback('Verified successfully! The green verified pro badge is now active on your profile.');
      }
    } catch (err: any) {
      setIdFeedback(err?.message || 'Verification could not be processed.');
    } finally {
      setIdSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-navy leading-tight">
          {t('onboarding.title')}
        </h1>
        <p className="text-xs text-gray-600 mt-0.5">
          {t('onboarding.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-sage-light p-1 border border-sage-border">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'profile' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'
          }`}
        >
          {t('onboarding.step_basics')} & Trade
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('id')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'id' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'
          }`}
        >
          <ShieldCheck size={14} className={idVerified ? 'text-teal' : 'text-gray-400'} />
          <span>{t('onboarding.step_id')}</span>
          {idVerified && <CheckCircle2 size={12} className="text-teal" />}
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-teal-light border border-teal text-teal-dark text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab 1: Profile & Trade Details */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Headline & Bio */}
          <div className="ll-card p-4 space-y-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
              1. {t('onboarding.step_basics')}
            </h2>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                {t('onboarding.headline')}
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={t('onboarding.headline_placeholder')}
                className="ll-input"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                {t('onboarding.bio')}
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your specializations, background, tools used, and safety practices..."
                className="ll-input resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                  className="ll-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  {t('onboarding.working_hours')}
                </label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="e.g. 8 AM - 8 PM"
                  className="ll-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  {t('onboarding.base_location')}
                </label>
                <input
                  type="text"
                  value={baseLocation}
                  onChange={(e) => setBaseLocation(e.target.value)}
                  placeholder="Indiranagar, Bengaluru"
                  className="ll-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  {t('onboarding.service_radius')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="2"
                    max="30"
                    value={serviceRadiusKm}
                    onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                    className="w-full accent-teal"
                  />
                  <span className="text-xs font-bold text-navy w-12">{serviceRadiusKm} km</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trade Skills & Pricing */}
          <div className="ll-card p-4 space-y-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
              2. {t('onboarding.skills_label')}
            </h2>

            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-teal text-white shadow-sm'
                        : 'bg-sage text-navy hover:bg-sage-hover'
                    }`}
                  >
                    {t(`categories.${skill}`, { defaultValue: skill }).split('(')[0]}
                  </button>
                );
              })}
            </div>

            {/* Pricing Model */}
            <div className="pt-2 border-t border-sage-border/60">
              <label className="block text-xs font-bold text-navy mb-1.5">
                {t('onboarding.pricing_type')}
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setPricingType('hourly')}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-colors ${
                    pricingType === 'hourly'
                      ? 'border-teal bg-teal-light text-teal-dark font-extrabold ring-1 ring-teal'
                      : 'border-sage-border bg-white text-navy'
                  }`}
                >
                  Hourly Rate (₹/hr)
                </button>
                <button
                  type="button"
                  onClick={() => setPricingType('visit')}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-colors ${
                    pricingType === 'visit'
                      ? 'border-teal bg-teal-light text-teal-dark font-extrabold ring-1 ring-teal'
                      : 'border-sage-border bg-white text-navy'
                  }`}
                >
                  Per Visit / Inspection (₹)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  {t('onboarding.rate_amount')}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-gray-500 font-bold">₹</span>
                  <input
                    type="number"
                    step="50"
                    min="100"
                    max="10000"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="ll-input pl-8"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Past Work Photos */}
          <div className="ll-card p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
              3. {t('onboarding.portfolio_title')}
            </h2>
            <ImageUploader
              images={portfolio}
              onChange={setPortfolio}
              maxImages={6}
              hint="Upload clear photos of previous electrical panels, carpentry furniture, plumbing fittings, or cleanings."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="ll-btn-primary w-full shadow-md text-sm font-bold min-h-[50px]"
          >
            {loading ? t('common.loading') : t('onboarding.save_changes')}
          </button>
        </form>
      )}

      {/* Tab 2: ID Verification (Third-party Integration Placeholder) */}
      {activeTab === 'id' && (
        <div className="space-y-4">
          <div className="ll-card p-5 space-y-4 border-teal/40">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-light text-teal flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy">
                  {t('onboarding.id_verification_title')}
                </h2>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  {t('onboarding.id_verification_desc')}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sage-light text-xs text-gray-600 border border-sage-border">
              <strong>Notice:</strong> {t('onboarding.id_placeholder_notice')}
            </div>

            {idVerified ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
                <h3 className="font-extrabold text-navy text-sm">Identity Verified</h3>
                <p className="text-xs text-gray-600">
                  Document: {docType} ({docNumber || 'XXXX-XXXX-9482'})
                </p>
                <span className="inline-block px-3 py-1 rounded-full bg-teal text-white text-xs font-bold">
                  Verified Pro Active
                </span>
              </div>
            ) : (
              <form onSubmit={handleSimulateIdVerification} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1.5">
                    {t('onboarding.id_type')}
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="ll-input"
                  >
                    <option value="Aadhaar Card">Aadhaar Card (UIDAI)</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID (EPIC)</option>
                    <option value="Trade Certification">Government Trade ITI Certification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1.5">
                    {t('onboarding.id_number')}
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="e.g. 5482 1928 3928 or KA-01-2018..."
                    className="ll-input"
                    required
                  />
                </div>

                <div className="p-4 rounded-2xl border-2 border-dashed border-sage-hover text-center space-y-2 bg-sage-light/30">
                  <Upload size={24} className="text-teal mx-auto" />
                  <span className="text-xs font-bold block text-navy">{t('onboarding.id_upload')}</span>
                  <span className="text-[11px] text-gray-500 block">PNG, JPG, PDF up to 5MB</span>
                  <button
                    type="button"
                    onClick={() => setDocNumber('XXXX-XXXX-' + Math.floor(1000 + Math.random() * 9000))}
                    className="text-xs text-teal font-bold hover:underline"
                  >
                    Use Sample ID for demo verification
                  </button>
                </div>

                {idFeedback && (
                  <div className="p-3 rounded-xl bg-teal-light text-teal-dark text-xs font-semibold">
                    {idFeedback}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={idSubmitting || !docNumber}
                  className="ll-btn-primary w-full min-h-[48px]"
                >
                  {idSubmitting ? t('common.loading') : t('onboarding.submit_for_review')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
