/*
# Create facility-service-images storage bucket

1. New Storage Bucket
- `facility-service-images` (public): stores photos for swimming pool and videoke services.
2. Security
- Adds RLS policies on storage.objects for the new bucket, mirroring the existing cottage-images policies:
  - SELECT (public read)
  - INSERT (anon + authenticated)
  - UPDATE (anon + authenticated)
  - DELETE (anon + authenticated)
3. Notes
- Idempotent: bucket creation uses IF NOT EXISTS; policies are dropped before creation.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('facility-service-images', 'facility-service-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_select_facility_service_images" ON storage.objects;
CREATE POLICY "anon_select_facility_service_images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'facility-service-images');

DROP POLICY IF EXISTS "anon_insert_facility_service_images" ON storage.objects;
CREATE POLICY "anon_insert_facility_service_images" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'facility-service-images');

DROP POLICY IF EXISTS "anon_update_facility_service_images" ON storage.objects;
CREATE POLICY "anon_update_facility_service_images" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'facility-service-images')
  WITH CHECK (bucket_id = 'facility-service-images');

DROP POLICY IF EXISTS "anon_delete_facility_service_images" ON storage.objects;
CREATE POLICY "anon_delete_facility_service_images" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'facility-service-images');
