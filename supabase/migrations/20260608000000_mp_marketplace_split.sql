-- ─────────────────────────────────────────────────────────────────────────────
-- MercadoPago Marketplace (split de pagamento PIX 10/90)
--
-- Para o PIX dividir automaticamente (90% lojista / 10% desenvolvedor) é preciso
-- criar o pagamento com o access_token do LOJISTA obtido via OAuth + o campo
-- application_fee (a comissão da plataforma). Estas tabelas guardam, de forma
-- segura (apenas service_role acessa), as credenciais OAuth do lojista e o state
-- temporário usado na proteção CSRF do fluxo de autorização.
-- ─────────────────────────────────────────────────────────────────────────────

-- Credenciais OAuth do lojista (modelo singleton: uma loja).
create table if not exists public.mp_marketplace_credentials (
  id            boolean primary key default true,
  mp_user_id    text not null,
  access_token  text not null,
  refresh_token text not null,
  public_key    text,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint mp_marketplace_singleton check (id)
);

-- State temporário do fluxo OAuth (proteção CSRF). Limpo após uso/expiração.
create table if not exists public.mp_oauth_state (
  state      text primary key,
  created_at timestamptz not null default now()
);

-- RLS: ninguém via API pública. Só service_role (edge functions) acessa, e ele
-- ignora RLS por padrão. Habilitamos RLS sem políticas = nega tudo para anon/auth.
alter table public.mp_marketplace_credentials enable row level security;
alter table public.mp_oauth_state              enable row level security;

-- RPC de status para o painel admin: informa SE está conectado, sem nunca expor
-- os tokens. Retorna conectado=false para não-admin.
create or replace function public.mp_marketplace_status()
returns table(connected boolean, mp_user_id text, connected_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    return query select false, null::text, null::timestamptz;
    return;
  end if;

  return query
    select true, c.mp_user_id, c.created_at
    from public.mp_marketplace_credentials c
    limit 1;

  if not found then
    return query select false, null::text, null::timestamptz;
  end if;
end;
$$;

revoke execute on function public.mp_marketplace_status() from public;
grant execute on function public.mp_marketplace_status() to authenticated;
