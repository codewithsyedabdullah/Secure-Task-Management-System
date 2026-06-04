-- Run once to add multi-assignee support
CREATE TABLE IF NOT EXISTS task_assignees (
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

-- Migrate existing single assigned_to into the junction table
INSERT INTO task_assignees (task_id, user_id)
SELECT id, assigned_to FROM tasks
WHERE assigned_to IS NOT NULL
ON CONFLICT DO NOTHING;
