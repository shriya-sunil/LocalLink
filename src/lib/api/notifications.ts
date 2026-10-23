import { NotificationItem } from '../../types';
import { MOCK_NOTIFICATIONS } from '../mockData';
import { isDevDemoMode, supabase } from './supabaseClient';

const NOTIFS_STORAGE_KEY = 'locallink_notifs_cache';

function getStoredNotifications(): NotificationItem[] {
  const cached = localStorage.getItem(NOTIFS_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return [...MOCK_NOTIFICATIONS];
}

function saveStoredNotifications(list: NotificationItem[]) {
  localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(list));
}

export async function getNotifications(): Promise<NotificationItem[]> {
  if (isDevDemoMode()) return getStoredNotifications();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, title, body, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((notification) => ({
    id: notification.id,
    userId: notification.user_id,
    title: notification.title,
    message: notification.body || '',
    type: 'system',
    isRead: notification.is_read,
    createdAt: notification.created_at,
  }));
}

export async function markNotificationAsRead(id: string): Promise<void> {
  if (!isDevDemoMode()) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    return;
  }

  const list = getStoredNotifications();
  const idx = list.findIndex((n) => n.id === id);
  if (idx >= 0) {
    list[idx].isRead = true;
    saveStoredNotifications(list);
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  if (!isDevDemoMode()) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    if (error) throw error;
    return;
  }

  const list = getStoredNotifications();
  list.forEach((n) => {
    n.isRead = true;
  });
  saveStoredNotifications(list);
}
