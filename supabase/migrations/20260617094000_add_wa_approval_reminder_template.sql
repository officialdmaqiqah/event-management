DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
      AND column_name = 'wa_approval_reminder_template'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN wa_approval_reminder_template TEXT;
  END IF;
END $$;
