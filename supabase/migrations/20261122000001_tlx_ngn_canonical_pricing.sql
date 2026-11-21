begin;

-- Preserve the existing storefront amounts while converting legacy USD-valued rows to NGN.
update public.products
set
  price = round(price * 1354.04, 0),
  compare_at = case
    when compare_at is null then null
    else round(compare_at * 1354.04, 0)
  end;

commit;
