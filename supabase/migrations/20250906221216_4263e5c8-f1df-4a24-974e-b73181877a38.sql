-- Storage policies for product-images bucket to fix image uploads
-- Allow public read
create policy "Public can view product images"
on storage.objects for select
using (bucket_id = 'product-images');

-- Allow authenticated users to upload
create policy "Authenticated users can upload product images"
on storage.objects for insert
with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- Allow authenticated users to update
create policy "Authenticated users can update product images"
on storage.objects for update
using (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- Allow authenticated users to delete
create policy "Authenticated users can delete product images"
on storage.objects for delete
using (bucket_id = 'product-images' and auth.role() = 'authenticated');