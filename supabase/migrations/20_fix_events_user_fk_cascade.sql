-- Drop existing foreign key without cascade
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_user_id_fkey;

-- Re-add with ON DELETE CASCADE
ALTER TABLE public.events
  ADD CONSTRAINT events_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;
