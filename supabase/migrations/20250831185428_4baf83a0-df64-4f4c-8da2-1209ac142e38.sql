-- Create sales table to track all sales transactions
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC NOT NULL CHECK (total_price >= 0),
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  category TEXT,
  responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sale_type TEXT NOT NULL DEFAULT 'manual' CHECK (sale_type IN ('manual', 'automatic')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create policies for sales table
CREATE POLICY "Authenticated users can view sales" 
ON public.sales 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can create sales" 
ON public.sales 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update sales" 
ON public.sales 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can delete sales" 
ON public.sales 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_sales_product_id ON public.sales(product_id);
CREATE INDEX idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX idx_sales_category ON public.sales(category);
CREATE INDEX idx_sales_responsible_user ON public.sales(responsible_user_id);

-- Add cost column to products table for profitability calculation
ALTER TABLE public.products ADD COLUMN cost NUMERIC DEFAULT 0 CHECK (cost >= 0);

-- Create function to get sales summary
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

-- Enable realtime for sales table
ALTER TABLE public.sales REPLICA IDENTITY FULL;
-- The sales table will be added to the publication automatically