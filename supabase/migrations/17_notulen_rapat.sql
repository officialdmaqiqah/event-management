-- 17_notulen_rapat.sql

-- 1. Tambahkan kolom pengajuan_id ke meeting_minutes
ALTER TABLE public.meeting_minutes 
ADD COLUMN IF NOT EXISTS pengajuan_id UUID REFERENCES public.pengajuan_peminjaman(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_pengajuan ON public.meeting_minutes(pengajuan_id);

-- 2. Buat Storage Bucket untuk dokumentasi rapat
INSERT INTO storage.buckets (id, name, public) 
VALUES ('meeting_documentation', 'meeting_documentation', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Setup RLS Policy untuk Storage Bucket
DROP POLICY IF EXISTS "meeting_documentation_public_access" ON storage.objects;
DROP POLICY IF EXISTS "meeting_documentation_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "meeting_documentation_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "meeting_documentation_auth_delete" ON storage.objects;

CREATE POLICY "meeting_documentation_public_access" ON storage.objects FOR SELECT USING ( bucket_id = 'meeting_documentation' );
CREATE POLICY "meeting_documentation_auth_insert" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'meeting_documentation' AND auth.role() = 'authenticated' );
CREATE POLICY "meeting_documentation_auth_update" ON storage.objects FOR UPDATE USING ( bucket_id = 'meeting_documentation' AND auth.role() = 'authenticated' );
CREATE POLICY "meeting_documentation_auth_delete" ON storage.objects FOR DELETE USING ( bucket_id = 'meeting_documentation' AND auth.role() = 'authenticated' );

-- 4. Pastikan tabel meeting_photos ada (dari migrasi sebelumnya, ditambahkan kolom keterangan)
-- Karena tabel meeting_photos sudah ada di migrasi 13, kita hanya perlu menambahkan kolom caption jika belum ada.
-- Di skema asli (migrasi 13), meeting_photos punya: id, meeting_minutes_id, photo_url, caption, uploaded_by.
-- Jadi kita tidak perlu buat ulang.
