-- ================================================
-- Dolphins Private SNS - Supabase Storage Policies
-- ================================================
-- このSQLをSupabase Dashboard > SQL Editorで実行してください
-- 前提: 'avatars', 'post-images', 'comment-images', 'hangouts', 'group-images', 'group-post-images' の6つのバケットが作成済みであること

-- ================================================
-- Clean up existing policies
-- ================================================

-- Drop ALL existing storage policies to ensure clean state
-- Use a more comprehensive approach to clean up all storage policies

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on storage.objects that contain these keywords
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND (policyname ILIKE '%avatar%' OR
               policyname ILIKE '%post%' OR
               policyname ILIKE '%comment%' OR
               policyname ILIKE '%hangout%' OR
               policyname ILIKE '%image%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    END LOOP;
END $$;

-- Also drop specific known policies just in case
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;

DROP POLICY IF EXISTS "Comment images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload comment images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own comment images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own comment images" ON storage.objects;

DROP POLICY IF EXISTS "Hangout images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload hangout images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own hangout images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own hangout images" ON storage.objects;

-- ================================================
-- Avatars Bucket Policies
-- ================================================

-- Allow anyone to read avatar images
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ================================================
-- Post Images Bucket Policies
-- ================================================

-- Allow anyone to read post images
CREATE POLICY "Post images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- Allow authenticated users to upload post images
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own post images
CREATE POLICY "Users can update their own post images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own post images
CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ================================================
-- Comment Images Bucket Policies
-- ================================================

-- Allow anyone to read comment images
CREATE POLICY "Comment images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'comment-images');

-- Allow authenticated users to upload comment images
CREATE POLICY "Authenticated users can upload comment images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'comment-images'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own comment images
CREATE POLICY "Users can update their own comment images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'comment-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own comment images
CREATE POLICY "Users can delete their own comment images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'comment-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ================================================
-- Hangouts Images Bucket Policies
-- ================================================

-- Allow anyone to read hangout images
CREATE POLICY "Hangout images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'hangouts');

-- Allow authenticated users to upload hangout images
CREATE POLICY "Authenticated users can upload hangout images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hangouts'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own hangout images
CREATE POLICY "Users can update their own hangout images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hangouts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own hangout images
CREATE POLICY "Users can delete their own hangout images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hangouts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ================================================
-- Group Images Bucket Policies
-- ================================================

-- Allow anyone to read group images
CREATE POLICY "Group images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'group-images');

-- Allow authenticated users to upload group images
CREATE POLICY "Authenticated users can upload group images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'group-images'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own group images
CREATE POLICY "Users can update their own group images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'group-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own group images
CREATE POLICY "Users can delete their own group images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'group-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ================================================
-- Group Post Images Bucket Policies
-- ================================================

-- Allow anyone to read group post images
CREATE POLICY "Group post images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'group-post-images');

-- Allow authenticated users to upload group post images
CREATE POLICY "Authenticated users can upload group post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'group-post-images'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own group post images
CREATE POLICY "Users can update their own group post images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'group-post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own group post images
CREATE POLICY "Users can delete their own group post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'group-post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ================================================
-- Setup Complete!
-- ================================================
