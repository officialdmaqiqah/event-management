-- Migrasi ke-22: Perbaikan Foreign Key Constraints untuk events dan participants
-- Mengubah referensi dari event_requests(id) menjadi pengajuan_peminjaman(id)
-- Karena aplikasi frontend masih menggunakan tabel pengajuan_peminjaman secara aktif.

-- 1. Perbaikan Foreign Key untuk tabel public.events
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_event_request_id_fkey;

ALTER TABLE public.events
  ADD CONSTRAINT events_event_request_id_fkey 
  FOREIGN KEY (event_request_id) 
  REFERENCES public.pengajuan_peminjaman(id) 
  ON DELETE SET NULL;

-- 2. Perbaikan Foreign Key untuk tabel public.participants
ALTER TABLE public.participants
  DROP CONSTRAINT IF EXISTS participants_event_request_id_fkey;

ALTER TABLE public.participants
  ADD CONSTRAINT participants_event_request_id_fkey 
  FOREIGN KEY (event_request_id) 
  REFERENCES public.pengajuan_peminjaman(id) 
  ON DELETE SET NULL;
