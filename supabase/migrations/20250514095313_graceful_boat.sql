/*
  # Fix download events policy

  1. Changes
    - Drop existing download events policy if it exists
    - Recreate policy with proper permissions
    - Ensure idempotent migration

  2. Security
    - Maintains existing security model
    - Allows authenticated and anonymous users to create download events
    - Allows authenticated users to view their own download events
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow download event creation" ON public.download_events;

-- Recreate the policy with proper permissions
CREATE POLICY "Allow download event creation" ON public.download_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure view policy exists for authenticated users
DROP POLICY IF EXISTS "Allow users to view their own download events" ON public.download_events;

CREATE POLICY "Allow users to view their own download events" ON public.download_events
  FOR SELECT
  TO authenticated
  USING ((user_id = auth.uid()) OR (user_id IS NULL));