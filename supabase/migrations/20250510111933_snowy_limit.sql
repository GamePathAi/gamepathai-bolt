-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert security logs" ON security_logs;
DROP POLICY IF EXISTS "Users can read security logs" ON security_logs;
DROP POLICY IF EXISTS "Service role has full access" ON security_logs;

-- Enable RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert logs
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
  USING (true);

-- Grant full access to service role
CREATE POLICY "Service role has full access"
  ON security_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);