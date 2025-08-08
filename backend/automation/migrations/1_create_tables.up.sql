CREATE TABLE scripts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE executions (
  id BIGSERIAL PRIMARY KEY,
  script_id BIGINT NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_executions_script_id ON executions(script_id);
CREATE INDEX idx_executions_status ON executions(status);
