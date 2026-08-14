-- Apelidos que o lojista usa no caderno ("capinha", "pelicula", "fone bt")
-- mapeados para o produto do catálogo. Preenchido quando ele escolhe a peça
-- na revisão do lançamento por foto — da próxima vez o casamento é automático.
--
-- alias é a PK já normalizada (minúsculo, sem acento): um apelido aponta para
-- exatamente um produto, e reescolher simplesmente atualiza o destino.
create table if not exists public.product_aliases (
  alias       text primary key,
  product_id  uuid not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists product_aliases_product_id_idx
  on public.product_aliases (product_id);

alter table public.product_aliases enable row level security;

drop policy if exists "product_aliases_admin_all" on public.product_aliases;
create policy "product_aliases_admin_all" on public.product_aliases
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.product_aliases is
  'Apelidos do caderno → produto do catálogo, aprendidos no lançamento por foto.';
