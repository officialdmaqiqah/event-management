ALTER TABLE public.pengajuan_peminjaman
ADD COLUMN IF NOT EXISTS nama_ustadz TEXT,
ADD COLUMN IF NOT EXISTS judul_kajian TEXT;

ALTER TABLE public.event_requests
ADD COLUMN IF NOT EXISTS nama_ustadz TEXT,
ADD COLUMN IF NOT EXISTS judul_kajian TEXT;

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
    catatan_tambahan,
    nama_ustadz,
    judul_kajian
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
    pengajuan_data->>'catatan_tambahan',
    pengajuan_data->>'nama_ustadz',
    pengajuan_data->>'judul_kajian'
  )
  RETURNING id INTO new_id;

  -- Catat ke timeline
  INSERT INTO public.pengajuan_timeline (pengajuan_id, status_lama, status_baru, catatan, dibuat_oleh_nama)
  VALUES (new_id, NULL, 'submitted', 'Pengajuan diterima oleh sistem', 'Sistem');

  result := jsonb_build_object('id', new_id, 'nomor_pengajuan', new_nomor);
  RETURN result;
END;
$$;
