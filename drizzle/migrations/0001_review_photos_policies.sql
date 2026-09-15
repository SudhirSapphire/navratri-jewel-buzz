CREATE POLICY "Anyone can upload review photos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'review-photos');

CREATE POLICY "Anyone can view review photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'review-photos');