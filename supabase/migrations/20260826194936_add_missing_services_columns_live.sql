/*
# Add missing columns to services table

1. Adds `status`, `image_url`, `duration_hours`, `operating_hours` columns to `services`.
2. These columns are expected by the application code (dbServiceToService / addService) but were never created.
3. Idempotent: each ADD COLUMN IF NOT EXISTS.
*/

ALTER TABLE services ADD COLUMN IF NOT EXISTS status text DEFAULT 'available';
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_hours integer;
ALTER TABLE services ADD COLUMN IF NOT EXISTS operating_hours text;

-- Backfill status for existing rows
UPDATE services SET status = CASE WHEN available = true THEN 'available' ELSE 'unavailable' END WHERE status IS NULL;
