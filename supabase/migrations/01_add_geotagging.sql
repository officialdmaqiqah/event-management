-- Menambahkan kolom pengaturan registrasi dan geotagging
ALTER TABLE events
ADD COLUMN requires_registration BOOLEAN DEFAULT TRUE,
ADD COLUMN latitude NUMERIC,
ADD COLUMN longitude NUMERIC,
ADD COLUMN radius_meters INTEGER DEFAULT 100;
