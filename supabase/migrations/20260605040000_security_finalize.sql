-- ─────────────────────────────────────────────────────────────────────────────
-- Finalização do hardening:
--   #1 Blinda funções financeiras com is_admin() (não-admin logado não vê
--      faturamento/lucro). Atacante externo já estava bloqueado por grant.
--   #3 Restringe listagem do bucket product-images a authenticated (bucket é
--      público → URLs de imagem continuam funcionando; só some o list() anônimo).
--   (#2 proteção de senha vazada é config de Auth, aplicada via API.)
-- ─────────────────────────────────────────────────────────────────────────────

-- #1 ── get_total_profit (2 args) ────────────────────────────────────────────
create or replace function public.get_total_profit(
  start_date timestamptz default null, end_date timestamptz default null)
returns numeric language plpgsql security definer set search_path = public
as $function$
declare total_profit numeric;
begin
  if not public.is_admin() then return 0; end if;
  select coalesce(sum((s.unit_price - coalesce(s.cost_at_sale, coalesce(p.cost,0))) * s.quantity), 0)
  into total_profit
  from public.sales s join public.products p on p.id = s.product_id
  where (start_date is null or s.sale_date >= start_date)
    and (end_date is null or s.sale_date <= end_date);
  return total_profit;
end;
$function$;

-- #1 ── get_total_profit (3 args) ────────────────────────────────────────────
create or replace function public.get_total_profit(
  start_date timestamptz default null, end_date timestamptz default null, sale_type_filter text default null)
returns numeric language plpgsql security definer set search_path = public
as $function$
declare total_profit numeric;
begin
  if not public.is_admin() then return 0; end if;
  select coalesce(sum((s.unit_price - coalesce(s.cost_at_sale, coalesce(p.cost,0))) * s.quantity), 0)
  into total_profit
  from public.sales s join public.products p on p.id = s.product_id
  where (start_date is null or s.sale_date >= start_date)
    and (end_date is null or s.sale_date <= end_date)
    and (sale_type_filter is null or s.sale_type = sale_type_filter);
  return total_profit;
end;
$function$;

-- #1 ── get_sales_summary (4 args) ───────────────────────────────────────────
create or replace function public.get_sales_summary(
  start_date timestamptz default null, end_date timestamptz default null,
  product_filter uuid default null, category_filter text default null)
returns table(total_sales_value numeric, total_quantity_sold integer, total_transactions integer,
  best_selling_product_id uuid, best_selling_product_name text, best_selling_quantity integer,
  most_profitable_product_id uuid, most_profitable_product_name text, most_profitable_profit numeric)
language plpgsql security definer set search_path = public
as $function$
begin
  if not public.is_admin() then return; end if;
  return query
  with filtered_sales as (
    select s.*, p.name as product_name, p.cost as product_cost
    from public.sales s join public.products p on s.product_id = p.id
    where (start_date is null or s.sale_date >= start_date)
      and (end_date is null or s.sale_date <= end_date)
      and (product_filter is null or s.product_id = product_filter)
      and (category_filter is null or s.category = category_filter)
  ),
  summary as (select coalesce(sum(total_price),0) as total_sales, coalesce(sum(quantity),0)::integer as total_qty, count(*)::integer as total_trans from filtered_sales),
  best_selling as (select product_id, product_name, sum(quantity)::integer as total_quantity from filtered_sales group by product_id, product_name order by total_quantity desc limit 1),
  most_profitable as (select product_id, product_name, sum((unit_price - coalesce(cost_at_sale, coalesce(product_cost,0))) * quantity) as total_profit from filtered_sales group by product_id, product_name order by total_profit desc limit 1)
  select s.total_sales, s.total_qty, s.total_trans, bs.product_id, bs.product_name, bs.total_quantity, mp.product_id, mp.product_name, mp.total_profit
  from summary s
  cross join lateral (select * from best_selling limit 1) bs
  cross join lateral (select * from most_profitable limit 1) mp;
end;
$function$;

-- #1 ── get_sales_summary (5 args) ───────────────────────────────────────────
create or replace function public.get_sales_summary(
  start_date timestamptz default null, end_date timestamptz default null,
  product_filter uuid default null, category_filter text default null, sale_type_filter text default null)
returns table(total_sales_value numeric, total_quantity_sold integer, total_transactions integer,
  best_selling_product_id uuid, best_selling_product_name text, best_selling_quantity integer,
  most_profitable_product_id uuid, most_profitable_product_name text, most_profitable_profit numeric)
language plpgsql security definer set search_path = public
as $function$
begin
  if not public.is_admin() then return; end if;
  return query
  with filtered_sales as (
    select s.*, p.name as product_name, p.cost as product_cost
    from public.sales s join public.products p on s.product_id = p.id
    where (start_date is null or s.sale_date >= start_date)
      and (end_date is null or s.sale_date <= end_date)
      and (product_filter is null or s.product_id = product_filter)
      and (category_filter is null or s.category = category_filter)
      and (sale_type_filter is null or s.sale_type = sale_type_filter)
  ),
  summary as (select coalesce(sum(total_price),0) as total_sales, coalesce(sum(quantity),0)::integer as total_qty, count(*)::integer as total_trans from filtered_sales),
  best_selling as (select product_id, product_name, sum(quantity)::integer as total_quantity from filtered_sales group by product_id, product_name order by total_quantity desc limit 1),
  most_profitable as (select product_id, product_name, sum((unit_price - coalesce(cost_at_sale, coalesce(product_cost,0))) * quantity) as total_profit from filtered_sales group by product_id, product_name order by total_profit desc limit 1)
  select s.total_sales, s.total_qty, s.total_trans, bs.product_id, bs.product_name, bs.total_quantity, mp.product_id, mp.product_name, mp.total_profit
  from summary s
  cross join lateral (select * from best_selling limit 1) bs
  cross join lateral (select * from most_profitable limit 1) mp;
end;
$function$;

-- #3 ── Bucket: lista só para authenticated (URLs públicas seguem funcionando)
drop policy if exists "Public can view product images" on storage.objects;
drop policy if exists "Product images select authenticated" on storage.objects;
create policy "Product images select authenticated"
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images');
