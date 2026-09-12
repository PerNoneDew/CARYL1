/*
# Create facility_bookings table and add checked-in status to event_bookings

1. New Tables
- `facility_bookings` — stores swimming pool and videoke bookings
  - id (uuid PK)
  - facility_type ('swimming-pool' | 'videoke')
  - facility_id (uuid, nullable, FK to services)
  - facility_name (text, nullable)
  - guest_name (text)
  - guest_email (text)
  - guest_phone (text, nullable)
  - booking_date (date)
  - start_time (text, nullable)
  - end_time (text, nullable)
  - number_of_guests (int)
  - status ('pending' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled')
  - total_price (numeric)
  - payment_method ('counter' | 'gcash' | 'maya', nullable)
  - payment_reference (text, nullable)
  - payment_status ('pending' | 'completed' | 'cancelled', nullable)
  - transaction_screenshot (text, nullable)
  - created_at (timestamptz)

2. Modified Tables
- `event_bookings` — status constraint updated to include 'checked-in'

3. Security
- RLS enabled on facility_bookings
- CRUD policies for authenticated users (owner-scoped via guest_email is not feasible here; using authenticated access since this is a staff/admin-managed app)
*/

CREATE TABLE IF NOT EXISTS facility_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_type text NOT NULL CHECK (facility_type IN ('swimming-pool', 'videoke')),
  facility_id uuid,
  facility_name text,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text,
  booking_date date NOT NULL,
  start_time text,
  end_time text,
  number_of_guests integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked-in', 'completed', 'cancelled')),
  total_price numeric NOT NULL DEFAULT 0,
  payment_method text CHECK (payment_method IN ('counter', 'gcash', 'maya')),
  payment_reference text,
  payment_status text CHECK (payment_status IN ('pending', 'completed', 'cancelled')),
  transaction_screenshot text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE facility_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_facility_bookings" ON facility_bookings;
CREATE POLICY "authenticated_select_facility_bookings"
ON facility_bookings FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_facility_bookings" ON facility_bookings;
CREATE POLICY "authenticated_insert_facility_bookings"
ON facility_bookings FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_facility_bookings" ON facility_bookings;
CREATE POLICY "authenticated_update_facility_bookings"
ON facility_bookings FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_facility_bookings" ON facility_bookings;
CREATE POLICY "authenticated_delete_facility_bookings"
ON facility_bookings FOR DELETE
TO authenticated USING (true);

-- Also allow anon for customer-facing bookings
DROP POLICY IF EXISTS "anon_select_facility_bookings" ON facility_bookings;
CREATE POLICY "anon_select_facility_bookings"
ON facility_bookings FOR SELECT
TO anon USING (true);

DROP POLICY IF EXISTS "anon_insert_facility_bookings" ON facility_bookings;
CREATE POLICY "anon_insert_facility_bookings"
ON facility_bookings FOR INSERT
TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_facility_bookings" ON facility_bookings;
CREATE POLICY "anon_update_facility_bookings"
ON facility_bookings FOR UPDATE
TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_facility_bookings" ON facility_bookings;
CREATE POLICY "anon_delete_facility_bookings"
ON facility_bookings FOR DELETE
TO anon USING (true);

-- Update event_bookings status constraint to include 'checked-in'
ALTER TABLE event_bookings DROP CONSTRAINT IF EXISTS event_bookings_status_check;
ALTER TABLE event_bookings ADD CONSTRAINT event_bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'checked-in', 'completed', 'cancelled'));
