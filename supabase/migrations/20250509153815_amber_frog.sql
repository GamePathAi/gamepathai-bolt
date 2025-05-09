/*
  # Create tables for ML model storage and tracking

  1. New Tables
    - model_artifacts: Stores trained model weights and configurations
    - training_metrics: Tracks training progress and performance metrics
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

-- Create model_artifacts table
CREATE TABLE IF NOT EXISTS model_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  weights JSONB NOT NULL,
  config JSONB NOT NULL,
  metrics JSONB NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create training_metrics table
CREATE TABLE IF NOT EXISTS training_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES model_artifacts(id) NOT NULL,
  epoch INTEGER NOT NULL,
  loss FLOAT NOT NULL,
  accuracy FLOAT NOT NULL,
  validation_loss FLOAT NOT NULL,
  validation_accuracy FLOAT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_model_artifacts_version ON model_artifacts(version);
CREATE INDEX IF NOT EXISTS idx_training_metrics_model_id ON training_metrics(model_id);
CREATE INDEX IF NOT EXISTS idx_training_metrics_timestamp ON training_metrics(timestamp);

-- Enable RLS
ALTER TABLE model_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access to model artifacts"
  ON model_artifacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access to training metrics"
  ON training_metrics
  FOR SELECT
  TO authenticated
  USING (true);