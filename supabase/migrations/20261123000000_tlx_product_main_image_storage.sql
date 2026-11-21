begin;

drop view if exists public.store_products;

alter table public.products
  drop column if exists image_alt,
  drop column if exists image;

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
  count(r.id)::integer as review_count
from public.products p
left join public.reviews r
  on r.product_id = p.id and r.is_approved
where p.is_published
group by p.id;

grant select on public.store_products to anon, authenticated;

commit;
