/*
  # Security Logs RLS Policy Update

  1. Changes
    - Enable RLS on security_logs table
    - Add policies for authenticated users to:
      - Insert their own logs and system logs
      - Read their own logs and system logs
    - Add policy for service role to have full access
  
  2. Security
    - Ensures users can only access their own logs
    - Allows system-level logging (user_id is null)
    - Grants necessary permissions to service role
*/

ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own logs and system logs
CREATE POLICY "Users can insert their own logs and system logs"
  ON security_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR 
    user_id IS NULL
  );

-- Allow users to read their own logs and system logs
CREATE POLICY "Users can read their own logs and system logs"
  ON security_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    user_id IS NULL
  );

-- Grant full access to service role
CREATE POLICY "Service role has full access"
  ON security_logs
  TO service_role
  USING (true)
  WITH CHECK (true);