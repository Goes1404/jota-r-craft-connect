-- RPC: cria pedido (orders) + itens (order_items) atomicamente.
-- SECURITY DEFINER permite bypass de RLS de forma controlada — validações
-- de input ficam dentro da função (preço/estoque já existem como triggers).

CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address text,
  p_payment_method text,
  p_items jsonb,            -- [{"product_id": "uuid", "quantity": 1, "unit_price": 0}]
  p_total_amount numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_user_id uuid := auth.uid(); -- pega o usuário autenticado, se houver
  v_item jsonb;
BEGIN
  -- Validações básicas
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) = 0 THEN
    RAISE EXCEPTION 'customer_name obrigatório';
  END IF;
  IF p_payment_method NOT IN ('pix', 'credit_card') THEN
    RAISE EXCEPTION 'payment_method inválido: %', p_payment_method;
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'items obrigatórios';
  END IF;
  IF p_total_amount IS NULL OR p_total_amount <= 0 THEN
    RAISE EXCEPTION 'total_amount inválido';
  END IF;

  INSERT INTO public.orders (
    user_id, customer_name, customer_email, customer_phone,
    total_amount, status, shipping_address, payment_method
  ) VALUES (
    v_user_id, p_customer_name, p_customer_email, p_customer_phone,
    p_total_amount, 'Aguardando Pagamento', p_shipping_address, p_payment_method
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::int,
      (v_item->>'unit_price')::numeric
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(text, text, text, text, text, jsonb, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(text, text, text, text, text, jsonb, numeric) TO anon, authenticated;
