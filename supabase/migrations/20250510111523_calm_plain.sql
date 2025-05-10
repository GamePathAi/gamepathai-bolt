-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own logs and system logs" ON security_logs;
DROP POLICY IF EXISTS "Users can read their own logs and system logs" ON security_logs;
DROP POLICY IF EXISTS "Service role has full access" ON security_logs;

-- Enable RLS
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
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);