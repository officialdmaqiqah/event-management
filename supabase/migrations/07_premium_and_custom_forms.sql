-- Migration script for Premium Features and Custom Forms

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    is_premium BOOLEAN DEFAULT false,
    wa_api_key TEXT,
    wa_sender_id TEXT,
    wa_message_template TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profiles
CREATE POLICY "Users can manage own profile" ON public.user_profiles
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Superadmin can manage all profiles
CREATE POLICY "Superadmin can manage all profiles" ON public.user_profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email LIKE 'yahya%'
        )
    );

-- Trigger to automatically create a user_profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- For existing users, insert them manually
INSERT INTO public.user_profiles (user_id, email)
SELECT id, email FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 2. Add custom fields to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb;

-- 3. Add custom responses to participants
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS custom_responses JSONB DEFAULT '{}'::jsonb;

-- 4. Enable a secure function to let the backend read user_profile without RLS issues during webhook/API
CREATE OR REPLACE FUNCTION get_user_profile_by_event(evt_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_val JSONB;
BEGIN
  SELECT row_to_json(up)::jsonb INTO profile_val
  FROM user_profiles up
  JOIN events e ON e.user_id = up.user_id
  WHERE e.id = evt_id;
  
  RETURN profile_val;
END;
$$;
