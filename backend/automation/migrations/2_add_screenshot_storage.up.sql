CREATE TABLE screenshots (
  id BIGSERIAL PRIMARY KEY,
  execution_id BIGINT NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  filename TEXT NOT NULL,
  data BYTEA NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'image/png',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_screenshots_execution_id ON screenshots(execution_id);
CREATE INDEX idx_screenshots_step_number ON screenshots(execution_id, step_number);
