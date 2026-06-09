-- Add whatsapp column to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
