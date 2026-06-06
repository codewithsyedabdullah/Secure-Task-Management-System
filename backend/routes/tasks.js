const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { isAuthenticated } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

router.use(isAuthenticated);

// Helper: fetch a task with assignees array (including per-assignee status) attached
const enrichTask = async (taskId, userId) => {
  const result = await pool.query(
    `SELECT t.*, teams.name AS team_name, teams.color AS team_color,
            creator.username AS creator_name,
            tm.role AS my_team_role
     FROM tasks t
     JOIN teams ON t.team_id = teams.id
     JOIN team_members tm ON t.team_id = tm.team_id AND tm.user_id = $2
     LEFT JOIN users creator ON t.created_by = creator.id
     WHERE t.id = $1`,
    [taskId, userId]
  );
  if (!result.rows[0]) return null;
  const task = result.rows[0];
  const aRes = await pool.query(
    `SELECT u.id, u.username, COALESCE(tas.status, 'todo') AS personal_status
     FROM task_assignees ta
     JOIN users u ON u.id = ta.user_id
     LEFT JOIN task_assignee_statuses tas ON tas.task_id = ta.task_id AND tas.user_id = ta.user_id
     WHERE ta.task_id = $1`,
    [taskId]
  );
  task.assignees = aRes.rows;
  task.assignee_name = aRes.rows.map(a => a.username).join(', ') || null;
  return task;
};

