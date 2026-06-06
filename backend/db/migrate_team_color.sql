-- Run once on Railway: adds color column and per-assignee status table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#6366f1';

CREATE TABLE IF NOT EXISTS task_assignee_statuses (
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     VARCHAR(20) NOT NULL DEFAULT 'todo',
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);
