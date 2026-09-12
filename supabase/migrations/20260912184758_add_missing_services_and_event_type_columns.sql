ALTER TABLE services
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS duration_hours integer,
  ADD COLUMN IF NOT EXISTS operating_hours text;

ALTER TABLE event_type_prices
  ADD COLUMN IF NOT EXISTS capacity integer;