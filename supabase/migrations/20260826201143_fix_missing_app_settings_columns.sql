/*
# Fix missing app_settings columns

The handleSetBusinessInfo function updates ALL these columns in a single
UPDATE call. Five columns were missing from app_settings, causing EVERY
business info save (hall image, inventory, pool hours, etc.) to fail.
*/

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS admin_name text;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS check_in_time text;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS check_out_time text;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS cancellation_policy text;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS pool_operating_hours text;
