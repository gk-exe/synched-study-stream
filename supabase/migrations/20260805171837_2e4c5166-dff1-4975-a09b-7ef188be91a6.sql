CREATE POLICY "companion assets read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'companion-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "companion assets insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'companion-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "companion assets update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'companion-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "companion assets delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'companion-assets' AND auth.uid()::text = (storage.foldername(name))[1]);