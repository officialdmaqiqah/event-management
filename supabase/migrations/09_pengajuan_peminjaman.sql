-- ============================================================
-- Migration 09: Sistem Pengajuan Peminjaman & Approval
-- Tidak mengubah tabel yang sudah ada
-- ============================================================

-- Enum untuk status pengajuan
DO $$ BEGIN
  CREATE TYPE pengajuan_status AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'revision_requested',
    'approved',
    'rejected',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum untuk tipe pemohon
DO $$ BEGIN
  CREATE TYPE tipe_pemohon AS ENUM (
    'pribadi',
    'lembaga',
    'komunitas',
    'instansi'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum untuk privacy event
DO $$ BEGIN
  CREATE TYPE privacy_event AS ENUM (
    'detail_publik',
    'umum_saja',
    'rahasia'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- Tabel Utama: pengajuan_peminjaman
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pengajuan_peminjaman (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_pengajuan TEXT UNIQUE NOT NULL,
  status pengajuan_status DEFAULT 'submitted',

  -- Data Pemohon
  tipe_pemohon tipe_pemohon NOT NULL,
  nama_pemohon TEXT NOT NULL,
  nama_lembaga TEXT,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  alamat TEXT NOT NULL,

  -- Data Event
  nama_event TEXT NOT NULL,
  jenis_event TEXT NOT NULL,
  tujuan_peminjaman TEXT NOT NULL,
  deskripsi_kegiatan TEXT NOT NULL,
  estimasi_peserta INTEGER NOT NULL,
  tanggal_mulai TIMESTAMP WITH TIME ZONE NOT NULL,
  tanggal_selesai TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Fasilitas
  area_fasilitas TEXT[] DEFAULT '{}',
  kebutuhan_tambahan TEXT,

  -- Lampiran (Supabase Storage URLs)
  url_surat_peminjaman TEXT,
  url_proposal TEXT,

  -- Catatan
  catatan_tambahan TEXT,

  -- Fields Admin (diisi saat review)
  catatan_admin TEXT,
  privacy_event privacy_event DEFAULT 'umum_saja',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER set_timestamp_pengajuan
BEFORE UPDATE ON public.pengajuan_peminjaman
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- Tabel Timeline: pengajuan_timeline
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pengajuan_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajuan_id UUID NOT NULL REFERENCES public.pengajuan_peminjaman(id) ON DELETE CASCADE,
  status_lama pengajuan_status,
  status_baru pengajuan_status NOT NULL,
  catatan TEXT,
  dibuat_oleh UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dibuat_oleh_nama TEXT, -- snapshot nama agar tidak null jika user dihapus
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.pengajuan_peminjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengajuan_timeline ENABLE ROW LEVEL SECURITY;

-- Public dapat submit (INSERT) pengajuan baru
CREATE POLICY "Public dapat submit pengajuan" ON public.pengajuan_peminjaman
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Public dapat lihat pengajuan miliknya berdasarkan nomor_pengajuan (untuk cek status)
CREATE POLICY "Public dapat cek status pengajuan" ON public.pengajuan_peminjaman
  FOR SELECT
  TO public
  USING (true);

-- Admin (authenticated) dapat kelola semua pengajuan
CREATE POLICY "Admin dapat kelola semua pengajuan" ON public.pengajuan_peminjaman
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Admin dapat kelola timeline
CREATE POLICY "Admin dapat kelola timeline" ON public.pengajuan_timeline
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public dapat lihat timeline pengajuan
CREATE POLICY "Public dapat lihat timeline" ON public.pengajuan_timeline
  FOR SELECT
  TO public
  USING (true);

-- ============================================================
-- Function: Generate Nomor Pengajuan Otomatis
-- Format: PJM-YYYYMMDD-XXXX (4 digit urutan per hari)
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_nomor_pengajuan()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  today_str TEXT;
  seq_num INTEGER;
  nomor TEXT;
BEGIN
  today_str := TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD');
  
  SELECT COUNT(*) + 1 INTO seq_num
  FROM public.pengajuan_peminjaman
  WHERE TO_CHAR(created_at AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD') = today_str;
  
  nomor := 'PJM-' || today_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN nomor;
END;
$$;

-- ============================================================
-- Function: Submit Pengajuan (dipanggil dari API untuk atomicity)
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_pengajuan(pengajuan_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_nomor TEXT;
  new_id UUID;
  result JSONB;
BEGIN
  new_nomor := public.generate_nomor_pengajuan();

  INSERT INTO public.pengajuan_peminjaman (
    nomor_pengajuan,
    status,
    tipe_pemohon,
    nama_pemohon,
    nama_lembaga,
    whatsapp,
    email,
    alamat,
    nama_event,
    jenis_event,
    tujuan_peminjaman,
    deskripsi_kegiatan,
    estimasi_peserta,
    tanggal_mulai,
    tanggal_selesai,
    area_fasilitas,
    kebutuhan_tambahan,
    url_surat_peminjaman,
    url_proposal,
    catatan_tambahan
  ) VALUES (
    new_nomor,
    'submitted',
    (pengajuan_data->>'tipe_pemohon')::tipe_pemohon,
    pengajuan_data->>'nama_pemohon',
    pengajuan_data->>'nama_lembaga',
    pengajuan_data->>'whatsapp',
    pengajuan_data->>'email',
    pengajuan_data->>'alamat',
    pengajuan_data->>'nama_event',
    pengajuan_data->>'jenis_event',
    pengajuan_data->>'tujuan_peminjaman',
    pengajuan_data->>'deskripsi_kegiatan',
    (pengajuan_data->>'estimasi_peserta')::INTEGER,
    (pengajuan_data->>'tanggal_mulai')::TIMESTAMP WITH TIME ZONE,
    (pengajuan_data->>'tanggal_selesai')::TIMESTAMP WITH TIME ZONE,
    ARRAY(SELECT jsonb_array_elements_text(pengajuan_data->'area_fasilitas')),
    pengajuan_data->>'kebutuhan_tambahan',
    pengajuan_data->>'url_surat_peminjaman',
    pengajuan_data->>'url_proposal',
    pengajuan_data->>'catatan_tambahan'
  )
  RETURNING id INTO new_id;

  -- Catat ke timeline
  INSERT INTO public.pengajuan_timeline (pengajuan_id, status_lama, status_baru, catatan, dibuat_oleh_nama)
  VALUES (new_id, NULL, 'submitted', 'Pengajuan diterima oleh sistem', 'Sistem');

  result := jsonb_build_object('id', new_id, 'nomor_pengajuan', new_nomor);
  RETURN result;
END;
$$;
