begin;

alter table public.products
  add column if not exists manual_rating smallint,
  add column if not exists manual_review_count integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_manual_rating_range'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_manual_rating_range
      check (manual_rating is null or manual_rating between 1 and 5);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_manual_review_count_range'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_manual_review_count_range
      check (manual_review_count is null or manual_review_count between 0 and 2147483647);
  end if;
end
$$;

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
  coalesce(p.manual_rating::numeric, round(avg(r.rating)::numeric, 1), 0) as rating,
  coalesce(p.manual_review_count, count(r.id)::integer) as review_count,
  p.main_image_path,
  p.manual_review_count
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

commit;
