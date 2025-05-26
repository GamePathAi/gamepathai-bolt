/*
  # Security and User Profile Tables

  1. New Tables
    - `security_logs` - Logs security-related events
    - `user_profiles` - Stores user profile information
    - `security_audit_logs` - Logs security audit events
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Create indexes for better performance
  
  3. Functions and Triggers
    - Functions for updating timestamps
    - Functions for handling new users
    - Functions for monitoring security events
*/

-- Create security logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  xp BIGINT DEFAULT 0,
  level INTEGER DEFAULT 1,
  games_optimized INTEGER DEFAULT 0,
  total_usage_hours INTEGER DEFAULT 0,
  average_improvement NUMERIC(5,2) DEFAULT 0.0,
  trial_started_at TIMESTAMPTZ DEFAULT now(),
  trial_ended_at TIMESTAMPTZ,
  is_pro BOOLEAN DEFAULT false,
  trial_end_date TIMESTAMPTZ,
  trial_status TEXT DEFAULT 'active',
  conversion_date TIMESTAMPTZ,
  pricing_plan TEXT,
  payment_method JSONB,
  subscription_status TEXT,
  trial_extensions JSONB DEFAULT '[]'::jsonb,
  CONSTRAINT unique_user_profile UNIQUE (user_id),
  CONSTRAINT valid_trial_status CHECK (trial_status IN ('active', 'expired', 'converted'))
);

-- Create security audit logs table
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  geolocation JSONB,
  severity TEXT NOT NULL DEFAULT 'info',
  status TEXT NOT NULL DEFAULT 'unresolved',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  CONSTRAINT valid_status CHECK (status IN ('unresolved', 'resolved', 'ignored'))
);

-- Enable RLS on security_logs
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on security_audit_logs
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for security_logs (check if they exist first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'security_logs' AND policyname = 'Allow authenticated insert access to security_logs'
  ) THEN
    CREATE POLICY "Allow authenticated insert access to security_logs" 
      ON security_logs FOR INSERT TO authenticated 
      WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'security_logs' AND policyname = 'Allow users to view their own security logs'
  ) THEN
    CREATE POLICY "Allow users to view their own security logs" 
      ON security_logs FOR SELECT TO authenticated 
      USING ((user_id = auth.uid()) OR (user_id IS NULL));
  END IF;
END
$$;

-- Create policies for user_profiles (check if they exist first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" 
      ON user_profiles FOR INSERT TO authenticated 
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile" 
      ON user_profiles FOR SELECT TO authenticated 
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" 
      ON user_profiles FOR UPDATE TO authenticated 
      USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Create policies for security_audit_logs (check if they exist first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'security_audit_logs' AND policyname = 'Service role has full access'
  ) THEN
    CREATE POLICY "Service role has full access" 
      ON security_audit_logs FOR ALL TO service_role 
      USING (true);
  END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_severity ON security_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs(created_at);

-- Create function to update user_profiles.updated_at on update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, display_name, trial_started_at, trial_ended_at, is_pro)
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1),
    now(),
    now() + interval '3 days',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create user profile on new user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
  END IF;
END
$$;

-- Create function to update user login
CREATE OR REPLACE FUNCTION update_user_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET 
    last_login = now(),
    login_count = login_count + 1
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to monitor failed logins
CREATE OR REPLACE FUNCTION monitor_failed_logins()
RETURNS TRIGGER AS $$
DECLARE
  recent_failures INT;
