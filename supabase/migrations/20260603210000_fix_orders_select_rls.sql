-- Fix: restrict orders SELECT to own rows only.
-- Previously qual=true let any authenticated user see all orders.
-- Admin check uses JWT user_metadata.role = 'admin' (set at user creation).

DROP POLICY IF EXISTS "p_select" ON public.orders;

CREATE POLICY "p_select" ON public.orders
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
