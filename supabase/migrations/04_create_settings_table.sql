CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins to full access
CREATE POLICY "Enable full access for authenticated users only" ON settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default WA Config
INSERT INTO settings (key, value) VALUES (
  'wa_config', 
  '{"api_key": "raRmjxN5P9CI7O63PKtFifPhZliRDf", "sender": "6285335150001", "is_enabled": true}'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Create a secure function to read config internally (bypasses RLS)
CREATE OR REPLACE FUNCTION get_wa_config()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config_val JSONB;
BEGIN
  SELECT value INTO config_val FROM settings WHERE key = 'wa_config';
  RETURN config_val;
END;
$$;
