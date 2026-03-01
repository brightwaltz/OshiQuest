-- ============================================================
-- OshiQuest: フェーズ1 Storage Buckets
-- ============================================================

-- Create buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('activity-photos', 'activity-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('oshi-images', 'oshi-images', true) ON CONFLICT DO NOTHING;

-- RLS policies for activity-photos
CREATE POLICY "Public Access for activity-photos" ON storage.objects FOR SELECT USING ( bucket_id = 'activity-photos' );
CREATE POLICY "Auth Insert for activity-photos" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'activity-photos' AND auth.role() = 'authenticated' );

-- RLS policies for oshi-images
CREATE POLICY "Public Access for oshi-images" ON storage.objects FOR SELECT USING ( bucket_id = 'oshi-images' );
CREATE POLICY "Auth Insert for oshi-images" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'oshi-images' AND auth.role() = 'authenticated' );
