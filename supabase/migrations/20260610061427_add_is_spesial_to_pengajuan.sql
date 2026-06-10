-- Migration: Add is_spesial to pengajuan_peminjaman
ALTER TABLE public.pengajuan_peminjaman 
ADD COLUMN is_spesial BOOLEAN DEFAULT FALSE;
