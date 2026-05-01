-- Migration: Add DB Trigger to automatically convert online orders to sales and support sale_type filtering

-- 1. Create function and trigger to insert sales when an order is paid
CREATE OR REPLACE FUNCTION public.handle_order_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Pago' AND OLD.status IS DISTINCT FROM 'Pago' THEN
    -- Insert each order item into the sales table
    INSERT INTO public.sales (
      product_id,
      quantity,
      unit_price,
      total_price,
      sale_date,
      category,
      responsible_user_id,
      sale_type,
      notes,
      cost_at_sale
    )
    SELECT
      oi.product_id,
      oi.quantity,
      oi.unit_price,
      oi.total_price,
      NEW.created_at, -- or now()
      p.category,
      NEW.user_id,
      'automatic',
      'Pedido Online #' || NEW.id,
      p.cost
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_order_paid_insert_sales ON public.orders;
CREATE TRIGGER trg_order_paid_insert_sales
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_paid();

-- 2. Update get_total_profit function to accept sale_type_filter
CREATE OR REPLACE FUNCTION public.get_total_profit(
  start_date timestamp with time zone DEFAULT NULL,
  end_date timestamp with time zone DEFAULT NULL,
  sale_type_filter text DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_profit numeric;
BEGIN
  SELECT COALESCE(SUM((s.unit_price - COALESCE(s.cost_at_sale, COALESCE(p.cost, 0))) * s.quantity), 0)
  INTO total_profit
  FROM public.sales s
  JOIN public.products p ON p.id = s.product_id
  WHERE (start_date IS NULL OR s.sale_date >= start_date)
    AND (end_date IS NULL OR s.sale_date <= end_date)
    AND (sale_type_filter IS NULL OR s.sale_type = sale_type_filter);

  RETURN total_profit;
END;
$function$;

-- 3. Update get_sales_summary function to accept sale_type_filter
CREATE OR REPLACE FUNCTION public.get_sales_summary(
  start_date timestamp with time zone DEFAULT NULL,
  end_date timestamp with time zone DEFAULT NULL,
  product_filter uuid DEFAULT NULL,
  category_filter text DEFAULT NULL,
  sale_type_filter text DEFAULT NULL
)
RETURNS TABLE(
  total_sales_value numeric,
  total_quantity_sold integer,
  total_transactions integer,
  best_selling_product_id uuid,
  best_selling_product_name text,
  best_selling_quantity integer,
  most_profitable_product_id uuid,
  most_profitable_product_name text,
  most_profitable_profit numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      (category_filter IS NULL OR s.category = category_filter) AND
      (sale_type_filter IS NULL OR s.sale_type = sale_type_filter)
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
      SUM((unit_price - COALESCE(cost_at_sale, COALESCE(product_cost, 0))) * quantity) as total_profit
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
$function$;
