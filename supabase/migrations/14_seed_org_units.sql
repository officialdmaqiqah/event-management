-- ============================================================
-- Migration 14: Seed Unit/Bidang Organisasi DKM & Pemuda MAKT
-- Irmas dibiarkan kosong untuk diisi via UI admin
-- Semua INSERT pakai ON CONFLICT DO NOTHING — aman dijalankan ulang
-- ============================================================

-- ============================================================
-- STEP 1: Seed unit DKM (Badan Pengelola MAKT)
-- ============================================================
DO $$
DECLARE
  dkm_id UUID;
  pemuda_id UUID;
  unit_id UUID;
BEGIN

  -- Ambil ID DKM
  SELECT id INTO dkm_id FROM public.organizations
  WHERE type = 'dkm' AND name ILIKE '%pengelola%'
  LIMIT 1;

  IF dkm_id IS NULL THEN
    RAISE NOTICE 'DKM tidak ditemukan, skip seed unit DKM';
  ELSE
    -- Unit-unit DKM
    INSERT INTO public.organization_units (organization_id, name, type, description, is_active)
    VALUES
      (dkm_id, 'Dewan Pembina',   'dewan',          'Dewan pembina organisasi DKM MAKT', true),
      (dkm_id, 'Dewan Pengawas',  'dewan',          'Dewan pengawas kegiatan DKM MAKT',  true),
      (dkm_id, 'Dewan Syariah',   'dewan',          'Dewan syariah DKM MAKT',            true),
      (dkm_id, 'Badan Pelaksana', 'badan_pelaksana','Badan pelaksana harian DKM MAKT',   true),
      (dkm_id, 'Bidang Idarah',   'bidang',         'Bidang administrasi dan manajemen', true),
      (dkm_id, 'Bidang Imarah',   'bidang',         'Bidang kemakmuran dan pembinaan jamaah', true),
      (dkm_id, 'Bidang Riayah',   'bidang',         'Bidang pemeliharaan dan sarana prasarana', true),
      (dkm_id, 'Bidang Pendidikan, Pemberdayaan Perempuan dan Peranan Wanita', 'bidang', 'Bidang pendidikan dan pemberdayaan perempuan', true),
      (dkm_id, 'Bidang Kerja Sama Antar Lembaga', 'bidang', 'Bidang hubungan dan kerja sama dengan lembaga lain', true)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✓ Seed % unit untuk DKM', 9;
  END IF;

  -- ============================================================
  -- STEP 2: Seed unit Pemuda MAKT
  -- ============================================================
  SELECT id INTO pemuda_id FROM public.organizations
  WHERE type = 'pemuda'
  LIMIT 1;

  IF pemuda_id IS NULL THEN
    RAISE NOTICE 'Pemuda MAKT tidak ditemukan, skip seed unit Pemuda';
  ELSE
    INSERT INTO public.organization_units (organization_id, name, type, description, is_active)
    VALUES
      (pemuda_id, 'Pembina',                                    'pembina',        'Pembina organisasi Pemuda MAKT',                                        true),
      (pemuda_id, 'Pimpinan Harian',                            'pimpinan_harian','Pimpinan harian Pemuda MAKT',                                           true),
      (pemuda_id, 'Bidang Media dan Kreatif',                   'bidang',         'Bidang media, dokumentasi, dan konten kreatif',                         true),
      (pemuda_id, 'Bidang Dakwah dan Kajian',                   'bidang',         'Bidang dakwah, kajian agama, dan pendidikan',                           true),
      (pemuda_id, 'Bidang Ekonomi, Entrepreneurship dan Kemandirian', 'bidang',   'Bidang ekonomi, kewirausahaan, dan kemandirian anggota',                true),
      (pemuda_id, 'Bidang Sosial dan Kerelawanan',              'bidang',         'Bidang sosial kemasyarakatan dan kegiatan kerelawanan',                  true)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✓ Seed % unit untuk Pemuda MAKT', 6;
  END IF;

  -- ============================================================
  -- STEP 3: Seed jabatan umum per organisasi
  -- ============================================================

  -- Jabatan DKM
  IF dkm_id IS NOT NULL THEN
    INSERT INTO public.positions (organization_id, name, level_order, is_approver, is_active)
    VALUES
      (dkm_id, 'Ketua Umum',             1, true,  true),
      (dkm_id, 'Wakil Ketua',            2, true,  true),
      (dkm_id, 'Sekretaris Umum',        3, false, true),
      (dkm_id, 'Bendahara Umum',         4, false, true),
      (dkm_id, 'Ketua Bidang',           5, true,  true),
      (dkm_id, 'Sekretaris Bidang',      6, false, true),
      (dkm_id, 'Anggota',                9, false, true)
    ON CONFLICT DO NOTHING;
    RAISE NOTICE '✓ Seed jabatan untuk DKM';
  END IF;

  -- Jabatan Pemuda MAKT
  IF pemuda_id IS NOT NULL THEN
    INSERT INTO public.positions (organization_id, name, level_order, is_approver, is_active)
    VALUES
      (pemuda_id, 'Ketua Umum',          1, true,  true),
      (pemuda_id, 'Wakil Ketua',         2, true,  true),
      (pemuda_id, 'Sekretaris Umum',     3, false, true),
      (pemuda_id, 'Bendahara Umum',      4, false, true),
      (pemuda_id, 'Ketua Bidang',        5, true,  true),
      (pemuda_id, 'Anggota Bidang',      6, false, true),
      (pemuda_id, 'Anggota',             9, false, true)
    ON CONFLICT DO NOTHING;
    RAISE NOTICE '✓ Seed jabatan untuk Pemuda MAKT';
  END IF;

  RAISE NOTICE '=== Migration 14 SELESAI ===';

END $$;
