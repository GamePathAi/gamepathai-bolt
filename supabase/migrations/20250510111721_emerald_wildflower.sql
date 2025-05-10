-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own logs and system logs" ON security_logs;
DROP POLICY IF EXISTS "Users can read their own logs and system logs" ON security_logs;
DROP POLICY IF EXISTS "Service role has full access" ON security_logs;
DROP POLICY IF EXISTS "Users can insert their own security logs" ON security_logs;
DROP POLICY IF EXISTS "Users can read their own security logs" ON security_logs;
DROP POLICY IF EXISTS "Service role has full access to security logs" ON security_logs;

-- Enable RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own logs and system logs
CREATE POLICY "Users can insert security logs"
  ON security_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to read their own logs and system logs
CREATE POLICY "Users can read security logs"
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
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);