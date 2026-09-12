INSERT INTO storage.buckets (id, name, public)
VALUES ('facility-service-images', 'facility-service-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "facility_service_images_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'facility-service-images');

CREATE POLICY "facility_service_images_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'facility-service-images');

CREATE POLICY "facility_service_images_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'facility-service-images')
  WITH CHECK (bucket_id = 'facility-service-images');

CREATE POLICY "facility_service_images_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'facility-service-images');