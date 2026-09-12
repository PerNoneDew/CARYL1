/*
# Add missing app_settings columns and function hall photos table

1. Modified Tables
   - `app_settings`: Adds all columns that the application expects but were missing:
     - `admin_name` (text) — admin display name
     - `check_in_time` (text) — default check-in time
     - `check_out_time` (text) — default check-out time
     - `cancellation_policy` (text) — booking cancellation policy
     - `pool_operating_hours` (text) — swimming pool hours
     - `function_hall_image_url` (text) — main function hall photo (base64 data URL)
     - `function_hall_tables` (integer) — number of available tables
     - `function_hall_chairs` (integer) — number of available chairs
     - `function_hall_schedule_start` (text) — hall operating start time
     - `function_hall_schedule_end` (text) — hall operating end time

2. New Tables
   - `function_hall_photos`
     - `id` (uuid, primary key)
     - `image_url` (text, not null) — base64 data URL of the photo
     - `caption` (text) — optional caption
     - `sort_order` (integer, default 0) — display order
     - `created_at` (timestamptz)

3. Security
   - RLS enabled on `function_hall_photos`
   - CRUD policies for anon + authenticated (single-tenant admin app, no user-scoped data)
*/

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS admin_name text,
  ADD COLUMN IF NOT EXISTS check_in_time text,
  ADD COLUMN IF NOT EXISTS check_out_time text,
  ADD COLUMN IF NOT EXISTS cancellation_policy text,
  ADD COLUMN IF NOT EXISTS pool_operating_hours text,
  ADD COLUMN IF NOT EXISTS function_hall_image_url text,
  ADD COLUMN IF NOT EXISTS function_hall_tables integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS function_hall_chairs integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS function_hall_schedule_start text,
  ADD COLUMN IF NOT EXISTS function_hall_schedule_end text;

CREATE TABLE IF NOT EXISTS function_hall_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  caption text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE function_hall_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_function_hall_photos" ON function_hall_photos;
CREATE POLICY "anon_select_function_hall_photos"
  ON function_hall_photos FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_function_hall_photos" ON function_hall_photos;
CREATE POLICY "anon_insert_function_hall_photos"
  ON function_hall_photos FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_function_hall_photos" ON function_hall_photos;
CREATE POLICY "anon_update_function_hall_photos"
  ON function_hall_photos FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_function_hall_photos" ON function_hall_photos;
CREATE POLICY "anon_delete_function_hall_photos"
  ON function_hall_photos FOR DELETE
  TO anon, authenticated USING (true);