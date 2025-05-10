/*
  # Update Games Table Structure

  1. Changes
    - Add missing columns
    - Add indexes for better performance
    - Update constraints
    - Add RLS policies

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add last_played column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'games' 
    AND column_name = 'last_played'
  ) THEN
    ALTER TABLE games ADD COLUMN last_played timestamptz;
  END IF;

  -- Add status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'games' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE games ADD COLUMN status text DEFAULT 'installed';
  END IF;

  -- Add version column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'games' 
    AND column_name = 'version'
  ) THEN
    ALTER TABLE games ADD COLUMN version text;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_platform ON games(platform);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_last_played ON games(last_played);

-- Update RLS policies
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated read access to games" ON games;
DROP POLICY IF EXISTS "Allow authenticated insert access to games" ON games;
DROP POLICY IF EXISTS "Allow authenticated update access to games" ON games;

-- Create new policies
CREATE POLICY "Allow authenticated read access to games"
  ON games
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert access to games"
  ON games
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update access to games"
  ON games
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();