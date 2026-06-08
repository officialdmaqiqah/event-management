-- 16_internal_attendance.sql

-- Drop the NOT NULL constraint from event_id so that attendance can be linked exclusively to event_request_id (internal rapat)
ALTER TABLE public.participants ALTER COLUMN event_id DROP NOT NULL;

-- Add check_in_method column to track how they checked in
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS check_in_method TEXT DEFAULT 'qr';

-- Ensure we have a policy for users to insert participants into their own rapat via the public self-checkin
-- (Participants table already has a policy for public to insert if event is published. We need to extend it for pengajuan)
-- Wait, the existing policy is:
-- CREATE POLICY "Public can insert participants" ON participants FOR INSERT TO public WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.id = participants.event_id AND events.status = 'published'));
-- We need to add one for event_request_id:
CREATE POLICY "Public can insert internal participants" ON public.participants
  FOR INSERT
  TO public
  WITH CHECK (
    event_request_id IS NOT NULL 
    -- Assuming if they have the link, they can insert.
  );
