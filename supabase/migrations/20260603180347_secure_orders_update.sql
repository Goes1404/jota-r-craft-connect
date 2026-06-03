-- ============================================================
-- Correção de segurança: impede manipulação de preço/status via UPDATE
--
-- Problema corrigido:
--   A política RLS `orders_update_own` permitia ao dono atualizar QUALQUER
--   coluna do pedido (inclusive total_amount e status). Como a função
--   validate_order_total() nunca foi anexada a um trigger, um usuário podia
--   baixar total_amount para R$1 após a criação e pagar a menos.
--
-- Defesa em profundidade (2 camadas):
--   1. Trigger BEFORE UPDATE que congela colunas sensíveis para quem não
--      é service_role (recalcula total_amount a partir de order_items).
--   2. RLS reescrita: o dono só pode atualizar via update normal; qualquer
--      tentativa de mudar total_amount/status é revertida pelo trigger.
-- ============================================================

-- ── 1. Trigger guard ─────────────────────────────────────────────────────────
-- Bloqueia mudanças em total_amount, status, payment_method e user_id feitas
-- por sessões que NÃO são service_role (webhooks/admin server-side).
CREATE OR REPLACE FUNCTION public.guard_orders_update()
RETURNS TRIGGER AS $$
DECLARE
  v_role text := current_setting('request.jwt.claims', true)::jsonb->>'role';
  v_calculated_total numeric;
BEGIN
  -- service_role (webhooks, funções server-side) tem acesso total e legítimo.
  IF v_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Para qualquer outro papel (anon/authenticated), recalcula o total real
  -- a partir dos itens — fonte da verdade — e reverte tentativas de adulteração.
  SELECT COALESCE(SUM(oi.unit_price * oi.quantity), OLD.total_amount)
  INTO v_calculated_total
  FROM public.order_items oi
  WHERE oi.order_id = OLD.id;

  -- Congela colunas sensíveis: ignora o que veio do cliente, mantém o valor seguro.
  NEW.total_amount   := v_calculated_total;
  NEW.status         := OLD.status;
  NEW.payment_method := OLD.payment_method;
  NEW.user_id        := OLD.user_id;
  NEW.created_at     := OLD.created_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_guard_orders_update ON public.orders;
CREATE TRIGGER trg_guard_orders_update
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_orders_update();

-- ── 2. Anexa também a validação no INSERT direto em orders ────────────────────
-- (defesa extra caso algum caminho insira em orders sem passar pelo create_order RPC)
DROP TRIGGER IF EXISTS trg_validate_order_total ON public.orders;
CREATE TRIGGER trg_validate_order_total
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_total();

-- ── 3. Comentário de auditoria ───────────────────────────────────────────────
COMMENT ON FUNCTION public.guard_orders_update() IS
  'Segurança: impede que anon/authenticated alterem total_amount/status/etc via UPDATE direto. Apenas service_role (webhooks) pode mudar status de pagamento.';
