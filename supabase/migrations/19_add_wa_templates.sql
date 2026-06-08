-- ============================================================
-- Migration 19: Add Comprehensive WA Templates
-- ============================================================

DO $$
BEGIN
  -- 1. wa_approval_request_template
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
      AND column_name = 'wa_approval_request_template'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN wa_approval_request_template TEXT;
  END IF;

  -- 2. wa_approval_result_template
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
      AND column_name = 'wa_approval_result_template'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN wa_approval_result_template TEXT;
  END IF;

  -- 3. wa_reminder_template
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
      AND column_name = 'wa_reminder_template'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN wa_reminder_template TEXT;
  END IF;

  -- 4. wa_minutes_template
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
      AND column_name = 'wa_minutes_template'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN wa_minutes_template TEXT;
  END IF;
END $$;
