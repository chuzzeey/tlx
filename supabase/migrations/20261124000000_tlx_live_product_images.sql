begin;

alter table public.products
  add column if not exists main_image_path text;

update public.products
set main_image_path = id || '/main'
where main_image_path is null;

alter table public.products
  alter column main_image_path set not null;

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
group by p.id;

grant select on public.store_products to anon, authenticated;

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
      and tablename = 'products'
  ) then
    execute 'alter publication supabase_realtime add table public.products';
  end if;
end
$$;

commit;
