create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  sku text not null unique,
  name text not null,
  category text not null,
  price numeric(10, 2) not null check (price >= 0),
  compare_at numeric(10, 2) check (compare_at is null or compare_at >= price),
  image text not null,
  image_alt text not null default '',
  gallery text[] not null default '{}',
  gallery_alt text[] not null default '{}',
  description text not null default '',
  story text not null default '',
  materials text not null default '',
  dimensions text not null default '',
  care text not null default '',
  stock integer not null default 0 check (stock >= 0),
  badge text check (badge is null or badge in ('New', 'Bestseller', 'Low stock', 'Sale')),
  colors jsonb not null default '[]'::jsonb check (jsonb_typeof(colors) = 'array'),
  sizes text[] not null default '{}',
  featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on update cascade on delete cascade,
  author text not null,
  location text not null default '',
  rating smallint not null check (rating between 1 and 5),
  title text not null,
  body text not null,
  is_verified boolean not null default false,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.product_slug_redirects (
  old_slug text primary key,
  product_id text not null references public.products(id) on update cascade on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists products_published_category_idx
  on public.products (is_published, category);
create index if not exists products_stock_idx
  on public.products (stock);
create index if not exists reviews_approved_product_idx
  on public.reviews (product_id, is_approved);

alter table public.products enable row level security;
alter table public.reviews enable row level security;
alter table public.product_slug_redirects enable row level security;

drop policy if exists "Public can read published products" on public.products;
create policy "Public can read published products"
  on public.products for select to anon, authenticated
  using (is_published);

drop policy if exists "Public can read approved reviews for published products" on public.reviews;
create policy "Public can read approved reviews for published products"
  on public.reviews for select to anon, authenticated
  using (
    is_approved
    and exists (
      select 1 from public.products
      where products.id = reviews.product_id and products.is_published
    )
  );

drop policy if exists "Public can resolve published product slugs" on public.product_slug_redirects;
create policy "Public can resolve published product slugs"
  on public.product_slug_redirects for select to anon, authenticated
  using (
    exists (
      select 1 from public.products
      where products.id = product_slug_redirects.product_id and products.is_published
    )
  );

create or replace function public.record_product_slug_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.id is distinct from new.id then
    insert into public.product_slug_redirects (old_slug, product_id)
    values (old.id, new.id)
    on conflict (old_slug) do update set product_id = excluded.product_id;
  end if;
  return new;
end;
$$;

drop trigger if exists product_slug_change_redirect on public.products;
create trigger product_slug_change_redirect
  after update of id on public.products
  for each row execute function public.record_product_slug_change();

revoke insert, update, delete on public.products, public.reviews, public.product_slug_redirects from anon, authenticated;
grant select on public.products, public.reviews, public.product_slug_redirects to anon, authenticated;

create or replace view public.store_products
with (security_invoker = true)
as
select
  p.id,
  p.sku,
  p.name,
  p.category,
  p.price,
  p.compare_at,
  p.image,
  p.image_alt,
  p.gallery,
  p.gallery_alt,
  p.description,
  p.story,
  p.materials,
  p.dimensions,
  p.care,
  p.stock,
  p.badge,
  p.colors,
  p.sizes,
  p.featured,
  p.is_published,
  p.created_at,
  coalesce(round(avg(r.rating)::numeric, 1), 0) as rating,
  count(r.id)::integer as review_count
from public.products p
left join public.reviews r
  on r.product_id = p.id and r.is_approved
where p.is_published
group by p.id;

grant select on public.store_products to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tlx-products',
  'tlx-products',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'tlx-products');

drop policy if exists "Product image writes are server-only" on storage.objects;
create policy "Product image writes are server-only"
  on storage.objects for all to anon, authenticated
  using (false)
  with check (false);
