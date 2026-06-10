-- Security hardening: remove over-permissive RLS policies that granted any
-- authenticated user (or a user-controllable user_metadata.role) read/write
-- access to financial data, PII and admin-only tables.
--
-- Root cause: earlier "hardening" migrations ADDED is_admin() policies but left
-- the original `auth.role() = 'authenticated'` and `user_metadata.role` policies
-- in place. Because Postgres OR-combines permissive policies, the broad ones kept
-- granting access. This migration drops them and routes admin access through
-- public.is_admin() (which reads app_metadata — NOT user-writable).

-- ── sales: financial data (revenue, cost, profit) — admin only ──────────────
DROP POLICY IF EXISTS "Admin All Sales"    ON public.sales;
DROP POLICY IF EXISTS "Admin manage sales" ON public.sales;
CREATE POLICY "sales_admin_all" ON public.sales
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── newsletter: subscriber emails (PII) — public INSERT, admin-only read ────
DROP POLICY IF EXISTS "Authenticated can view newsletter" ON public.newsletter;
CREATE POLICY "newsletter_select_admin" ON public.newsletter
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ── abandoned_carts: customer email/phone/cart (PII) ────────────────────────
-- Reads are admin-only. INSERT stays open (anon checkout). UPDATE stays open so
-- the checkout flow can flag a cart purchased/recovered by its (UUID) id; since
-- SELECT is now admin-only, ids are not enumerable by non-admins.
DROP POLICY IF EXISTS "Authenticated users can manage abandoned carts" ON public.abandoned_carts;
CREATE POLICY "abandoned_carts_select_admin" ON public.abandoned_carts
  FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "abandoned_carts_update_any" ON public.abandoned_carts
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ── coupons: management — admin only (public still views active coupons) ────
DROP POLICY IF EXISTS "Admin can manage coupons" ON public.coupons;
CREATE POLICY "coupons_admin_manage" ON public.coupons
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── admin_logs: read — admin only (insert stays open) ───────────────────────
DROP POLICY IF EXISTS "Admin can view logs" ON public.admin_logs;
CREATE POLICY "admin_logs_select_admin" ON public.admin_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ── order_items: admin branch was user_metadata.role → use is_admin() ───────
DROP POLICY IF EXISTS "order_items_select_own" ON public.order_items;
CREATE POLICY "order_items_select_own" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );

-- ── site_errors: admin read was user_metadata.role → use is_admin() ─────────
DROP POLICY IF EXISTS "allow_admin_read_site_errors" ON public.site_errors;
CREATE POLICY "allow_admin_read_site_errors" ON public.site_errors
  FOR SELECT TO authenticated
  USING (public.is_admin());
