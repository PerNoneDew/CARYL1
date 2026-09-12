/*
# Add accepted_by_staff column to bookings and event_bookings

1. Purpose
   When a staff member accepts a cash/counter payment from a customer,
   the staff member's name is recorded so the admin can see who accepted the money.

2. New Columns
   - `bookings.accepted_by_staff` (text, nullable) — name of the staff who accepted the payment.
   - `event_bookings.accepted_by_staff` (text, nullable) — same for event bookings.

3. Security
   No new tables. No RLS policy changes needed — existing CRUD policies on
   bookings and event_bookings already cover the new column.
*/

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS accepted_by_staff text;
ALTER TABLE event_bookings ADD COLUMN IF NOT EXISTS accepted_by_staff text;
