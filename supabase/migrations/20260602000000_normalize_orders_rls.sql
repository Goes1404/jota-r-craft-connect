-- ============================================================
-- Normaliza as políticas RLS de orders / order_items para suportar
-- tanto guest checkout quanto usuário autenticado sem ambiguidade.
-- ============================================================

-- Remove políticas antigas/conflitantes
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can update all orders" ON public.orders;

-- INSERT: permite guest (user_id NULL) ou usuário criando para si mesmo.
-- Inclui anon e authenticated para cobrir checkout sem login.
CREATE POLICY "orders_insert_self_or_guest"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NULL
    OR auth.uid() = user_id
  );

-- SELECT: dono ou admin
CREATE POLICY "orders_select_own_or_admin"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- UPDATE: dono pode atualizar campos de pagamento; service_role (webhooks) sempre.
CREATE POLICY "orders_update_own"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "orders_service_role_all"
  ON public.orders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- order_items
-- ============================================================
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items for own orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;

CREATE POLICY "order_items_insert_for_own_order"
  ON public.order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.user_id IS NULL OR o.user_id = auth.uid())
    )
  );

CREATE POLICY "order_items_select_own"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (
          o.user_id = auth.uid()
          OR (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
        )
    )
  );

CREATE POLICY "order_items_service_role_all"
  ON public.order_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
