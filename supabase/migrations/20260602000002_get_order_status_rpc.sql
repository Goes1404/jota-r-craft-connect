-- RPC: leitura segura do status de um pedido pelo id.
-- Permite que o checkout (inclusive guest/anon) faça polling do status do
-- pagamento sem precisar de uma policy de SELECT ampla em orders.
-- Retorna apenas o campo status — nenhum dado sensível.

CREATE OR REPLACE FUNCTION public.get_order_status(p_order_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status FROM public.orders WHERE id = p_order_id;
$$;

REVOKE ALL ON FUNCTION public.get_order_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_status(uuid) TO anon, authenticated;
