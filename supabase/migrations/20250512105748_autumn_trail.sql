/*
  # Create optimization_metrics table

  1. New Table
    - `optimization_metrics`
      - `id` (uuid, primary key)
      - `game_id` (uuid, references games)
      - `user_id` (uuid, references auth.users)
      - `timestamp` (timestamptz)
      - `pre_metrics` (jsonb)
      - `post_metrics` (jsonb)
      - `improvement_percentage` (numeric)
      - `optimization_type` (text)
      - `changes_applied` (jsonb)
      - `status` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS optimization_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  timestamp timestamptz NOT NULL,
  pre_metrics jsonb NOT NULL,
  post_metrics jsonb,
  improvement_percentage numeric(5,2),
  optimization_type text NOT NULL,
  changes_applied jsonb NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('in_progress', 'completed', 'failed', 'reverted'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_optimization_metrics_game_id ON optimization_metrics(game_id);
CREATE INDEX IF NOT EXISTS idx_optimization_metrics_user_id ON optimization_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_optimization_metrics_timestamp ON optimization_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_optimization_metrics_status ON optimization_metrics(status);

-- Enable RLS
ALTER TABLE optimization_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own metrics"
  ON optimization_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own metrics"
  ON optimization_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);