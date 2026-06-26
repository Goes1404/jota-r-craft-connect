-- Dimensões físicas do produto (para cálculo de frete / Melhor Envio).
-- Todas opcionais; produtos antigos continuam válidos. Unidades: peso em kg,
-- demais em cm. Defaults pequenos servem de fallback seguro pro frete.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight  numeric NOT NULL DEFAULT 0.3,
  ADD COLUMN IF NOT EXISTS height  numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS width   numeric NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS length  numeric NOT NULL DEFAULT 20;

COMMENT ON COLUMN public.products.weight IS 'Peso do produto em kg (frete)';
COMMENT ON COLUMN public.products.height IS 'Altura da embalagem em cm (frete)';
COMMENT ON COLUMN public.products.width  IS 'Largura da embalagem em cm (frete)';
COMMENT ON COLUMN public.products.length IS 'Comprimento da embalagem em cm (frete)';
