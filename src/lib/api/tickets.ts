import { ReportTicket, SupportTicket } from '../../types';
import { isDevDemoMode, supabase } from './supabaseClient';

const REPORTS_STORAGE_KEY = 'locallink_reports_cache';
const SUPPORT_STORAGE_KEY = 'locallink_support_cache';

export async function submitReport(data: Omit<ReportTicket, 'id' | 'createdAt'>): Promise<ReportTicket> {
  if (!isDevDemoMode()) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user || user.id !== data.reporterId) throw new Error('Sign in before submitting a report.');

    const { data: row, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        target_type: data.targetType,
        target_user_id: data.targetType === 'user' ? data.targetId : null,
        booking_id: data.targetType === 'booking' ? data.targetId : null,
        target_request_id: data.targetType === 'request' ? data.targetId : null,
        reason: data.reason,
        details: data.details,
      })
      .select('id, reporter_id, target_type, target_user_id, booking_id, target_request_id, reason, details, created_at')
      .single();
    if (error) throw error;

    return {
      id: row.id,
      reporterId: row.reporter_id,
      targetType: row.target_type,
      targetId: row.target_user_id || row.booking_id || row.target_request_id,
      targetName: data.targetName,
      reason: row.reason,
      details: row.details || '',
      createdAt: row.created_at,
    };
  }

  await new Promise((r) => setTimeout(r, 200));
  const cached = localStorage.getItem(REPORTS_STORAGE_KEY);
  const list: ReportTicket[] = cached ? JSON.parse(cached) : [];

  const ticket: ReportTicket = {
    ...data,
    id: 'rep_' + Date.now(),
    createdAt: new Date().toISOString(),
  };

  list.unshift(ticket);
  localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(list));
  return ticket;
}

export async function submitSupportTicket(data: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>): Promise<SupportTicket> {
  if (!isDevDemoMode()) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user || user.id !== data.userId) throw new Error('Sign in before submitting a support ticket.');

    const { data: row, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        topic: data.topic,
        message: data.message,
        screenshot_url: data.screenshotUrl || null,
        status: 'open',
      })
      .select('id, user_id, topic, message, screenshot_url, status, created_at')
      .single();
    if (error) throw error;

    return {
      id: row.id,
      userId: row.user_id,
      topic: row.topic,
      message: row.message,
      screenshotUrl: row.screenshot_url || undefined,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  await new Promise((r) => setTimeout(r, 200));
  const cached = localStorage.getItem(SUPPORT_STORAGE_KEY);
  const list: SupportTicket[] = cached ? JSON.parse(cached) : [];

  const ticket: SupportTicket = {
    ...data,
    id: 'sup_' + Date.now(),
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  list.unshift(ticket);
  localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(list));
  return ticket;
}
