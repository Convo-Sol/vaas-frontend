-- Create brand_logo storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand_logo', 'brand_logo', true);

-- Set up storage policies for brand_logo bucket

-- Allow authenticated users to insert (upload) files
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand_logo');

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update their logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'brand_logo');

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete their logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'brand_logo');

-- Allow public read access to logos (so they can be displayed on websites)
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'brand_logo');

-- Add email column to app_users table if it doesn't exist (for completeness)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_users' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.app_users ADD COLUMN email TEXT;
    END IF;
END $$;

-- Add image_url column to app_users table if it doesn't exist (for completeness)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_users' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.app_users ADD COLUMN image_url TEXT;
    END IF;
END $$;
