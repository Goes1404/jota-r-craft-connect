-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: handle_order_paid() quebrava a confirmação de TODOS os pedidos pagos.
--
-- O trigger trg_order_paid_insert_sales (AFTER UPDATE OF status) chamava
-- handle_order_paid(), que fazia INSERT INTO public.sales referenciando colunas
-- inexistentes (responsible_user_id, sale_type, notes). Isso lançava erro,
-- abortava a transação do UPDATE e o webhook (PIX/Stripe) recebia "DB error" —
-- então o pedido nunca saía de "Aguardando Pagamento".
--
-- Correção:
--   1) Inserir apenas as colunas que realmente existem em public.sales.
--   2) COALESCE em total_price (order_items.total_price é nullable; sales exige NOT NULL).
--   3) Envolver em EXCEPTION: registrar venda é efeito colateral e NUNCA pode
--      bloquear a confirmação do pagamento.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_order_paid()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'Pago' AND OLD.status IS DISTINCT FROM 'Pago' THEN
    BEGIN
      INSERT INTO public.sales (
        product_id,
        quantity,
        unit_price,
        total_price,
        sale_date,
        category,
        cost_at_sale
      )
      SELECT
        oi.product_id,
        oi.quantity,
        oi.unit_price,
        COALESCE(oi.total_price, oi.unit_price * oi.quantity),
        NEW.created_at,
        p.category,
        p.cost
      FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id;
    EXCEPTION WHEN OTHERS THEN
      -- Não deixar o registro de venda derrubar a confirmação do pagamento.
      RAISE WARNING 'handle_order_paid: falha ao inserir em sales (pedido %): %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$function$;
