-- ============================================================
-- Migration 10: Sistem Pengaturan Jenis Event & Approval Berjenjang
-- ============================================================

-- 1. Tabel Jenis Event
CREATE TABLE IF NOT EXISTS public.jenis_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  default_privacy privacy_event DEFAULT 'umum_saja',
  needs_approval BOOLEAN DEFAULT true,
  enable_notulen BOOLEAN DEFAULT false,
  enable_absensi BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger untuk updated_at jenis_event
CREATE TRIGGER set_timestamp_jenis_event
BEFORE UPDATE ON public.jenis_event
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Seed Data Awal Jenis Event
INSERT INTO public.jenis_event (name, default_privacy, needs_approval, enable_notulen, enable_absensi) VALUES
  ('Kajian umum', 'detail_publik', true, false, true),
  ('Seminar', 'detail_publik', true, false, true),
  ('Rapat internal', 'rahasia', true, true, false),
  ('Musyawarah', 'umum_saja', true, true, true),
  ('Rapat pengurus', 'umum_saja', true, true, false),
  ('Rapat divisi', 'umum_saja', true, true, false),
  ('Rapat panitia', 'umum_saja', true, true, false),
  ('Evaluasi kegiatan', 'umum_saja', true, true, false),
  ('Kegiatan komunitas', 'umum_saja', true, false, true),
  ('Kegiatan lembaga eksternal', 'umum_saja', true, false, true),
  ('Kegiatan VIP/protokoler', 'detail_publik', true, false, true),
  ('Kegiatan rahasia/internal', 'rahasia', true, true, false)
ON CONFLICT (name) DO NOTHING;

-- 2. Tambah kolom Jabatan di user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS jabatan TEXT;

-- 3. Tabel Workflow Approval per Jenis Event
CREATE TABLE IF NOT EXISTS public.workflow_approval (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis_event_id UUID NOT NULL REFERENCES public.jenis_event(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  jabatan TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_mandatory BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (jenis_event_id, level)
);

CREATE TRIGGER set_timestamp_workflow_approval
BEFORE UPDATE ON public.workflow_approval
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- 4. Tabel Log Keputusan Approval (pengajuan_approvals)
CREATE TABLE IF NOT EXISTS public.pengajuan_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajuan_id UUID NOT NULL REFERENCES public.pengajuan_peminjaman(id) ON DELETE CASCADE,
  workflow_level INTEGER NOT NULL,
  status TEXT NOT NULL, -- 'approved', 'rejected', 'revision_requested'
  catatan TEXT,
  approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_nama TEXT NOT NULL,
  approver_jabatan TEXT NOT NULL,
  decided_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (pengajuan_id, workflow_level)
);

-- 5. Tambah kolom current_approval_level di pengajuan_peminjaman
ALTER TABLE public.pengajuan_peminjaman ADD COLUMN IF NOT EXISTS current_approval_level INTEGER DEFAULT 1;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.jenis_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_approval ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengajuan_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Jenis Event
CREATE POLICY "Public dapat melihat jenis event aktif" ON public.jenis_event
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admin dapat mengelola jenis event" ON public.jenis_event
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Workflow Approval
CREATE POLICY "Admin dapat mengelola workflow approval" ON public.workflow_approval
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public dapat melihat workflow approval" ON public.workflow_approval
  FOR SELECT TO public USING (is_active = true);

-- RLS Pengajuan Approvals
CREATE POLICY "Admin dapat mengelola pengajuan approvals" ON public.pengajuan_approvals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public dapat melihat hasil approvals" ON public.pengajuan_approvals
  FOR SELECT TO public USING (true);
