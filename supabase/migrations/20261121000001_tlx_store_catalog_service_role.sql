grant all privileges on table public.products to service_role;
grant all privileges on table public.reviews to service_role;
grant all privileges on table public.product_slug_redirects to service_role;

grant usage, select on all sequences in schema public to service_role;
