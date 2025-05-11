/*
  # Update User Profiles Schema

  1. Changes
    - Add new columns for user progression and stats
    - Add achievements and badges tables
    - Update RLS policies
    
  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Add new columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS xp bigint DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS games_optimized integer DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_usage_hours integer DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS average_improvement numeric(5,2) DEFAULT 0.0;

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access to achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access to own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update user level
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS trigger AS $$
BEGIN
  NEW.level = FLOOR(LOG(2, NEW.xp / 1000 + 1)) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for level updates
CREATE TRIGGER on_xp_change
  BEFORE UPDATE OF xp ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level();

-- Insert default achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value) VALUES
  ('FPS Master', 'Achieved 50% FPS improvement', 'Zap', 'fps_improvement', 50),
  ('Network Guru', 'Reduced latency by 40%', 'Trophy', 'latency_reduction', 40),
  ('Optimization Expert', 'Optimized 10 games', 'Star', 'games_optimized', 10),
  ('Performance Legend', 'Maintained 99% stability', 'Award', 'stability', 99)
ON CONFLICT DO NOTHING;