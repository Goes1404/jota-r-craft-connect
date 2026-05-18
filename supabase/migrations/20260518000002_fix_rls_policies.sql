-- ============================================================
-- Correções de RLS — segurança
-- ============================================================

-- 1. profiles: remover SELECT público (expunha email/nome de todos)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins podem ver todos os perfis (necessário para CRM)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- 2. admin_logs: restringir leitura a admins reais
-- ============================================================
DROP POLICY IF EXISTS "Admin can view logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Anyone can insert logs" ON public.admin_logs;

CREATE POLICY "Admins can view logs"
  ON public.admin_logs FOR SELECT
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Apenas usuários autenticados podem inserir logs (remove acesso anônimo)
CREATE POLICY "Authenticated users can insert logs"
  ON public.admin_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 3. coupons: apenas admins gerenciam, qualquer um vê ativos
-- ============================================================
DROP POLICY IF EXISTS "Admin can manage coupons" ON public.coupons;

CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- 4. orders: restringir INSERT para não aceitar user_id de outro usuário
-- ============================================================
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Usuário autenticado só pode criar pedido para si mesmo
CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL OR auth.uid() = user_id
  );

-- Usuário autenticado pode ler seus próprios pedidos
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- 5. order_items: acesso apenas ao dono do pedido ou admin
-- ============================================================
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;

CREATE POLICY "Users can insert order items for own orders"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND (o.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
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
