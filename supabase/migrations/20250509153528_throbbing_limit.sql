/*
  # Create game metrics tables

  1. New Tables
    - `game_metrics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `game_id` (uuid, references games)
      - `timestamp` (timestamptz)
      - `metrics` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `game_metrics` table
    - Add policy for authenticated users to insert their own metrics
    - Add policy for authenticated users to read their own metrics
*/

-- Create game_metrics table
CREATE TABLE IF NOT EXISTS game_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  game_id UUID REFERENCES games NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_metrics_user_id ON game_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_game_metrics_game_id ON game_metrics(game_id);
CREATE INDEX IF NOT EXISTS idx_game_metrics_timestamp ON game_metrics(timestamp);

-- Enable RLS
ALTER TABLE game_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own metrics"
  ON game_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own metrics"
  ON game_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);