import { supabase, isDevDemoMode, setDevDemoMode, getFriendlyErrorMessage } from './supabaseClient';
import { User, UserRole } from '../../types';
import { DEMO_CUSTOMER_USER, DEMO_PRO_USER } from '../mockData';

const ACTIVE_ROLE_KEY = 'locallink_active_role';

export async function getCurrentUser(): Promise<User | null> {
  // 1. Check if Dev Demo Flag is active and user is using a mock demo profile
  if (isDevDemoMode()) {
    const demoRole = localStorage.getItem(ACTIVE_ROLE_KEY) as UserRole || 'customer';
    return demoRole === 'provider' ? DEMO_PRO_USER : DEMO_CUSTOMER_USER;
  }

  // 2. Real Supabase Session lookup
  try {
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) throw sessionErr;

    if (!session?.user) {
      return null;
    }

    const authUser = session.user;

    // Load profile from "profiles" table
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    // Check if user has an existing provider profile
    const { data: proProfile } = await supabase
      .from('provider_profiles')
      .select('user_id')
      .eq('user_id', authUser.id)
      .maybeSingle();

    const isPro = Boolean(proProfile);
    const storedRole = (localStorage.getItem(ACTIVE_ROLE_KEY) as UserRole) || (isPro ? 'provider' : 'customer');

    const user: User = {
      id: authUser.id,
      email: authUser.email,
      phone: profile?.phone || authUser.phone || '',
      name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Neighbor',
      avatar: profile?.avatar_url || authUser.user_metadata?.avatar_url || '',
      activeRole: storedRole,
      isProRegistered: isPro,
      createdAt: profile?.created_at || authUser.created_at,
    };

    return user;
  } catch (err) {
    console.warn('Failed to retrieve Supabase session:', err);
    return null;
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  // If in dev demo mode, allow mock credentials
  if (isDevDemoMode()) {
    const isPro = email.toLowerCase().includes('pro') || email.toLowerCase().includes('ramesh');
    const user = isPro ? DEMO_PRO_USER : DEMO_CUSTOMER_USER;
    localStorage.setItem(ACTIVE_ROLE_KEY, user.activeRole);
    return user;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }

  if (!data.user) {
    throw new Error('Authentication succeeded but no user data was returned.');
  }

  // Fetch updated profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  const { data: proProfile } = await supabase
    .from('provider_profiles')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();

  const isPro = Boolean(proProfile);
  const activeRole: UserRole = isPro ? 'provider' : 'customer';
  localStorage.setItem(ACTIVE_ROLE_KEY, activeRole);

  return {
    id: data.user.id,
    email: data.user.email,
    phone: profile?.phone || '',
    name: profile?.full_name || data.user.user_metadata?.full_name || email.split('@')[0],
    avatar: profile?.avatar_url || '',
    activeRole,
    isProRegistered: isPro,
    createdAt: data.user.created_at,
  };
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string,
  role: UserRole
): Promise<User> {
  if (isDevDemoMode()) {
    const user: User = {
      ...DEMO_CUSTOMER_USER,
      id: 'usr_' + Date.now(),
      name,
      email,
      activeRole: role,
      isProRegistered: role === 'provider',
    };
    return user;
  }

  // Rule: "A profile row is created automatically on sign-up. Update it afterward (full_name, phone, language)."
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: name.trim(),
      },
    },
  });

  if (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }

  if (!data.user) {
    throw new Error('Sign-up succeeded but no user data was returned.');
  }

  const userId = data.user.id;

  // Attempt to update profile row if session exists or when row is ready
  try {
    await supabase
      .from('profiles')
      .update({
        full_name: name.trim(),
        language: localStorage.getItem('i18nextLng') || 'en',
      })
      .eq('id', userId);
  } catch (profErr) {
    console.warn('Profile post-update notice:', profErr);
  }

  localStorage.setItem(ACTIVE_ROLE_KEY, role);

  return {
    id: userId,
    email: data.user.email,
    name: name.trim(),
    activeRole: role,
    isProRegistered: role === 'provider',
    createdAt: data.user.created_at,
  };
}

export async function updateProfile(updates: {
  fullName?: string;
  phone?: string;
  language?: string;
  avatarUrl?: string;
}): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const payload: Record<string, any> = {};
  if (updates.fullName !== undefined) payload.full_name = updates.fullName;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.language !== undefined) payload.language = updates.language;
  if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', session.user.id);

  if (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
}

export async function switchUserRole(role: UserRole): Promise<User> {
  localStorage.setItem(ACTIVE_ROLE_KEY, role);
  const current = await getCurrentUser();
  if (!current) throw new Error('No user is currently signed in');
  return {
    ...current,
    activeRole: role,
  };
}

export async function switchDemoUser(type: 'customer' | 'provider'): Promise<User> {
  setDevDemoMode(true);
  localStorage.setItem(ACTIVE_ROLE_KEY, type);
  return type === 'customer' ? DEMO_CUSTOMER_USER : DEMO_PRO_USER;
}

export async function logout(): Promise<void> {
  localStorage.removeItem(ACTIVE_ROLE_KEY);
  if (isDevDemoMode()) {
    setDevDemoMode(false);
  }
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Sign out error:', err);
  }
}

export async function sendOtp(phone: string): Promise<boolean> {
  if (isDevDemoMode()) return true;
  const { error } = await supabase.auth.signInWithOtp({
    phone: phone.trim(),
  });
  if (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
  return true;
}

export async function verifyOtp(phone: string, token: string, role: UserRole = 'customer'): Promise<User> {
  if (isDevDemoMode() && token === '123456') {
    const user = role === 'provider' ? DEMO_PRO_USER : DEMO_CUSTOMER_USER;
    localStorage.setItem(ACTIVE_ROLE_KEY, role);
    return user;
  }

  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone.trim(),
    token: token.trim(),
    type: 'sms',
  });

  if (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }

  if (!data.user) {
    throw new Error('OTP verification succeeded but no user data was returned.');
  }

  localStorage.setItem(ACTIVE_ROLE_KEY, role);

  return {
    id: data.user.id,
    phone: data.user.phone,
    name: data.user.user_metadata?.full_name || 'Neighbor',
    activeRole: role,
    isProRegistered: role === 'provider',
    createdAt: data.user.created_at,
  };
}

export async function signInWithGoogle(): Promise<User> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }

  // OAuth redirects browser to Google
  return DEMO_CUSTOMER_USER;
}
