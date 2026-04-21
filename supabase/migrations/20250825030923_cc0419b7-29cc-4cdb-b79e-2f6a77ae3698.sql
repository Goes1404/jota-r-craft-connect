-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  detailed_description TEXT,
  image TEXT,
  images TEXT[],
  category TEXT,
  stock INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site visits table for analytics
CREATE TABLE public.site_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_ip TEXT,
  page_visited TEXT,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table for sales tracking
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT,
  customer_phone TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to products
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);

-- Create policies for site visits (anyone can insert, but only authenticated users can view)
CREATE POLICY "Anyone can insert visits" ON public.site_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can view visits" ON public.site_visits FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for orders (public insert for checkout, authenticated view)
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can view orders" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for order items
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can view order items" ON public.order_items FOR SELECT USING (auth.role() = 'authenticated');

-- Admin policies for full access (will be restricted to actual admin users)
CREATE POLICY "Authenticated users can manage products" ON public.products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage orders" ON public.orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage order items" ON public.order_items FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample products
INSERT INTO public.products (name, price, description, detailed_description, image, category, stock, is_featured) VALUES
('Colar de Prata Clássico', 149.90, 'Colar elegante em prata 925', 'Colar em prata 925 com acabamento refinado. Peça artesanal com design clássico e atemporal. Ideal para ocasiões especiais ou uso diário. Comprimento ajustável de 40-45cm.', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', 'colares', 15, true),
('Pulseira Dourada Moderna', 89.90, 'Pulseira contemporânea banhada a ouro', 'Pulseira moderna banhada a ouro 18k com design contemporâneo. Fabricada com materiais de alta qualidade e resistente ao uso diário. Tamanho universal com fechamento seguro.', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400', 'pulseiras', 22, true),
('Brincos de Pérola Elegantes', 199.90, 'Brincos sofisticados com pérolas naturais', 'Brincos elegantes com pérolas naturais cultivadas e base em prata 925. Design clássico e sofisticado, perfeito para eventos formais. Acompanha certificado de autenticidade das pérolas.', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400', 'brincos', 8, true),
('Anel Solitário Delicado', 299.90, 'Anel com cristal solitário', 'Anel solitário com cristal facetado em base de prata 925. Design minimalista e elegante. Disponível em vários tamanhos. Acompanha caixa para presente e certificado de garantia.', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400', 'aneis', 12, false),
('Gargantilha Moderna', 119.90, 'Gargantilha contemporânea ajustável', 'Gargantilha moderna em metal nobre com acabamento especial. Design contemporâneo e versátil, combina com diversos estilos. Comprimento ajustável e hipoalergênica.', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400', 'colares', 18, false),
('Conjunto Harmonia', 249.90, 'Conjunto colar e brincos harmonizados', 'Conjunto elegante composto por colar e brincos com design harmonizado. Fabricado em prata 925 com detalhes únicos. Perfeito para ocasiões especiais. Acompanha embalagem premium.', 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400', 'conjuntos', 5, true);