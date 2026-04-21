-- Create settings table for site assets and function for total profit

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'settings' AND policyname = 'Anyone can view settings'
  ) THEN
    CREATE POLICY "Anyone can view settings"
    ON public.settings
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'settings' AND policyname = 'Authenticated users can upsert settings'
  ) THEN
    CREATE POLICY "Authenticated users can upsert settings"
    ON public.settings
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Trigger to update updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Function to compute total profit in a period
CREATE OR REPLACE FUNCTION public.get_total_profit(
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_profit numeric;
BEGIN
  SELECT COALESCE(SUM((s.unit_price - COALESCE(p.cost, 0)) * s.quantity), 0)
  INTO total_profit
  FROM public.sales s
  JOIN public.products p ON p.id = s.product_id
  WHERE (start_date IS NULL OR s.sale_date >= start_date)
    AND (end_date IS NULL OR s.sale_date <= end_date);

  RETURN total_profit;
END;
$$;