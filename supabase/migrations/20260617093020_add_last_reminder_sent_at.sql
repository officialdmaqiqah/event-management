-- Tambahkan kolom last_reminder_sent_at untuk melacak pengiriman WA reminder
ALTER TABLE public.pengajuan_peminjaman 
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP WITH TIME ZONE;
