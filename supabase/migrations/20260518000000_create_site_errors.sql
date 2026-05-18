-- Tabela para log de erros capturados pelo ErrorBoundary do frontend
create table if not exists public.site_errors (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  error_message   text,
  error_stack     text,
  component_stack text,
  url         text,
  user_agent  text
);

-- Apenas inserção anônima permitida (sem autenticação necessária para logar erros)
alter table public.site_errors enable row level security;

create policy "allow_anonymous_insert_site_errors"
  on public.site_errors
  for insert
  to anon, authenticated
  with check (true);

-- Apenas admins leem os erros
create policy "allow_admin_read_site_errors"
  on public.site_errors
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
