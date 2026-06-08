-- Add is_approved column to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Set existing users to approved so they don't lose access
UPDATE public.user_profiles SET is_approved = true WHERE is_approved = false;

-- Create an RPC to safely delete user from auth.users (cascades to user_profiles and events)
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the caller is the superadmin
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email IN ('officialsiyoyok@gmail.com', 'yahya@example.com')
  ) THEN
    -- Delete the user from auth.users. 
    -- This relies on ON DELETE CASCADE constraints to clean up public schema records.
    DELETE FROM auth.users WHERE id = target_user_id;
    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'Not authorized to delete users';
  END IF;
END;
$$;
