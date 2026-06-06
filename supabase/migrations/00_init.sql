-- Create custom types
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE participant_status AS ENUM ('registered', 'attended', 'cancelled');

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  agenda TEXT,
  location TEXT NOT NULL,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  quota INTEGER,
  status event_status DEFAULT 'draft',
  registration_slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  organization TEXT,
  ticket_quantity INTEGER DEFAULT 1,
  ticket_code TEXT UNIQUE NOT NULL,
  status participant_status DEFAULT 'registered',
  checked_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to automatically set updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set triggers for updated_at
CREATE TRIGGER set_timestamp_events
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_participants
BEFORE UPDATE ON participants
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Policies for events table

-- 1. Admin can do everything (Assuming admin uses Supabase Auth)
CREATE POLICY "Admin can manage all events" ON events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Public can read published events
CREATE POLICY "Public can view published events" ON events
  FOR SELECT
  TO public
  USING (status = 'published');

-- Policies for participants table

-- 1. Admin can do everything
CREATE POLICY "Admin can manage all participants" ON participants
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Public can insert participants for published events
CREATE POLICY "Public can insert participants" ON participants
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = participants.event_id 
      AND events.status = 'published'
    )
  );
