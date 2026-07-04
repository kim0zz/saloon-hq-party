
CREATE POLICY "party avatars all" ON storage.objects FOR ALL
  USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "party photos all" ON storage.objects FOR ALL
  USING (bucket_id = 'party-photos') WITH CHECK (bucket_id = 'party-photos');
