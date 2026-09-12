/*
# Fix missing columns for function hall image and event capacity

1. Adds `capacity` to `event_type_prices` — the app inserts this column when adding events.
2. Adds `function_hall_image_url` to `app_settings` — the app saves the hall photo URL here.
3. Idempotent: each ADD COLUMN IF NOT EXISTS.
*/

ALTER TABLE event_type_prices ADD COLUMN IF NOT EXISTS capacity integer;

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS function_hall_image_url text;
