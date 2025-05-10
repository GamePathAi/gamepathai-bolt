/*
  # Fix security logs RLS policies

  1. Changes
    - Update RLS policies to allow service role to insert security logs
    - Add policy for unauthenticated security log creation
    - Modify existing policies to handle both authenticated and anonymous events

  2. Security
    - Maintain read restrictions to own logs for authenticated users
    - Allow creation of security logs for authentication events
    - Service role retains full access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Service role has full access" ON security_logs;
DROP POLICY IF EXISTS "Users can insert security logs" ON security_logs;
DROP POLICY IF EXISTS "Users can read own security logs" ON security_logs;
DROP POLICY IF EXISTS "Users can read security logs" ON security_logs;

-- Create new policies
CREATE POLICY "Service role has full access"
ON security_logs
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow security log creation for auth events"
ON security_logs
FOR INSERT
TO authenticated, anon
WITH CHECK (
  (user_id IS NULL) OR 
  (auth.uid() = user_id) OR
  (event_type IN ('signup', 'login', 'logout', 'password_reset'))
);

CREATE POLICY "Users can read own security logs"
ON security_logs
FOR SELECT
TO authenticated
USING (
  (user_id IS NULL AND event_type IN ('signup', 'login', 'logout', 'password_reset')) OR
  (auth.uid() = user_id)
);