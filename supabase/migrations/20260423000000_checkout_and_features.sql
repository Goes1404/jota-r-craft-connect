-- Migration: Extend orders table for full checkout support
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shipping_address TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pix',
  ADD COLUMN IF NOT EXISTS tracking_code TEXT,
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS pix_qr_code TEXT,
  ADD COLUMN IF NOT EXISTS pix_qr_code_text TEXT;

-- Add missing total_price to order_items (already has unit_price)
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED;

-- Allow users to view their own orders
CREATE POLICY IF NOT EXISTS "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to create their own orders
CREATE POLICY IF NOT EXISTS "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view own order items via order
CREATE POLICY IF NOT EXISTS "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Create product_views table for analytics
CREATE TABLE IF NOT EXISTS public.product_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can insert product views"
  ON public.product_views FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated can view product views"
  ON public.product_views FOR SELECT USING (auth.role() = 'authenticated');

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can read reviews"
  ON public.product_reviews FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert reviews"
  ON public.product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own reviews"
  ON public.product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Create newsletter table
CREATE TABLE IF NOT EXISTS public.newsletter (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can subscribe newsletter"
  ON public.newsletter FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated can view newsletter"
  ON public.newsletter FOR SELECT USING (auth.role() = 'authenticated');

-- Create wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage own wishlist"
  ON public.wishlist FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
