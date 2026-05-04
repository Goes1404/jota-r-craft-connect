-- Allow anonymous users to insert order items for guest checkout
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
