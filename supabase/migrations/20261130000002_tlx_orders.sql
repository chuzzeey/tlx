begin;

create table if not exists public.tlx_orders (
  id uuid primary key,
  order_number text not null unique,
  idempotency_key uuid not null unique,
  receipt_token_hash text not null unique
    check (receipt_token_hash ~ '^[a-f0-9]{64}$'),
  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  street text not null,
  city text not null,
  region text not null,
  country text not null,
  payment_method text not null default 'bank_transfer'
    check (payment_method = 'bank_transfer'),
  payment_status text not null default 'awaiting_verification'
    check (payment_status in ('awaiting_verification', 'paid', 'cancelled')),
  email_status text not null default 'pending'
    check (email_status in ('pending', 'sending', 'sent', 'failed', 'not_configured')),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status_updated_by uuid,
  payment_verified_at timestamptz
);

create table if not exists public.tlx_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.tlx_orders(id) on delete cascade,
  position integer not null check (position >= 0),
  product_id text not null,
  product_name text not null,
  image_url text not null,
  size text,
  quantity integer not null check (quantity between 1 and 99),
  unit_price numeric(12, 2) not null check (unit_price >= 0)
);

create unique index if not exists tlx_order_items_order_position_idx
  on public.tlx_order_items (order_id, position);
create index if not exists tlx_order_items_order_id_idx
  on public.tlx_order_items (order_id);

alter table public.tlx_orders enable row level security;
alter table public.tlx_order_items enable row level security;

revoke all on public.tlx_orders, public.tlx_order_items from anon, authenticated;
grant all on public.tlx_orders, public.tlx_order_items to service_role;

create or replace function public.create_tlx_order(
  p_idempotency_key uuid,
  p_receipt_token_hash text,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_street text,
  p_city text,
  p_region text,
  p_country text,
  p_total_amount numeric,
  p_items jsonb
)
returns table (
  order_id uuid,
  order_number text,
  receipt_token_hash text,
  created_at timestamptz,
  email_status text,
  was_created boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_receipt_token_hash text;
  v_created_at timestamptz;
  v_email_status text;
  v_total_amount numeric;
  v_existing public.tlx_orders%rowtype;
  v_existing_item_count integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one order item is required.';
  end if;

  if p_receipt_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'The receipt token is invalid.';
  end if;

  select coalesce(
    sum((item.value ->> 'unit_price')::numeric * (item.value ->> 'quantity')::integer),
    0
  )
  into v_total_amount
  from jsonb_array_elements(p_items) as item(value);

  if v_total_amount <> p_total_amount then
    raise exception 'The order total does not match its items.';
  end if;

  v_order_number := 'TLX-' || upper(substr(replace(v_order_id::text, '-', ''), 1, 10));

  insert into public.tlx_orders (
    id,
    order_number,
    idempotency_key,
    receipt_token_hash,
    customer_name,
    customer_email,
    customer_phone,
    street,
    city,
    region,
    country,
    total_amount
  )
  values (
    v_order_id,
    v_order_number,
    p_idempotency_key,
    p_receipt_token_hash,
    p_customer_name,
    nullif(p_customer_email, ''),
    p_customer_phone,
    p_street,
    p_city,
    p_region,
    p_country,
    p_total_amount
  )
  on conflict (idempotency_key) do nothing
  returning
    tlx_orders.id,
    tlx_orders.order_number,
    tlx_orders.receipt_token_hash,
    tlx_orders.created_at,
    tlx_orders.email_status
  into
    v_order_id,
    v_order_number,
    v_receipt_token_hash,
    v_created_at,
    v_email_status;

  if not found then
    select existing.*
    into v_existing
    from public.tlx_orders as existing
    where existing.idempotency_key = p_idempotency_key;

    if not found or v_existing.receipt_token_hash <> p_receipt_token_hash then
      raise exception 'The order submission key has already been used.';
    end if;

    if v_existing.customer_name is distinct from p_customer_name
      or v_existing.customer_email is distinct from nullif(p_customer_email, '')
      or v_existing.customer_phone is distinct from p_customer_phone
      or v_existing.street is distinct from p_street
      or v_existing.city is distinct from p_city
      or v_existing.region is distinct from p_region
      or v_existing.country is distinct from p_country
      or v_existing.total_amount is distinct from p_total_amount then
      raise exception 'The order submission key has already been used for different order details.';
    end if;

    select count(*)
    into v_existing_item_count
    from public.tlx_order_items as existing_item
    where existing_item.order_id = v_existing.id;

    if v_existing_item_count <> jsonb_array_length(p_items) or exists (
      select 1
      from jsonb_to_recordset(p_items) as item(
        product_id text,
        product_name text,
        image_url text,
        size text,
        quantity integer,
        unit_price numeric,
        position integer
      )
      full join public.tlx_order_items as existing_item
        on existing_item.order_id = v_existing.id
        and existing_item.position = item.position
      where existing_item.id is null
        or item.product_id is distinct from existing_item.product_id
        or item.product_name is distinct from existing_item.product_name
        or item.image_url is distinct from existing_item.image_url
        or nullif(item.size, '') is distinct from existing_item.size
        or item.quantity is distinct from existing_item.quantity
        or item.unit_price is distinct from existing_item.unit_price
    ) then
      raise exception 'The order submission key has already been used for different items.';
    end if;

    return query
      select
        v_existing.id,
        v_existing.order_number,
        v_existing.receipt_token_hash,
        v_existing.created_at,
        v_existing.email_status,
        false;
    return;
  end if;

  insert into public.tlx_order_items (
    order_id,
    position,
    product_id,
    product_name,
    image_url,
    size,
    quantity,
    unit_price
  )
  select
    v_order_id,
    item.position,
    item.product_id,
    item.product_name,
    item.image_url,
    nullif(item.size, ''),
    item.quantity,
    item.unit_price
  from jsonb_to_recordset(p_items) as item(
    product_id text,
    product_name text,
    image_url text,
    size text,
    quantity integer,
    unit_price numeric,
    position integer
  );

  return query
    select v_order_id, v_order_number, p_receipt_token_hash, v_created_at, 'pending'::text, true;
end;
$$;

revoke all on function public.create_tlx_order(
  uuid, text, text, text, text, text, text, text, text, numeric, jsonb
) from public, anon, authenticated;
grant execute on function public.create_tlx_order(
  uuid, text, text, text, text, text, text, text, text, numeric, jsonb
) to service_role;

commit;
