alter table public.provider_profiles
  add column headline text not null default '',
  add column service_radius_km numeric not null default 10;

alter table public.service_requests
  add column preferred_time text;

alter table public.messages
  add column sender_role text not null default 'customer'
    check (sender_role in ('customer', 'provider'));