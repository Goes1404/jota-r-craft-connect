-- ─────────────────────────────────────────────────────────────────────────────
-- HARDENING DE SEGURANÇA (pós-pentest)
--
-- Corrige: PII pública em profiles, escalada de privilégio via user_metadata,
-- escrita de products/settings por qualquer logado, sabotagem de estoque por
-- anon, vazamento de financeiro/token, e search_path mutável.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Admin confiável via app_metadata (NÃO editável pelo usuário final).
--    Mantém user_metadata também (o guard do frontend ainda o lê).
update auth.users
set raw_app_meta_data  = coalesce(raw_app_meta_data, '{}'::jsonb)  || '{"role":"admin"}'::jsonb,
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email in ('sq3junior@gmail.com', 'sq1matheusgsilva@gmail.com');

-- 2. is_admin(): lê o papel de app_metadata no JWT (fonte de verdade segura).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- 3. profiles: fim do "viewable by everyone". Só o próprio dono ou admin.
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

-- 4. products: leitura pública continua; escrita só admin (era qualquer logado).
drop policy if exists "Admin All Products" on public.products;
drop policy if exists "Admin manage products" on public.products;
create policy "products_admin_write" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 5. settings: leitura pública continua (storefront precisa); escrita só admin.
drop policy if exists "Admin All Settings" on public.settings;
drop policy if exists "Authenticated users can upsert settings" on public.settings;
create policy "settings_admin_write" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 6. orders: SELECT sem user_metadata (usa is_admin).
drop policy if exists "p_select" on public.orders;
create policy "p_select" on public.orders
  for select to authenticated using (
    user_id = auth.uid()
    or customer_email = (select email from auth.users where id = auth.uid())::text
    or public.is_admin()
  );

-- 7. shipping_config: sem leitura pública (vazava o token do Melhor Envio).
--    Edge function usa service_role (bypassa RLS); admin via is_admin().
drop policy if exists "Public read shipping config" on public.shipping_config;
drop policy if exists "Admins manage shipping config" on public.shipping_config;
create policy "shipping_config_admin" on public.shipping_config
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 8. Revoga execução direta (REST RPC) de funções internas/trigger e sabotagem
--    de estoque. Triggers continuam (rodam no contexto da tabela); webhooks
--    usam service_role.
revoke execute on function public.decrement_stock(uuid, integer) from anon, authenticated;
revoke execute on function public.restore_stock(uuid) from anon, authenticated;
revoke execute on function public.handle_order_paid() from anon, authenticated;
revoke execute on function public.guard_orders_update() from anon, authenticated;
revoke execute on function public.validate_order_total() from anon, authenticated;
revoke execute on function public.recalculate_order_total() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.update_updated_at_column() from anon, authenticated;
revoke execute on function public.update_product_stock_on_sale() from anon, authenticated;
revoke execute on function public.rls_auto_enable() from anon, authenticated;

-- 9. Financeiro: corta acesso anônimo (o vetor do pentest). Admin lê logado.
revoke execute on function public.get_total_profit(timestamptz, timestamptz) from anon;
revoke execute on function public.get_total_profit(timestamptz, timestamptz, text) from anon;
revoke execute on function public.get_sales_summary(timestamptz, timestamptz, uuid, text) from anon;
revoke execute on function public.get_sales_summary(timestamptz, timestamptz, uuid, text, text) from anon;

-- 10. search_path fixo (anti-injeção) nas funções apontadas pelo advisor.
alter function public.handle_new_user() set search_path = public;
alter function public.validate_order_total() set search_path = public;
alter function public.recalculate_order_total() set search_path = public;
alter function public.decrement_stock(uuid, integer) set search_path = public;
alter function public.restore_stock(uuid) set search_path = public;
