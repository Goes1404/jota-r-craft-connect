-- Migração: Lumina Infrastructure v1.0
-- Este script adiciona as colunas necessárias para suportar a Inteligência de Vendas e Logística.

-- 1. Melhorar a tabela de Pedidos (Orders)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS tracking_code TEXT,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS pix_qr_code TEXT,
ADD COLUMN IF NOT EXISTS pix_qr_code_text TEXT,
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- 2. Melhorar a tabela de Produtos (Products)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0;

-- 3. Criar a tabela de Carrinhos Abandonados (Essencial para Lumina Recovery)
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  phone TEXT,
  name TEXT,
  cart_items JSONB,
  total_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending', -- 'pending' ou 'purchased'
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Habilitar RLS na nova tabela
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- 5. Criar Políticas de Acesso
CREATE POLICY "Anyone can create abandoned carts" ON public.abandoned_carts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can manage abandoned carts" ON public.abandoned_carts FOR ALL USING (auth.role() = 'authenticated');

-- 6. Garantir que o perfil do usuário suporte o nível VIP
-- (Se a tabela profiles não existir, ela será criada. Se existir, apenas a coluna será adicionada)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    CREATE TABLE public.profiles (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      full_name TEXT,
      phone TEXT,
      vip_level TEXT DEFAULT 'Black',
      total_spent DECIMAL(10,2) DEFAULT 0,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  ELSE
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vip_level TEXT DEFAULT 'Black';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;
