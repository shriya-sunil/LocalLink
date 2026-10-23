alter table public.reports
  add column target_type text not null default 'user'
    check (target_type in ('user', 'booking', 'request')),
  add column target_request_id uuid
    references public.service_requests(id) on delete set null;