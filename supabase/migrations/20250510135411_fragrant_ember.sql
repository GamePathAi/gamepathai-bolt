/*
  # Games Schema Setup

  1. New Tables
    - `games`
      - `id` (uuid, primary key)
      - `name` (text)
      - `platform` (text)
      - `process_name` (text)
      - `install_path` (text)
      - `icon_url` (text, nullable)
      - `last_played` (timestamp, nullable)
      - `size` (bigint, nullable)
      - `optimized` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `games` table
    - Add policies for authenticated users
*/

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  platform text NOT NULL,
  process_name text,
  install_path text,
  icon_url text,
  last_played timestamptz,
  size bigint,
  optimized boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();