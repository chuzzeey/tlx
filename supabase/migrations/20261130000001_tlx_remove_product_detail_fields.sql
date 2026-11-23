begin;

drop view if exists public.store_products;

alter table public.products
  drop column if exists story,
  drop column if exists materials,
  drop column if exists dimensions,
  drop column if exists care,
  drop column if exists description,
  drop column if exists colors;

create view public.store_products
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
  case when p.is_in_stock then p.stock else 0 end as stock,
  p.is_in_stock,
  p.badge,
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

grant select on public.store_products to anon, authenticated;

commit;
