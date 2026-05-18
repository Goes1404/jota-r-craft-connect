-- Trigger: recalcula e valida total_amount ao inserir um pedido
-- Impede price manipulation vinda do frontend

CREATE OR REPLACE FUNCTION public.validate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  calculated_total NUMERIC;
BEGIN
  -- Soma unit_price * quantity dos itens já inseridos para este pedido
  SELECT COALESCE(SUM(oi.unit_price * oi.quantity), 0)
  INTO calculated_total
  FROM public.order_items oi
  WHERE oi.order_id = NEW.id;

  -- Se ainda não há itens (insert simultâneo), confia no valor por ora
  -- A validação real acontece no trigger de order_items abaixo
  IF calculated_total = 0 THEN
    RETURN NEW;
  END IF;

  -- Rejeita se o total enviado divergir mais de R$0,01 do calculado
  IF ABS(NEW.total_amount - calculated_total) > 0.01 THEN
    RAISE EXCEPTION 'total_amount inválido: enviado=% calculado=%',
      NEW.total_amount, calculated_total;
  END IF;

  -- Sobrescreve com o valor calculado pelo banco (fonte da verdade)
  NEW.total_amount := calculated_total;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: dispara ao inserir itens e corrige o total do pedido pai
CREATE OR REPLACE FUNCTION public.recalculate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  real_price NUMERIC;
  calculated_total NUMERIC;
BEGIN
  -- Busca o preço real do produto no banco (ignora o que veio do frontend)
  SELECT price INTO real_price
  FROM public.products
  WHERE id = NEW.product_id;

  IF real_price IS NULL THEN
    RAISE EXCEPTION 'Produto % não encontrado', NEW.product_id;
  END IF;

  -- Impede quantidade zero ou negativa
  IF NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Quantidade inválida: %', NEW.quantity;
  END IF;

  -- Sobrescreve unit_price com o preço real do banco
  NEW.unit_price := real_price;

  -- Recalcula e atualiza o total_amount do pedido
  SELECT COALESCE(SUM(oi.unit_price * oi.quantity), 0) + (real_price * NEW.quantity)
  INTO calculated_total
  FROM public.order_items oi
  WHERE oi.order_id = NEW.order_id;

  UPDATE public.orders
  SET total_amount = calculated_total
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recalculate_order_total ON public.order_items;
CREATE TRIGGER trg_recalculate_order_total
  BEFORE INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_order_total();

-- Constraint: quantidade sempre positiva
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS chk_order_items_quantity,
  ADD CONSTRAINT chk_order_items_quantity CHECK (quantity > 0);

-- Constraint: total nunca negativo
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS chk_orders_total_amount,
  ADD CONSTRAINT chk_orders_total_amount CHECK (total_amount >= 0);
