-- Public RPC to fetch order details for guest users.
-- UUID acts as the access token — not guessable, industry standard.
create or replace function get_guest_order_summary(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'id',               o.id,
    'status',           o.status,
    'total_amount',     o.total_amount,
    'created_at',       o.created_at,
    'payment_method',   o.payment_method,
    'shipping_address', o.shipping_address,
    'tracking_code',    o.tracking_code,
    'customer_name',    o.customer_name,
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'quantity', oi.quantity,
            'name',     p.name,
            'image',    p.image
          )
        )
        from order_items oi
        join products p on p.id = oi.product_id
        where oi.order_id = o.id
      ),
      '[]'::jsonb
    )
  )
  into v_result
  from orders o
  where o.id = p_order_id;

  return v_result;
end;
$$;

grant execute on function get_guest_order_summary(uuid) to anon, authenticated;
