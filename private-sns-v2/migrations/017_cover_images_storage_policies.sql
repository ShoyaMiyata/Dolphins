-- Cover Images Storage Policies

-- Create cover-images bucket if not exists (run this in Supabase Dashboard Storage section)
-- Bucket name: cover-images
-- Public: true

-- Allow authenticated users to upload their own cover images
CREATE POLICY "Users can upload their own cover images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cover-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own cover images
CREATE POLICY "Users can update their own cover images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cover-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own cover images
CREATE POLICY "Users can delete their own cover images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cover-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public to view all cover images
CREATE POLICY "Cover images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cover-images');
