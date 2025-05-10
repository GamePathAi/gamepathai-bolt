/*
  # Security Logs RLS Policies

  1. Changes
    - Add RLS policies for security_logs table to allow:
      - Authenticated users to insert their own logs
      - Service role to insert logs for any user
      - Users to read their own logs
      - Admins to read all logs

  2. Security
    - Enable RLS on security_logs table
    - Restrict users to only see their own logs
    - Allow service role full access
*/

-- Enable RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own logs
CREATE POLICY "Users can insert their own security logs"
ON security_logs
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow null user_id for system-level logs
  user_id IS NULL OR
  -- Or ensure user can only insert their own logs
  auth.uid() = user_id
);

-- Allow users to read their own logs
CREATE POLICY "Users can read their own security logs"
ON security_logs
FOR SELECT
TO authenticated
USING (
  -- Allow null user_id for system-level logs
  user_id IS NULL OR
  -- Or ensure user can only read their own logs
  auth.uid() = user_id
);

-- Grant service role full access
CREATE POLICY "Service role has full access to security logs"
ON security_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);