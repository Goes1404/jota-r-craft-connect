-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Shipping configuration and quote-logging tables
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Shipping configuration (one row per origin; admininstrator-managed)
CREATE TABLE IF NOT EXISTS public.shipping_config (
  id                      UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  origin_zip              TEXT        NOT NULL DEFAULT '06233-030',  -- Osasco, SP
  base_fee                NUMERIC(8,2) NOT NULL DEFAULT 12.90,
  per_km_rate             NUMERIC(6,4) NOT NULL DEFAULT 0.15,
  free_shipping_threshold NUMERIC(10,2) NOT NULL DEFAULT 500.00,
  sedex_multiplier        NUMERIC(4,2) NOT NULL DEFAULT 1.80,
  melhor_envio_enabled    BOOLEAN     NOT NULL DEFAULT false,
  melhor_envio_token      TEXT,                                       -- store encrypted in production
  is_active               BOOLEAN     NOT NULL DEFAULT true,
  updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Seed default config so the app always finds a row
INSERT INTO public.shipping_config (
  origin_zip, base_fee, per_km_rate, free_shipping_threshold,
  sedex_multiplier, melhor_envio_enabled, is_active
) VALUES (
  '06233-030', 12.90, 0.15, 500.00, 1.80, false, true
) ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────

-- 2. Shipping quote log (immutable insert-only, used for analytics)
CREATE TABLE IF NOT EXISTS public.shipping_quotes (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zip_code      TEXT        NOT NULL,
  city          TEXT,
  state         TEXT,
  product_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  result_json   JSONB,                               -- full options array returned
  source        TEXT        NOT NULL DEFAULT 'web',  -- 'web' | 'checkout' | 'product_page'
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shipping_quotes_zip_idx   ON public.shipping_quotes (zip_code);
CREATE INDEX IF NOT EXISTS shipping_quotes_state_idx ON public.shipping_quotes (state);
CREATE INDEX IF NOT EXISTS shipping_quotes_date_idx  ON public.shipping_quotes (created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.shipping_config  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_quotes  ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read shipping config
CREATE POLICY "Public read shipping config"
  ON public.shipping_config FOR SELECT
  USING (is_active = true);

-- Only service-role / admins can modify config
CREATE POLICY "Admins manage shipping config"
  ON public.shipping_config FOR ALL
  USING (auth.role() = 'service_role');

-- Anyone can insert a quote log (anonymous telemetry)
CREATE POLICY "Anyone can log a shipping quote"
  ON public.shipping_quotes FOR INSERT
  WITH CHECK (true);

-- Admins can read quote logs (dashboard analytics)
CREATE POLICY "Admins read shipping quotes"
  ON public.shipping_quotes FOR SELECT
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
