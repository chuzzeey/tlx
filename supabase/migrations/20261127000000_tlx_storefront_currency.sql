begin;

create table if not exists public.storefront_settings (
  id smallint primary key default 1 check (id = 1),
  currency text not null default 'NGN'
    check (currency in ('USD', 'EUR', 'JPY', 'CNY', 'NGN', 'GHS'))
);

insert into public.storefront_settings (id, currency)
values (1, 'NGN')
on conflict (id) do nothing;

alter table public.storefront_settings enable row level security;

drop policy if exists "Public can read storefront currency" on public.storefront_settings;
create policy "Public can read storefront currency"
  on public.storefront_settings for select to anon, authenticated
  using (true);

revoke all on public.storefront_settings from public, anon, authenticated;
grant select on public.storefront_settings to anon, authenticated;
grant all privileges on public.storefront_settings to service_role;

commit;