BEGIN
  -- Count recent failed login attempts
  SELECT COUNT(*) INTO recent_failures
  FROM security_logs
  WHERE 
    user_id = NEW.user_id 
    AND event_type = 'login_failure'
    AND created_at > now() - interval '15 minutes';
    
  -- If more than 5 failures in 15 minutes, log suspicious activity
  IF recent_failures >= 5 THEN
    INSERT INTO security_audit_logs (
      user_id,
      event_type,
      event_data,
      ip_address,
      user_agent,
      severity,
      status
    ) VALUES (
      NEW.user_id,
      'suspicious_activity',
      jsonb_build_object(
        'reason', 'Multiple failed login attempts',
        'count', recent_failures,
        'action', 'Account temporarily locked'
      ),
      NEW.ip_address,
      NEW.user_agent,
      'error',
      'unresolved'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for monitoring failed logins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'monitor_failed_logins_trigger'
  ) THEN
    CREATE TRIGGER monitor_failed_logins_trigger
    AFTER INSERT ON security_logs
    FOR EACH ROW
    WHEN (NEW.event_type = 'login_failure')
    EXECUTE FUNCTION monitor_failed_logins();
  END IF;
END
$$;

-- Create function to detect suspicious activity
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TRIGGER AS $$
DECLARE
  last_activity RECORD;
  time_diff INTERVAL;
  distance_km FLOAT;
BEGIN
  -- Get the user's last activity
  SELECT * INTO last_activity
  FROM user_activity_logs
  WHERE 
    user_id = NEW.user_id 
    AND id != NEW.id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If we have a previous activity, check for suspicious patterns
  IF FOUND THEN
    -- Calculate time difference
    time_diff := NEW.created_at - last_activity.created_at;
    
    -- If the time difference is very small for different locations, it's suspicious
    IF time_diff < interval '5 minutes' AND NEW.ip_address != last_activity.ip_address THEN
      INSERT INTO security_audit_logs (
        user_id,
        event_type,
        event_data,
        ip_address,
        user_agent,
        severity,
        status
      ) VALUES (
        NEW.user_id,
        'suspicious_activity',
        jsonb_build_object(
          'reason', 'Rapid location change',
          'previous_ip', last_activity.ip_address,
          'current_ip', NEW.ip_address,
          'time_difference_seconds', EXTRACT(EPOCH FROM time_diff)
        ),
        NEW.ip_address,
        NEW.user_agent,
        'warning',
        'unresolved'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO security_logs (
    user_id,
    event_type,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    NEW.id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'user_created'
      WHEN TG_OP = 'UPDATE' AND OLD.email != NEW.email THEN 'email_changed'
      WHEN TG_OP = 'UPDATE' AND OLD.encrypted_password != NEW.encrypted_password THEN 'password_changed'
      ELSE 'profile_updated'
    END,
    NEW.last_sign_in_ip,
    NULL, -- We don't have user agent in this context
    jsonb_build_object('timestamp', now())
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to check trial status
CREATE OR REPLACE FUNCTION check_trial_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If trial has ended and status is still active, update to expired
  IF NEW.trial_ended_at < now() AND NEW.trial_status = 'active' THEN
    NEW.trial_status := 'expired';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for trial status checking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'check_trial_status_trigger'
  ) THEN
    CREATE TRIGGER check_trial_status_trigger
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_trial_status();
  END IF;
END
$$;

-- Create function to notify about trial expiration
CREATE OR REPLACE FUNCTION notify_trial_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- If trial status changed from active to expired, create a notification
  IF OLD.trial_status = 'active' AND NEW.trial_status = 'expired' THEN
    -- In a real implementation, this would send an email or create a notification
    -- For now, we'll just log it
    INSERT INTO security_logs (
      user_id,
      event_type,
      metadata
    ) VALUES (
      NEW.user_id,
      'trial_expired',
      jsonb_build_object(
        'trial_started_at', NEW.trial_started_at,
        'trial_ended_at', NEW.trial_ended_at,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for trial expiration notification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'notify_trial_expiration_trigger'
  ) THEN
    CREATE TRIGGER notify_trial_expiration_trigger
    AFTER UPDATE ON user_profiles
    FOR EACH ROW
    WHEN (OLD.trial_status = 'active' AND NEW.trial_status = 'expired')
    EXECUTE FUNCTION notify_trial_expiration();
  END IF;
END
$$;