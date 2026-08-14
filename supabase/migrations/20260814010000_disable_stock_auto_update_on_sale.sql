-- Pausa temporária: o lojista pediu para o estoque NÃO ser alterado
-- automaticamente por vendas (nem manual, nem por foto do caderno).
-- O trigger e a função continuam existindo — só desligados — para
-- religar depois com "ALTER TABLE public.sales ENABLE TRIGGER
-- trigger_update_product_stock_on_sale;" sem precisar recriar nada.
alter table public.sales disable trigger trigger_update_product_stock_on_sale;
