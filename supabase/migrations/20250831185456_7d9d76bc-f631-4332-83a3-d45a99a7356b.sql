-- Fix the search_path issue for the get_sales_summary function
CREATE OR REPLACE FUNCTION public.get_sales_summary(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  product_filter UUID DEFAULT NULL,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_sales_value NUMERIC,
  total_quantity_sold INTEGER,
  total_transactions INTEGER,
  best_selling_product_id UUID,
  best_selling_product_name TEXT,
  best_selling_quantity INTEGER,
  most_profitable_product_id UUID,
  most_profitable_product_name TEXT,
  most_profitable_profit NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_sales AS (
    SELECT s.*, p.name as product_name, p.cost as product_cost
    FROM public.sales s
    JOIN public.products p ON s.product_id = p.id
    WHERE 
      (start_date IS NULL OR s.sale_date >= start_date) AND
      (end_date IS NULL OR s.sale_date <= end_date) AND
      (product_filter IS NULL OR s.product_id = product_filter) AND
      (category_filter IS NULL OR s.category = category_filter)
  ),
  summary AS (
    SELECT 
      COALESCE(SUM(total_price), 0) as total_sales,
      COALESCE(SUM(quantity), 0)::INTEGER as total_qty,
      COUNT(*)::INTEGER as total_trans
    FROM filtered_sales
  ),
  best_selling AS (
    SELECT 
      product_id, 
      product_name,
      SUM(quantity)::INTEGER as total_quantity
    FROM filtered_sales
    GROUP BY product_id, product_name
    ORDER BY total_quantity DESC
    LIMIT 1
  ),
  most_profitable AS (
    SELECT 
      product_id, 
      product_name,
      SUM((unit_price - COALESCE(product_cost, 0)) * quantity) as total_profit
    FROM filtered_sales
    GROUP BY product_id, product_name
    ORDER BY total_profit DESC
    LIMIT 1
  )
  SELECT 
    s.total_sales,
    s.total_qty,
    s.total_trans,
    bs.product_id,
    bs.product_name,
    bs.total_quantity,
    mp.product_id,
    mp.product_name,
    mp.total_profit
  FROM summary s
  CROSS JOIN LATERAL (SELECT * FROM best_selling LIMIT 1) bs
  CROSS JOIN LATERAL (SELECT * FROM most_profitable LIMIT 1) mp;
END;
$$;