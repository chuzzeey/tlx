begin;

create table if not exists public.product_categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 80),
  tagline text not null default '' check (char_length(tagline) <= 160),
  description text not null default '' check (char_length(description) <= 1000),
  image text not null,
  is_published boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.product_categories (slug, name, tagline, description, image, position)
values
  ('jackets', 'Jackets', 'Layers for every day', 'Everyday outerwear, from statement jackets to relaxed bombers.', '/images/products/stussy-jacket.png', 1),
  ('apparel', 'T-Shirts', 'Casual essentials', 'Distinctive everyday clothing from independent labels, made for easy layering and self-expression.', '/images/products/chaotic-club-spooky.png', 2),
  ('shoes', 'Shoes', 'Made to move', 'Comfortable everyday footwear with considered materials and distinctive details.', '/images/products/sneakers.png', 3),
  ('bags', 'Bags', 'Carry your day', 'Practical carryalls with thoughtful shapes and details for everyday use.', '/images/products/pearl-seashell-bag.png', 4),
  ('accessories', 'Accessories', 'The finishing details', 'Useful finishing pieces designed to bring character to everyday outfits.', '/images/products/mens-golf-cap.png', 5)
on conflict (slug) do nothing;

alter table public.product_categories enable row level security;

drop policy if exists "Public can read published product categories" on public.product_categories;
create policy "Public can read published product categories"
  on public.product_categories for select to anon, authenticated
  using (is_published);

revoke insert, update, delete on public.product_categories from anon, authenticated;
grant select on public.product_categories to anon, authenticated;
grant all privileges on table public.product_categories to service_role;

create table if not exists public.product_category_visibility (
  slug text primary key references public.product_categories(slug) on update cascade on delete cascade,
  is_published boolean not null,
  updated_at timestamptz not null default now()
);

alter table public.product_category_visibility enable row level security;

drop policy if exists "Public can read product category visibility" on public.product_category_visibility;
create policy "Public can read product category visibility"
  on public.product_category_visibility for select to anon, authenticated
  using (true);

revoke insert, update, delete on public.product_category_visibility from anon, authenticated;
grant select on public.product_category_visibility to anon, authenticated;
grant all privileges on table public.product_category_visibility to service_role;

insert into public.product_category_visibility (slug, is_published, updated_at)
select slug, is_published, updated_at
from public.product_categories
on conflict (slug) do update
set is_published = excluded.is_published,
    updated_at = excluded.updated_at;

create or replace function public.sync_product_category_visibility()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.product_category_visibility (slug, is_published, updated_at)
  values (new.slug, new.is_published, new.updated_at)
  on conflict (slug) do update
  set is_published = excluded.is_published,
      updated_at = excluded.updated_at
  where product_category_visibility.is_published is distinct from excluded.is_published;
  return new;
end;
$$;

drop trigger if exists product_category_visibility_insert on public.product_categories;
create trigger product_category_visibility_insert
  after insert on public.product_categories
  for each row execute function public.sync_product_category_visibility();

drop trigger if exists product_category_visibility_update on public.product_categories;
create trigger product_category_visibility_update
  after update of is_published on public.product_categories
  for each row execute function public.sync_product_category_visibility();

drop policy if exists "Public can read published products" on public.products;
create policy "Public can read published products"
  on public.products for select to anon, authenticated
  using (
    is_published
    and exists (
      select 1
      from public.product_categories
      where product_categories.slug = products.category
        and product_categories.is_published
    )
  );

drop policy if exists "Public can read approved reviews for published products" on public.reviews;
create policy "Public can read approved reviews for published products"
  on public.reviews for select to anon, authenticated
  using (
    is_approved
    and exists (
      select 1
      from public.products
      join public.product_categories on product_categories.slug = products.category
      where products.id = reviews.product_id
        and products.is_published
        and product_categories.is_published
    )
  );

create or replace view public.store_products
with (security_invoker = true)
as
select
  p.id,
  p.name,
  p.category,
  p.price,
  p.compare_at,
  p.gallery,
  p.gallery_alt,
  p.description,
  p.story,
  p.materials,
  p.dimensions,
  p.care,
  case when p.is_in_stock then p.stock else 0 end as stock,
  p.is_in_stock,
  p.badge,
  p.colors,
  p.sizes,
  p.featured,
  p.is_published,
  p.created_at,
  coalesce(round(avg(r.rating)::numeric, 1), 0) as rating,
  count(r.id)::integer as review_count,
  p.main_image_path
from public.products p
left join public.reviews r
  on r.product_id = p.id and r.is_approved
where p.is_published
  and exists (
    select 1
    from public.product_categories c
    where c.slug = p.category and c.is_published
  )
group by p.id;

grant select on public.store_products to anon, authenticated;

drop policy if exists "Public can resolve published product slugs" on public.product_slug_redirects;
create policy "Public can resolve published product slugs"
  on public.product_slug_redirects for select to anon, authenticated
  using (
    exists (
      select 1
      from public.products
      join public.product_categories on product_categories.slug = products.category
      where products.id = product_slug_redirects.product_id
        and products.is_published
        and product_categories.is_published
    )
  );

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise exception 'Supabase Realtime publication is missing.';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'product_categories'
  ) then
    execute 'alter publication supabase_realtime add table public.product_categories';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'product_category_visibility'
  ) then
    execute 'alter publication supabase_realtime add table public.product_category_visibility';
  end if;
end
$$;

commit;
