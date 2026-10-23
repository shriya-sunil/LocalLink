import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://flxnqyosefoxfbtbkphy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const DEV_DEMO_FLAG_KEY = 'locallink_dev_demo_mode';

export function isDevDemoMode(): boolean {
  return localStorage.getItem(DEV_DEMO_FLAG_KEY) === 'true';
}

export function setDevDemoMode(enabled: boolean): void {
  localStorage.setItem(DEV_DEMO_FLAG_KEY, enabled ? 'true' : 'false');
}

/**
 * Returns user-friendly error messages from Supabase Auth & PostgREST errors.
 */
export function getFriendlyErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred. Please try again.';
  if (typeof err === 'string') return err;

  const msg = err.message || '';
  const code = err.code || '';

  // Auth specific
  if (msg.includes('Email not confirmed') || code === 'email_not_confirmed') {
    return 'Your email has not been confirmed yet. Please check your inbox for the confirmation link, or use the dev demo mode.';
  }
  if (msg.includes('Invalid login credentials') || code === 'invalid_credentials') {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (msg.includes('User already registered') || code === 'user_already_exists') {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (msg.includes('Password should be at least')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }

  // Postgres RLS / constraint specific
  if (code === '42501') {
    return 'Access restricted by security policy. Make sure you are signed in to the right account.';
  }
  if (code === '23505') {
    return 'This record already exists in the system.';
  }
  if (code === '23503') {
    return 'Referenced record was not found or was removed.';
  }

  return msg || 'An error occurred while connecting to the database.';
}
