/*
  # Game Detection Schema

  1. New Tables
    - `games`
      - `id` (uuid, primary key)
      - `name` (text)
      - `platform` (text)
      - `process_name` (text)
      - `install_path` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_games`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `game_id` (uuid, references games)
      - `last_played` (timestamptz)
      - `optimized` (boolean)
      - `settings` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  process_name TEXT,
  install_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_games table
CREATE TABLE IF NOT EXISTS user_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  game_id UUID REFERENCES games NOT NULL,
  last_played TIMESTAMPTZ,
  optimized BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to games" ON games
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow users to manage their own games" ON user_games
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);