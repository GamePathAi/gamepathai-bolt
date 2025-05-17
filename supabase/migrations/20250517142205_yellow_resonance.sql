/*
  # Enhanced Security Audit System

  1. New Tables
    - `security_events` - Tracks all security-related events in the application
    - `user_activity_logs` - Tracks user activity for analytics and security monitoring
  
  2. Security
    - Enable RLS on new tables
    - Add policies for proper access control
    - Create functions for automated security monitoring
  
  3. Changes
    - Add additional security audit functions
    - Create triggers for automated security monitoring
*/

-- Create security events table for detailed security monitoring
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  source text NOT NULL,
  ip_address text,
  user_agent text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on security_events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Create policies for security_events
CREATE POLICY "Service role has full access to security events" 
  ON security_events 
  FOR ALL 
  TO service_role 
  USING (true);

CREATE POLICY "Users can view their own security events" 
  ON security_events 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

-- Create user activity logs table for behavior analysis
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on user_activity_logs
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for user_activity_logs
CREATE POLICY "Service role has full access to user activity logs" 
  ON user_activity_logs 
  FOR ALL 
  TO service_role 
  USING (true);

CREATE POLICY "Users can view their own activity logs" 
  ON user_activity_logs 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id uuid,
  p_event_type text,
  p_severity text,
  p_source text,
  p_details jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO security_events (
    user_id,
    event_type,
    severity,
    source,
    ip_address,
    user_agent,
    details,
    created_at
  ) VALUES (
    p_user_id,
    p_event_type,
    p_severity,
    p_source,
    current_setting('request.headers')::json->>'x-forwarded-for',
    current_setting('request.headers')::json->>'user-agent',
    p_details,
    now()
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Ensure function doesn't fail even if logging fails
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id uuid,
  p_activity_type text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO user_activity_logs (
    user_id,
    activity_type,
    resource_type,
    resource_id,
    details,
    ip_address,
    created_at
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_resource_type,
    p_resource_id,
    p_details,
    current_setting('request.headers')::json->>'x-forwarded-for',
    now()
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Ensure function doesn't fail even if logging fails
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to detect suspicious activity
CREATE OR REPLACE FUNCTION detect_suspicious_activity() RETURNS trigger AS $$
DECLARE
  v_recent_count integer;
  v_threshold integer := 10; -- Configurable threshold
BEGIN
  -- Count recent activities of the same type from the same user
  SELECT COUNT(*) INTO v_recent_count
  FROM user_activity_logs
  WHERE user_id = NEW.user_id
    AND activity_type = NEW.activity_type
    AND created_at > (now() - interval '5 minutes');
  
  -- If count exceeds threshold, log a security event
  IF v_recent_count > v_threshold THEN
    PERFORM log_security_event(
      NEW.user_id,
      'suspicious_activity_detected',
      'warning',
      'activity_monitor',
      jsonb_build_object(
        'activity_type', NEW.activity_type,
        'count', v_recent_count,
        'threshold', v_threshold,
        'time_window', '5 minutes'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for suspicious activity detection
CREATE TRIGGER detect_suspicious_activity_trigger
  AFTER INSERT ON user_activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION detect_suspicious_activity();

-- Create function to monitor failed login attempts
CREATE OR REPLACE FUNCTION monitor_failed_logins() RETURNS trigger AS $$
DECLARE
  v_recent_failures integer;
  v_threshold integer := 5; -- Configurable threshold
BEGIN
  IF NEW.event_type = 'login_failure' THEN
    -- Count recent failed login attempts for this user
    SELECT COUNT(*) INTO v_recent_failures
    FROM security_events
    WHERE user_id = NEW.user_id
      AND event_type = 'login_failure'
      AND created_at > (now() - interval '15 minutes');
    
    -- If count exceeds threshold, log a security event
    IF v_recent_failures >= v_threshold THEN
      PERFORM log_security_event(
        NEW.user_id,
        'brute_force_attempt',
        'critical',
        'login_monitor',
        jsonb_build_object(
          'failed_attempts', v_recent_failures,
          'threshold', v_threshold,
          'time_window', '15 minutes'
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for failed login monitoring
CREATE TRIGGER monitor_failed_logins_trigger
  AFTER INSERT ON security_events
  FOR EACH ROW
  EXECUTE FUNCTION monitor_failed_logins();

-- Create index for faster security event queries
CREATE INDEX IF NOT EXISTS idx_security_events_user_id_event_type
  ON security_events (user_id, event_type);

CREATE INDEX IF NOT EXISTS idx_security_events_created_at
  ON security_events (created_at);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id_activity_type
  ON user_activity_logs (user_id, activity_type);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at
  ON user_activity_logs (created_at);