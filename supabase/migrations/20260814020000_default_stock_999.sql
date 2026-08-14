-- Lojista pediu para não ter que se preocupar com contagem de estoque por
-- enquanto: todo produto (existente e novo) começa com 999 em stock.
update public.products set stock = 999;
alter table public.products alter column stock set default 999;
