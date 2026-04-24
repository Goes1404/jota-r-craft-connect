-- Migration: Add decrement_stock RPC function for webhook-driven stock management
-- Stock is only decremented AFTER payment is confirmed (via webhook), not at order creation.

CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(stock - p_quantity, 0)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service_role (used by webhooks)
GRANT EXECUTE ON FUNCTION public.decrement_stock(UUID, INTEGER) TO service_role;

-- Also add a function to restore stock when an order is cancelled
CREATE OR REPLACE FUNCTION public.restore_stock(p_order_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products p
  SET stock = stock + oi.quantity
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id
    AND oi.product_id = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.restore_stock(UUID) TO service_role;

-- Policy: allow service_role to update orders (webhooks use service_role key)
-- This is already possible via service_role bypassing RLS, but for extra safety:
CREATE POLICY IF NOT EXISTS "Service role can update all orders"
  ON public.orders FOR UPDATE
  USING (true)
  WITH CHECK (true);
