-- Add user_id and image urls to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- For existing events, we might want to assign them to a default user, but it's safe to leave as null initially.

-- Enable Row Level Security (RLS) on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone can read published events (for the public registration page)
CREATE POLICY "Public can view published events"
ON public.events
FOR SELECT
USING (status = 'published');

-- Policy 2: Users can view their own events, OR anyone can view if they are superadmin.
-- We'll assume the app logic handles superadmin bypassing by using the service_role key, 
-- or we can write a policy for 'yahya'. But since Next.js uses server-side Supabase client, 
-- it often relies on app logic or the user session. 
-- For safety, we allow users to read/update/delete their own events:
CREATE POLICY "Users can manage their own events"
ON public.events
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Also allow superadmin (yahya) by email to view all events if needed.
-- Since email is in auth.users, we can do a subquery:
CREATE POLICY "Superadmin can manage all events"
ON public.events
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email LIKE 'yahya@%'
  )
);

-- ==========================================
-- STORAGE SETUP
-- ==========================================

-- Insert a bucket named 'event_assets'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event_assets', 'event_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public to read images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'event_assets' );

-- Policy to allow authenticated users to upload images
CREATE POLICY "Auth Users Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event_assets' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to update/delete their own images
-- (We use the user_id path trick, or just allow auth users to manage assets)
CREATE POLICY "Auth Users Manage"
ON storage.objects FOR UPDATE
USING ( auth.role() = 'authenticated' );

CREATE POLICY "Auth Users Delete"
ON storage.objects FOR DELETE
USING ( auth.role() = 'authenticated' );
