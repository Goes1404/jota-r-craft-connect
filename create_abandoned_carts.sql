-- Tabela para rastreamento de carrinhos abandonados
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  phone TEXT,
  name TEXT,
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'abandoned', -- 'abandoned', 'recovered', 'purchased'
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- Clientes podem inserir e atualizar seus próprios carrinhos
CREATE POLICY "Users can manage their own abandoned carts"
  ON public.abandoned_carts
  FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admins podem ver todos
CREATE POLICY "Admins can view all abandoned carts"
  ON public.abandoned_carts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Atualizar o timestamp de last_active_at automaticamente
CREATE OR REPLACE FUNCTION update_abandoned_cart_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.last_active_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_abandoned_cart_modtime
BEFORE UPDATE ON public.abandoned_carts
FOR EACH ROW
EXECUTE FUNCTION update_abandoned_cart_timestamp();
