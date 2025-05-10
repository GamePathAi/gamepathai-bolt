-- Drop existing trigger first to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function with proper RLS bypass and error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _now timestamp with time zone := now();
BEGIN
  -- Temporarily disable RLS for this transaction
  SET LOCAL session_replication_role = 'replica';
  
  -- Create user profile with all required fields and proper defaults
  INSERT INTO public.user_profiles (
    user_id,
    display_name,
    avatar_url,
    preferences,
    last_login,
    login_count,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1),
    NULL,
    '{}'::jsonb,
    _now,
    0,
    _now,
    _now
  );

  -- Create initial security log entry
  INSERT INTO public.security_logs (
    user_id,
    event_type,
    ip_address,
    user_agent,
    metadata,
    created_at
  )
  VALUES (
    NEW.id,
    'account_created',
    'unknown',
    'system',
    jsonb_build_object('email', NEW.email),
    _now
  );

  -- Reset RLS to normal mode
  SET LOCAL session_replication_role = 'origin';
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details but don't prevent user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Modify security_logs table to allow NULL user_id
ALTER TABLE public.security_logs 
  ALTER COLUMN user_id DROP NOT NULL;

-- Update foreign key constraint to allow NULL values
ALTER TABLE public.security_logs 
  DROP CONSTRAINT IF EXISTS security_logs_user_id_fkey,
  ADD CONSTRAINT security_logs_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Ensure RLS is enabled
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Recreate security_logs policies
DROP POLICY IF EXISTS "Users can insert security logs" ON security_logs;
DROP POLICY IF EXISTS "Users can read security logs" ON security_logs;
DROP POLICY IF EXISTS "Service role has full access" ON security_logs;

-- Create policies in proper order
CREATE POLICY "Service role has full access"
  ON security_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can insert security logs"
  ON security_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow system-level logs (null user_id)
    user_id IS NULL OR
    -- Or user's own logs
    auth.uid() = user_id
  );

CREATE POLICY "Users can read security logs"
  ON security_logs
  FOR SELECT
  TO authenticated
  USING (
    -- Allow system-level logs (null user_id)
    user_id IS NULL OR
    -- Or user's own logs
    auth.uid() = user_id
  );