// GET /tasks
router.get('/', async (req, res) => {
  try {
    const { team_id, assigned_to, status, search } = req.query;
    let queryStr = `
      SELECT DISTINCT t.id, t.title, t.description, t.status, t.priority, t.due_date,
             t.team_id, t.assigned_to, t.created_by, t.created_at, t.updated_at,
             teams.name AS team_name, teams.color AS team_color,
             creator.username AS creator_name,
             tm.role AS my_team_role
      FROM tasks t
      JOIN teams ON t.team_id = teams.id
      JOIN team_members tm ON t.team_id = tm.team_id AND tm.user_id = $1
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN task_assignees ta_f ON ta_f.task_id = t.id
      WHERE 1=1
    `;
    const params = [req.user.id];
    let idx = 2;
    if (team_id)     { queryStr += ` AND t.team_id = $${idx++}`;       params.push(team_id); }
    if (assigned_to) { queryStr += ` AND ta_f.user_id = $${idx++}`;    params.push(assigned_to); }
    if (status)      { queryStr += ` AND t.status = $${idx++}`;         params.push(status); }
    if (search)      { queryStr += ` AND (t.title ILIKE $${idx} OR t.description ILIKE $${idx++})`; params.push(`%${search}%`); }
    queryStr += ' ORDER BY t.created_at DESC';

    const result = await pool.query(queryStr, params);
    const taskIds = result.rows.map(r => r.id);
    let assigneesMap = {};
    if (taskIds.length > 0) {
      const aResult = await pool.query(
        `SELECT ta.task_id, u.id, u.username, COALESCE(tas.status, 'todo') AS personal_status
         FROM task_assignees ta
         JOIN users u ON u.id = ta.user_id
         LEFT JOIN task_assignee_statuses tas ON tas.task_id = ta.task_id AND tas.user_id = ta.user_id
         WHERE ta.task_id = ANY($1)`,
        [taskIds]
      );
      aResult.rows.forEach(r => {
        if (!assigneesMap[r.task_id]) assigneesMap[r.task_id] = [];
        assigneesMap[r.task_id].push({ id: r.id, username: r.username, personal_status: r.personal_status });
      });
    }
    const rows = result.rows.map(t => ({
      ...t,
      assignees: assigneesMap[t.id] || [],
      assignee_name: (assigneesMap[t.id] || []).map(a => a.username).join(', ') || null,
    }));
    res.json(rows);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// GET /tasks/reminders
router.get('/reminders', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT t.id, t.title, t.due_date, t.status, t.priority, teams.name AS team_name
       FROM tasks t
       JOIN teams ON t.team_id = teams.id
       LEFT JOIN task_assignees ta ON ta.task_id = t.id
       WHERE t.due_date IS NOT NULL AND t.status != 'done'
         AND t.due_date <= CURRENT_DATE + INTERVAL '1 day'
         AND (ta.user_id = $1 OR t.created_by = $1)
       ORDER BY t.due_date ASC LIMIT 20`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reminders.' });
  }
});

// POST /tasks — team creator only
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required.'),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('team_id').isInt({ min: 1 }).withMessage('Valid team_id required.'),
  body('assignees').optional().isArray(),
  body('assignees.*').optional().isInt({ min: 1 }),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('due_date').optional().isDate().withMessage('due_date must be a valid date (YYYY-MM-DD).'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, team_id, assignees = [], priority, due_date } = req.body;
  try {
    const roleCheck = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [team_id, req.user.id]
    );
    if (!roleCheck.rows.length) return res.status(403).json({ error: 'You are not a member of this team.' });
    if (roleCheck.rows[0].role !== 'creator') return res.status(403).json({ error: 'Only the team creator can create tasks.' });

    for (const uid of assignees) {
      const check = await pool.query('SELECT id FROM team_members WHERE team_id=$1 AND user_id=$2', [team_id, uid]);
      if (!check.rows.length) return res.status(400).json({ error: `User ${uid} is not a team member.` });
    }

    const result = await pool.query(
      `INSERT INTO tasks (title, description, team_id, created_by, status, priority, due_date)
       VALUES ($1, $2, $3, $4, 'todo', $5, $6) RETURNING *`,
      [title, description || null, team_id, req.user.id, priority || 'medium', due_date || null]
    );
    const taskId = result.rows[0].id;

    for (const uid of assignees) {
      await pool.query('INSERT INTO task_assignees (task_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [taskId, uid]);
    }

    const enriched = await enrichTask(taskId, req.user.id);
    res.status(201).json(enriched);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// GET /tasks/:id
router.get('/:id', [param('id').isInt()], async (req, res) => {
  try {
    const task = await enrichTask(req.params.id, req.user.id);
    if (!task) return res.status(404).json({ error: 'Task not found or access denied.' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task.' });
  }
});

// PUT /tasks/:id/status — each assignee updates only their own personal status
router.put('/:id/status', [
  param('id').isInt(),
  body('status').isIn(['todo', 'in_progress', 'done', 'need_help', 'need_more_time']).withMessage('Invalid status.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const taskResult = await pool.query(
      `SELECT t.*, tm.role FROM tasks t
       JOIN team_members tm ON t.team_id = tm.team_id AND tm.user_id = $2
       WHERE t.id = $1`,
      [req.params.id, req.user.id]
    );
    if (!taskResult.rows.length) return res.status(404).json({ error: 'Task not found.' });
    const task = taskResult.rows[0];

    const isAssigneeRes = await pool.query(
      'SELECT 1 FROM task_assignees WHERE task_id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    const isAssignee = isAssigneeRes.rows.length > 0;

    if (!isAssignee && task.role !== 'creator') {
      return res.status(403).json({ error: 'Only assignees or the team creator can update the status.' });
    }

    // Save personal status for this assignee
    if (isAssignee) {
      await pool.query(
        `INSERT INTO task_assignee_statuses (task_id, user_id, status, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (task_id, user_id) DO UPDATE SET status = $3, updated_at = NOW()`,
        [req.params.id, req.user.id, req.body.status]
      );
    }

    // Compute overall task status from all assignees' personal statuses
    const allAssigneesRes = await pool.query(
      'SELECT user_id FROM task_assignees WHERE task_id=$1',
      [req.params.id]
    );
    const allAssignees = allAssigneesRes.rows;

    let overallStatus = req.body.status;
    if (allAssignees.length > 1) {
      const statusesRes = await pool.query(
        'SELECT status FROM task_assignee_statuses WHERE task_id=$1',
        [req.params.id]
      );
      const savedStatuses = statusesRes.rows.map(r => r.status);
      const allDone = savedStatuses.length === allAssignees.length && savedStatuses.every(s => s === 'done');
      const anyNeedHelp = savedStatuses.includes('need_help');
      const anyNeedMoreTime = savedStatuses.includes('need_more_time');
      const anyInProgress = savedStatuses.includes('in_progress');
      if (allDone) overallStatus = 'done';
      else if (anyNeedHelp) overallStatus = 'need_help';
      else if (anyNeedMoreTime) overallStatus = 'need_more_time';
      else if (anyInProgress) overallStatus = 'in_progress';
      else overallStatus = 'todo';
    }

    await pool.query('UPDATE tasks SET status=$1, updated_at=NOW() WHERE id=$2', [overallStatus, req.params.id]);
    const enriched = await enrichTask(req.params.id, req.user.id);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// PUT /tasks/:id — full update, team creator only
router.put('/:id', [
  param('id').isInt(),
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('assignees').optional().isArray(),
  body('assignees.*').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['todo', 'in_progress', 'done', 'need_help', 'need_more_time']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('due_date').optional({ nullable: true }).isDate(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const taskResult = await pool.query(
      `SELECT t.*, tm.role FROM tasks t
       JOIN team_members tm ON t.team_id = tm.team_id AND tm.user_id = $2
       WHERE t.id = $1`,
      [req.params.id, req.user.id]
    );
    if (!taskResult.rows.length) return res.status(404).json({ error: 'Task not found.' });
    const task = taskResult.rows[0];
    if (task.role !== 'creator') return res.status(403).json({ error: 'Only the team creator can edit tasks.' });

    const { title, description, assignees, status, priority, due_date } = req.body;
    await pool.query(
      `UPDATE tasks SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         status = COALESCE($3, status),
         priority = COALESCE($4, priority),
         due_date = $5,
         updated_at = NOW()
       WHERE id = $6`,
      [title || task.title, description !== undefined ? description : task.description,
       status || task.status, priority || task.priority,
       due_date !== undefined ? due_date : task.due_date, req.params.id]
    );

    if (assignees !== undefined) {
      await pool.query('DELETE FROM task_assignees WHERE task_id=$1', [req.params.id]);
      await pool.query('DELETE FROM task_assignee_statuses WHERE task_id=$1', [req.params.id]);
      for (const uid of assignees) {
        const check = await pool.query('SELECT id FROM team_members WHERE team_id=$1 AND user_id=$2', [task.team_id, uid]);
        if (check.rows.length) {
          await pool.query('INSERT INTO task_assignees (task_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, uid]);
        }
      }
    }

    const enriched = await enrichTask(req.params.id, req.user.id);
    res.json(enriched);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// DELETE /tasks/:id — team creator only
router.delete('/:id', [param('id').isInt()], async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, tm.role FROM tasks t
       JOIN team_members tm ON t.team_id = tm.team_id AND tm.user_id = $2
       WHERE t.id = $1`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Task not found.' });
    if (result.rows[0].role !== 'creator') return res.status(403).json({ error: 'Only the team creator can delete tasks.' });
    await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;
