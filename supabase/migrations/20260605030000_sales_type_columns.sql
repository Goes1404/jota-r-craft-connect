-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: a tabela public.sales não tinha as colunas sale_type / notes /
-- responsible_user_id, que são usadas por:
--   • get_total_profit(.., sale_type_filter)        -> erro 42703 (coluna inexistente)
--   • get_sales_summary(.., sale_type_filter)       -> idem
--   • registro de venda manual (SalesManagement)    -> insert falhava
--   • filtro União/Online/Físico do dashboard
--
-- Adiciona as colunas e classifica a venda gerada por pedido online como
-- 'automatic' (manual = registrada à mão no painel de Vendas).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.sales
  add column if not exists sale_type           text not null default 'automatic',
  add column if not exists notes               text,
  add column if not exists responsible_user_id uuid;

-- handle_order_paid: agora grava sale_type='automatic' + metadados do pedido.
create or replace function public.handle_order_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if NEW.status = 'Pago' and OLD.status is distinct from 'Pago' then
    begin
      insert into public.sales (
        product_id, quantity, unit_price, total_price, sale_date,
        category, cost_at_sale, sale_type, notes, responsible_user_id
      )
      select
        oi.product_id, oi.quantity, oi.unit_price,
        coalesce(oi.total_price, oi.unit_price * oi.quantity),
        NEW.created_at, p.category, p.cost,
        'automatic', 'Pedido Online #' || NEW.id, NEW.user_id
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      where oi.order_id = NEW.id;
    exception when others then
      raise warning 'handle_order_paid: falha ao inserir em sales (pedido %): %', NEW.id, SQLERRM;
    end;
  end if;
  return NEW;
end;
$function$;
