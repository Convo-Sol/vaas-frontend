# Supabase Storage Bucket Fix - TODO

## Problem
The application is getting "Bucket not found" error when trying to upload logos to Supabase storage. The bucket "brand_logo" doesn't exist.

## Steps to Fix

### ✅ Completed
- [x] Create SQL migration to create the 'brand_logo' bucket
- [x] Add storage policies for authenticated users to upload files
- [x] Add public read access policy for logo display

### 🔄 Next Steps
- [ ] Run the migration to create the bucket
- [ ] Test the client creation functionality with logo upload
- [ ] Verify that logos can be displayed publicly

## Migration File Created
`supabase/migrations/20250102000000_create_brand_logo_bucket.sql`

## Testing Instructions
1. Run the migration: `supabase db reset` or apply the migration
2. Test creating a new business client with a logo upload
3. Verify the logo appears correctly in the application

## Notes
- The bucket is set to public for read access so logos can be displayed on websites
- Authenticated users can upload, update, and delete their own logo files
- The migration also includes optional checks for email and image_url columns for completeness
