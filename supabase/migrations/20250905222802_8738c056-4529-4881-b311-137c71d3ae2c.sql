-- Storage policies for product-images bucket to fix image uploads
-- Allow public read
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
create policy "Public can view product images"
on storage.objects for select
using (bucket_id = 'product-images');

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
create policy "Authenticated users can upload product images"
on storage.objects for insert
with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- Allow authenticated users to update
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
create policy "Authenticated users can update product images"
on storage.objects for update
using (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- Allow authenticated users to delete
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
create policy "Authenticated users can delete product images"
on storage.objects for delete
using (bucket_id = 'product-images' and auth.role() = 'authenticated');