-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function with proper RLS bypass
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER -- Ensures function runs with elevated privileges
SET search_path = public -- Explicitly set search path for security
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
    NEW.id,                    -- user_id from the newly created auth.users record
    split_part(NEW.email, '@', 1), -- Use email username as initial display name
    NULL,                      -- No avatar initially
    '{}'::jsonb,              -- Empty JSON object for preferences
    _now,                      -- Set initial last_login
    0,                        -- Initialize login count
    _now,                     -- created_at
    _now                      -- updated_at
  );

  -- Reset RLS to normal mode
  SET LOCAL session_replication_role = 'origin';
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW; -- Still return NEW to allow user creation even if profile fails
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Recreate policies in correct order (most permissive first)
DROP POLICY IF EXISTS "Service role has full access" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Service role policy must be first
CREATE POLICY "Service role has full access"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Then user-specific policies
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

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);