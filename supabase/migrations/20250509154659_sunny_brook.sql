-- Create feature_configs table
CREATE TABLE IF NOT EXISTS feature_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0,
  stage TEXT CHECK (stage IN ('internal', 'beta', 'production')),
  metrics JSONB DEFAULT '{"successRate": 0, "errorRate": 0, "latency": 0, "userSatisfaction": 0}'::jsonb,
  ab_test JSONB DEFAULT NULL,
  fallback JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feature_metrics table
CREATE TABLE IF NOT EXISTS feature_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID REFERENCES feature_configs(id) NOT NULL,
  success_rate FLOAT NOT NULL,
  error_rate FLOAT NOT NULL,
  latency FLOAT NOT NULL,
  user_satisfaction FLOAT NOT NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feature_feedback table
CREATE TABLE IF NOT EXISTS feature_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID REFERENCES feature_configs(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_metrics_feature_id ON feature_metrics(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_metrics_timestamp ON feature_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_feature_id ON feature_feedback(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_user_id ON feature_feedback(user_id);

-- Enable RLS
ALTER TABLE feature_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access to feature configs"
  ON feature_configs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access to feature metrics"
  ON feature_metrics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own feedback"
  ON feature_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own feedback"
  ON feature_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);