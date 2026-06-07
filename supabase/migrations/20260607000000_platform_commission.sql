-- ─────────────────────────────────────────────────────────────────────────────
-- Revenue share: adiciona platform_fee_amount em orders (10% de cada venda)
-- e RPC get_platform_commissions para o painel de comissões do desenvolvedor.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.orders
  add column if not exists platform_fee_amount numeric(10,2);

-- RPC para o painel de comissões (admin only)
create or replace function public.get_platform_commissions(
  start_date timestamptz default null,
  end_date   timestamptz default null
)
returns table(
  card_fee_total   numeric,
  pix_fee_total    numeric,
  total_fee        numeric,
  card_orders_count bigint,
  pix_orders_count  bigint
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then return; end if;
  return query
  select
    coalesce(sum(case when o.payment_method != 'pix' then o.platform_fee_amount else 0 end), 0),
    coalesce(sum(case when o.payment_method = 'pix'  then o.platform_fee_amount else 0 end), 0),
    coalesce(sum(o.platform_fee_amount), 0),
    count(case when o.payment_method != 'pix' then 1 end),
    count(case when o.payment_method = 'pix'  then 1 end)
  from public.orders o
  where o.status = 'Pago'
    and o.platform_fee_amount is not null
    and (start_date is null or o.created_at >= start_date)
    and (end_date   is null or o.created_at <= end_date);
end;
$$;

grant execute on function public.get_platform_commissions(timestamptz, timestamptz) to authenticated;
