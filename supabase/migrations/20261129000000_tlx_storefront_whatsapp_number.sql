begin;

alter table public.storefront_settings
  add column if not exists whatsapp_country text not null default 'NG'
    check (whatsapp_country ~ '^[A-Z]{2}$'),
  add column if not exists whatsapp_phone text not null default '+2348029041081'
    check (whatsapp_phone ~ '^\+[1-9][0-9]{7,14}$');

commit;
