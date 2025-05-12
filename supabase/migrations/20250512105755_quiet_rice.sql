/*
  # Create security_audit_logs table

  1. New Table
    - `security_audit_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `event_type` (text)
      - `event_data` (jsonb)
      - `ip_address` (text)
      - `user_agent` (text)
      - `geolocation` (jsonb)
      - `severity` (text)
      - `status` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for service role access
    - Add cleanup function for old logs
*/

CREATE TABLE IF NOT EXISTS security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  event_data jsonb NOT NULL DEFAULT '{}',
  ip_address text,
  user_agent text,
  geolocation jsonb,
  severity text NOT NULL DEFAULT 'info',
  status text NOT NULL DEFAULT 'unresolved',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  CONSTRAINT valid_status CHECK (status IN ('unresolved', 'resolved', 'ignored'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_severity ON security_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs(created_at);

-- Enable RLS
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role has full access"
  ON security_audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM security_audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND severity NOT IN ('error', 'critical');
END;
$$;