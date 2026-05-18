-- Upgrade coupons: add expiry, usage limits and tracking
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS expires_at        TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_uses          INTEGER     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS times_used        INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_order_amount  NUMERIC(10,2) DEFAULT 0;

-- Index for fast lookup by active + code
CREATE INDEX IF NOT EXISTS idx_coupons_code_active ON public.coupons (code, active);

-- Function to safely increment usage and validate limits
CREATE OR REPLACE FUNCTION public.apply_coupon(p_code TEXT)
RETURNS TABLE (discount_percentage INT, valid BOOLEAN, message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = UPPER(p_code) AND active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::INT, false, 'Cupom inválido ou inativo.'::TEXT;
    RETURN;
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RETURN QUERY SELECT 0::INT, false, 'Cupom expirado.'::TEXT;
    RETURN;
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND v_coupon.times_used >= v_coupon.max_uses THEN
    RETURN QUERY SELECT 0::INT, false, 'Cupom esgotado.'::TEXT;
    RETURN;
  END IF;

  -- Increment usage count
  UPDATE coupons SET times_used = times_used + 1 WHERE id = v_coupon.id;

  RETURN QUERY SELECT v_coupon.discount_percentage, true, 'Cupom aplicado!'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_coupon(TEXT) TO anon, authenticated;
