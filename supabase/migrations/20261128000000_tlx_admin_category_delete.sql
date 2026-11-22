create or replace function public.delete_product_category(target_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  category_image text;
  deleted_products jsonb;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role access is required.';
  end if;

  select category.image
  into category_image
  from public.product_categories as category
  where category.slug = target_slug
  for update;

  if not found then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', product.id,
        'main_image_path', product.main_image_path,
        'gallery', product.gallery
      )
    ),
    '[]'::jsonb
  )
  into deleted_products
  from public.products as product
  where product.category = target_slug;

  delete from public.products as product
  where product.category = target_slug;

  delete from public.product_categories as category
  where category.slug = target_slug;

  return jsonb_build_object(
    'category_image', category_image,
    'products', deleted_products
  );
end;
$$;

revoke all on function public.delete_product_category(text) from public, anon, authenticated;
grant execute on function public.delete_product_category(text) to service_role;
