-- Drop the old policy that only allowed service_role
DROP POLICY IF EXISTS "Admins manage shipping config" ON public.shipping_config;

-- Create a new policy that allows service_role and users with user_metadata.role = 'admin'
CREATE POLICY "Admins manage shipping config"
  ON public.shipping_config FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
