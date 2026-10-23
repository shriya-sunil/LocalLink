import { ReportTicket, SupportTicket } from '../../types';

const REPORTS_STORAGE_KEY = 'locallink_reports_cache';
const SUPPORT_STORAGE_KEY = 'locallink_support_cache';

export async function submitReport(data: Omit<ReportTicket, 'id' | 'createdAt'>): Promise<ReportTicket> {
  // TODO: Connect supabase.from('reports').insert(...)
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
  // TODO: Connect supabase.from('support_tickets').insert(...)
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
