/*
# Add function hall inventory and schedule columns

1. Modified Tables
- `app_settings`: adds columns for function hall inventory (tables, chairs/benches) and available time schedule.
  - `function_hall_tables` (integer, default 0): number of tables available in the function hall.
  - `function_hall_chairs` (integer, default 0): number of chairs/benches available in the function hall.
  - `function_hall_schedule_start` (text, nullable): start of available operating time for the function hall (e.g. "08:00").
  - `function_hall_schedule_end` (text, nullable): end of available operating time for the function hall (e.g. "22:00").
2. Security
- No new tables; existing RLS policies on `app_settings` remain unchanged.
3. Notes
- All columns are nullable or have safe defaults so existing rows are unaffected.
- Idempotent: uses DO $$ ... IF NOT EXISTS ... END $$ blocks.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'function_hall_tables') THEN
    ALTER TABLE app_settings ADD COLUMN function_hall_tables integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'function_hall_chairs') THEN
    ALTER TABLE app_settings ADD COLUMN function_hall_chairs integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'function_hall_schedule_start') THEN
    ALTER TABLE app_settings ADD COLUMN function_hall_schedule_start text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'function_hall_schedule_end') THEN
    ALTER TABLE app_settings ADD COLUMN function_hall_schedule_end text;
  END IF;
END $$;
