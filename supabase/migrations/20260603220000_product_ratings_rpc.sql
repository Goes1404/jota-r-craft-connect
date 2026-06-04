-- RPC: agrega avaliações por produto (média + contagem) numa única chamada.
-- Evita N+1 no front-end: o grid de produtos busca todos os ratings de uma vez.
-- Leitura pública (reviews já são públicas via RLS).

CREATE OR REPLACE FUNCTION public.get_product_ratings()
RETURNS TABLE (product_id uuid, avg_rating numeric, review_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    product_id,
    ROUND(AVG(rating)::numeric, 1) AS avg_rating,
    COUNT(*)::bigint              AS review_count
  FROM public.product_reviews
  GROUP BY product_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_ratings() TO anon, authenticated;
