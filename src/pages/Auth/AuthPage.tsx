import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Phone, UserCheck, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { signInWithEmail, signUpWithEmail, sendOtp, verifyOtp, signInWithGoogle } from '../../lib/api/auth';
import { isDevDemoMode, setDevDemoMode } from '../../lib/api/supabaseClient';
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher';
import { UserRole } from '../../types';

export const AuthPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser, switchToDemoUser } = useAuth();

  const from = (location.state as any)?.from?.pathname || '/';

  const [mode, setMode] = useState<'signin' | 'signup' | 'phone'>('signin');
  const [role, setRole] = useState<UserRole>('customer');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devDemoEnabled, setDevDemoEnabled] = useState(isDevDemoMode());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        if (!name.trim()) throw new Error('Please enter your full name');
        await signUpWithEmail(name, email, password, role);
      }
      await refreshUser();
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || t('common.error_general'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(phone);
      setOtpSent(true);
      setInfoMessage(t('auth.otp_sent_to', { phone }));
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(phone, otp, role);
      await refreshUser();
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      await refreshUser();
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole: 'customer' | 'provider') => {
    setLoading(true);
    await switchToDemoUser(demoRole);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-sage-light flex flex-col justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Top Header & Language Picker */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-teal text-white flex items-center justify-center font-bold text-lg shadow-sm">
              LL
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-navy leading-tight">LocalLink</h1>
              <p className="text-xs text-gray-500">{t('app.tagline')}</p>
            </div>
          </div>
          <LanguageSwitcher variant="compact" />
        </div>

        {/* Demo Accounts Card (Behind clearly labeled Dev Flag) */}
        <div className="ll-card p-4 mb-4 bg-gradient-to-br from-white to-salmon-light/30 border-salmon/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-coral text-white tracking-wider">
                DEV FLAG
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                {t('auth.demo_accounts')}
              </h2>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-navy">
              <input
                type="checkbox"
                checked={devDemoEnabled}
                onChange={(e) => {
                  setDevDemoEnabled(e.target.checked);
                  setDevDemoMode(e.target.checked);
                }}
                className="w-4 h-4 accent-teal rounded"
              />
              <span className="text-[11px] text-gray-500">Enable</span>
            </label>
          </div>

          {devDemoEnabled ? (
            <>
              <p className="text-xs text-gray-600 mb-3">
                Dev demo mode is active. Instant mock accounts bypass live Supabase database authentication:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('customer')}
                  className="py-2.5 px-3 rounded-xl bg-teal text-white text-xs font-bold text-left hover:bg-teal-hover transition-all flex items-center justify-between shadow-sm"
                >
                  <div>
                    <div className="font-bold">Demo Customer</div>
                    <div className="text-[10px] text-teal-light opacity-90 truncate">Priya Sharma</div>
                  </div>
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('provider')}
                  className="py-2.5 px-3 rounded-xl bg-navy text-white text-xs font-bold text-left hover:bg-navy-hover transition-all flex items-center justify-between shadow-sm border border-white/10"
                >
                  <div>
                    <div className="font-bold flex items-center gap-1">
                      Demo Pro <ShieldCheck size={12} className="text-salmon" />
                    </div>
                    <div className="text-[10px] text-salmon opacity-90 truncate">Ramesh (Electrician)</div>
                  </div>
                  <ArrowRight size={14} />
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-500">
              Live Supabase Auth is active. Enable checkbox above only for offline dev demo testing.
            </p>
          )}
        </div>

        {/* Main Auth Form Container */}
        <div className="ll-card p-6 shadow-soft">
          {/* Tabs */}
          <div className="flex rounded-xl bg-sage-light p-1 mb-5 border border-sage-border">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'signin' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'
              }`}
            >
              {t('auth.sign_in')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'signup' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'
              }`}
            >
              {t('auth.sign_up')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('phone'); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'phone' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'
              }`}
            >
              {t('auth.phone')}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-coral-light border border-coral/30 text-coral text-xs font-medium">
              {error}
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 rounded-xl bg-teal-light border border-teal/30 text-teal-dark text-xs font-medium">
              {infoMessage}
            </div>
          )}

          {/* Phone OTP Mode */}
          {mode === 'phone' ? (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1.5">{t('auth.phone')}</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="ll-input pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1.5">{t('auth.select_role')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('customer')}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-colors ${
                          role === 'customer' ? 'border-teal bg-teal-light text-teal-dark' : 'border-sage-border bg-white text-navy'
                        }`}
                      >
                        {t('auth.role_hire')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('provider')}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-colors ${
                          role === 'provider' ? 'border-navy bg-navy-light text-navy' : 'border-sage-border bg-white text-navy'
                        }`}
                      >
                        {t('auth.role_work')}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="ll-btn-primary w-full"
                  >
                    {loading ? t('common.loading') : t('auth.send_otp')}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1.5">{t('auth.otp')}</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="ll-input text-center text-xl tracking-widest font-bold"
                      required
                    />
                    <p className="text-[11px] text-gray-500 mt-1 text-center">
                      {devDemoEnabled
                        ? <>Demo code: <span className="font-bold text-teal">123456</span></>
                        : 'Enter the verification code sent to your phone.'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="ll-btn-primary w-full"
                  >
                    {loading ? t('common.loading') : t('auth.verify_otp')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-xs text-gray-500 hover:text-navy text-center font-medium"
                  >
                    Change Phone Number
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Email & Password Form */
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1.5">{t('auth.full_name')}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Priya Sharma"
                      className="ll-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1.5">{t('auth.select_role')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('customer')}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-colors ${
                          role === 'customer' ? 'border-teal bg-teal-light text-teal-dark' : 'border-sage-border bg-white text-navy'
                        }`}
                      >
                        {t('auth.role_hire')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('provider')}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-colors ${
                          role === 'provider' ? 'border-navy bg-navy-light text-navy' : 'border-sage-border bg-white text-navy'
                        }`}
                      >
                        {t('auth.role_work')}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">{t('auth.email')}</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="ll-input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">{t('auth.password')}</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ll-input pl-10"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ll-btn-primary w-full mt-2"
              >
                {loading ? t('common.loading') : mode === 'signin' ? t('auth.sign_in') : t('auth.sign_up')}
              </button>
            </form>
          )}

          {/* Social Sign In */}
          <div className="mt-5">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-sage-border"></div>
              <span className="flex-shrink mx-3 text-xs text-gray-400 font-semibold">{t('auth.or')}</span>
              <div className="flex-grow border-t border-sage-border"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full mt-2 min-h-[48px] rounded-xl border border-sage-border bg-white text-navy text-xs font-bold hover:bg-sage-light flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t('auth.google_sign_in')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
