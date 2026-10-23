import { NotificationItem } from '../../types';
import { MOCK_NOTIFICATIONS } from '../mockData';

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
  // TODO: Connect supabase.from('notifications').select('*').order('created_at', { ascending: false })
  await new Promise((r) => setTimeout(r, 100));
  return getStoredNotifications();
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const list = getStoredNotifications();
  const idx = list.findIndex((n) => n.id === id);
  if (idx >= 0) {
    list[idx].isRead = true;
    saveStoredNotifications(list);
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const list = getStoredNotifications();
  list.forEach((n) => {
    n.isRead = true;
  });
  saveStoredNotifications(list);
}
