begin;

create table if not exists public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null default '' check (char_length(first_name) <= 80),
  last_name text not null default '' check (char_length(last_name) <= 80),
  display_name text not null default '' check (char_length(display_name) <= 100),
  phone_number text not null default '' check (char_length(phone_number) <= 32),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 2048),
  avatar_path text check (avatar_path is null or char_length(avatar_path) <= 256),
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (avatar_url is null or avatar_path is null)
);

create or replace function public.set_admin_profile_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admin_profiles_set_updated_at on public.admin_profiles;
create trigger admin_profiles_set_updated_at
  before update on public.admin_profiles
  for each row execute function public.set_admin_profile_updated_at();

alter table public.admin_profiles enable row level security;

drop policy if exists "Users can read their own admin profile" on public.admin_profiles;
create policy "Users can read their own admin profile"
  on public.admin_profiles for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own admin profile" on public.admin_profiles;
create policy "Users can create their own admin profile"
  on public.admin_profiles for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own admin profile" on public.admin_profiles;
create policy "Users can update their own admin profile"
  on public.admin_profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.admin_profiles from anon, authenticated;
grant select, insert, update on public.admin_profiles to authenticated;
grant all privileges on public.admin_profiles to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tlx-admin-avatars',
  'tlx-admin-avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can view their own admin avatars" on storage.objects;
create policy "Users can view their own admin avatars"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tlx-admin-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can upload their own admin avatars" on storage.objects;
create policy "Users can upload their own admin avatars"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tlx-admin-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own admin avatars" on storage.objects;
create policy "Users can update their own admin avatars"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'tlx-admin-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'tlx-admin-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own admin avatars" on storage.objects;
create policy "Users can delete their own admin avatars"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'tlx-admin-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
