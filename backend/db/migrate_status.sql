-- Run this in Railway PostgreSQL Query tab
-- Adds need_help and need_more_time status values
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('todo', 'in_progress', 'done', 'need_help', 'need_more_time'));
