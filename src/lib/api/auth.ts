import { supabase, isDevDemoMode, setDevDemoMode, getFriendlyErrorMessage } from './supabaseClient';
import { User, UserRole } from '../../types';
import { DEMO_CUSTOMER_USER, DEMO_PRO_USER } from '../mockData';

const ACTIVE_ROLE_KEY = 'locallink_active_role';

function isDemoEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized === DEMO_CUSTOMER_USER.email.toLowerCase() || normalized === DEMO_PRO_USER.email.toLowerCase();
}

function isDemoPhone(phone: string): boolean {
  const normalized = phone.replace(/\s+/g, '').toLowerCase();
  return normalized === DEMO_CUSTOMER_USER.phone.replace(/\s+/g, '').toLowerCase() || normalized === DEMO_PRO_USER.phone.replace(/\s+/g, '').toLowerCase();
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) throw sessionErr;

    if (session?.user) {
      const authUser = session.user;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const { data: proProfile } = await supabase
        .from('provider_profiles')
        .select('user_id')
        .eq('user_id', authUser.id)
        .maybeSingle();

      const isPro = Boolean(proProfile);
      const storedRole = (localStorage.getItem(ACTIVE_ROLE_KEY) as UserRole) || (isPro ? 'provider' : 'customer');

      return {
        id: authUser.id,
        email: authUser.email,
        phone: profile?.phone || authUser.phone || '',
        name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Neighbor',
        avatar: profile?.avatar_url || authUser.user_metadata?.avatar_url || '',
        activeRole: storedRole,
        isProRegistered: isPro,
        createdAt: profile?.created_at || authUser.created_at,
      };
    }
  } catch (err) {
    console.warn('Failed to retrieve Supabase session:', err);
  }

  if (isDevDemoMode()) {
    const demoRole = localStorage.getItem(ACTIVE_ROLE_KEY) as UserRole || 'customer';
    return demoRole === 'provider' ? DEMO_PRO_USER : DEMO_CUSTOMER_USER;
  }

  return null;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const normalizedEmail = email.trim();

  if (isDevDemoMode() && isDemoEmail(normalizedEmail)) {
    const isPro = normalizedEmail.toLowerCase() === DEMO_PRO_USER.email.toLowerCase();
    const user = isPro ? DEMO_PRO_USER : DEMO_CUSTOMER_USER;
    localStorage.setItem(ACTIVE_ROLE_KEY, user.activeRole);
    return user;
  }

  setDevDemoMode(false);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
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
  if (isDevDemoMode() && isDemoEmail(email)) {
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

  setDevDemoMode(false);

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
  if (isDevDemoMode() && isDemoPhone(phone)) return true;
  setDevDemoMode(false);
  const { error } = await supabase.auth.signInWithOtp({
    phone: phone.trim(),
  });
  if (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
  return true;
}

export async function verifyOtp(phone: string, token: string, role: UserRole = 'customer'): Promise<User> {
  if (isDevDemoMode() && isDemoPhone(phone) && token === '123456') {
    const user = role === 'provider' ? DEMO_PRO_USER : DEMO_CUSTOMER_USER;
    localStorage.setItem(ACTIVE_ROLE_KEY, role);
    return user;
  }

  setDevDemoMode(false);

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
  setDevDemoMode(false);
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
