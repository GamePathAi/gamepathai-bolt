/*
  # Authentication System Setup

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `display_name` (text)
      - `avatar_url` (text)
      - `preferences` (jsonb)
      - `last_login` (timestamptz)
      - `login_count` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `security_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `event_type` (text)
      - `ip_address` (text)
      - `user_agent` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for secure data access
    - Add audit logging triggers
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name text,
  avatar_url text,
  preferences jsonb DEFAULT '{}'::jsonb,
  last_login timestamptz,
  login_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- Create security_logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for security_logs
CREATE POLICY "Users can read own security logs"
  ON security_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update last_login and login_count
CREATE OR REPLACE FUNCTION update_user_login()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (user_id, last_login, login_count)
  VALUES (NEW.id, now(), 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_login = now(),
    login_count = user_profiles.login_count + 1,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for login tracking
CREATE TRIGGER on_auth_user_login
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_login();

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id uuid,
  p_event_type text,
  p_ip_address text,
  p_user_agent text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO security_logs (
    user_id,
    event_type,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    p_event_type,
    p_ip_address,
    p_user_agent,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for faster queries
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at);