const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { isAuthenticated } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

router.use(isAuthenticated);

const enrichTask = async (taskId, userId) => {
  const result = await pool.query(
    `SELECT t.*, teams.name AS team_name,
            assignee.username AS assignee_name,
            creator.username AS creator_name,
            tm.role AS my_team_role
     FROM tasks t
     JOIN teams ON t.team_id = teams.id
     JOIN team_members tm ON t.team_id = tm.team_id AND tm.user_id = $2
     LEFT JOIN users assignee ON t.assigned_to = assignee.id
     LEFT JOIN users creator ON t.created_by = creator.id
     WHERE t.id = $1`,
    [taskId, userId]
  );
  return result.rows[0];
};

// GET /tasks
router.get('/', async (req, res) => {
  try {
    const { team_id, assigned_to, status, search } = req.query;
    let queryStr = `
      SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date,
             t.team_id, t.assigned_to, t.created_by, t.created_at, t.updated_at,
             teams.name AS team_name,
             assignee.username AS assignee_name,
             creator.username AS creator_name,
             tm.role AS my_team_role
      FROM tasks t
      JOIN teams ON t.team_id = teams.id
      JOIN team_members tm ON t.team_id = tm.team_id AND tm.user_id = $1
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE 1=1
    `;
    const params = [req.user.id];
    let idx = 2;
    if (team_id)    { queryStr += ` AND t.team_id = $${idx++}`;    params.push(team_id); }
    if (assigned_to){ queryStr += ` AND t.assigned_to = $${idx++}`; params.push(assigned_to); }
    if (status)     { queryStr += ` AND t.status = $${idx++}`;      params.push(status); }
    if (search)     { queryStr += ` AND (t.title ILIKE $${idx} OR t.description ILIKE $${idx++})`; params.push(`%${search}%`); }
    queryStr += ' ORDER BY t.created_at DESC';
    const result = await pool.query(queryStr, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// POST /tasks — team creator only
router.post(
  '/',
  [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required.'),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('team_id').isInt({ min: 1 }).withMessage('Valid team_id required.'),
    body('assigned_to').optional().isInt({ min: 1 }),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('due_date').optional().isDate().withMessage('due_date must be a valid date (YYYY-MM-DD).'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, team_id, assigned_to, priority, due_date } = req.body;
    try {
      // Only team creator can create tasks
      const roleCheck = await pool.query(
        'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
        [team_id, req.user.id]
      );
      if (!roleCheck.rows.length) return res.status(403).json({ error: 'You are not a member of this team.' });
      if (roleCheck.rows[0].role !== 'creator') return res.status(403).json({ error: 'Only the team creator can create tasks.' });

      if (assigned_to) {
        const assigneeCheck = await pool.query(
          'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
          [team_id, assigned_to]
        );
        if (!assigneeCheck.rows.length) return res.status(400).json({ error: 'Assignee must be a team member.' });
      }

      const result = await pool.query(
        `INSERT INTO tasks (title, description, team_id, assigned_to, created_by, status, priority, due_date)
         VALUES ($1, $2, $3, $4, $5, 'todo', $6, $7) RETURNING *`,
        [title, description || null, team_id, assigned_to || null, req.user.id, priority || 'medium', due_date || null]
      );

      const enriched = await enrichTask(result.rows[0].id, req.user.id);
      res.status(201).json(enriched);
    } catch (err) {
      console.error('Create task error:', err);
      res.status(500).json({ error: 'Failed to create task.' });
    }
  }
);

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

// PUT /tasks/:id/status — assigned member updates status only
router.put(
  '/:id/status',
  [
    param('id').isInt(),
    body('status').isIn(['todo', 'in_progress', 'done', 'need_help', 'need_more_time'])
      .withMessage('Invalid status.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const taskResult = await pool.query(
        `SELECT t.*, tm.role FROM tasks t
         JOIN team_members tm ON t.team_id = tm.team_id AND tm.user_id = $2
         WHERE t.id = $1`,
        [req.params.id, req.user.id]
      );
      if (!taskResult.rows.length) return res.status(404).json({ error: 'Task not found or access denied.' });

      const task = taskResult.rows[0];
      // Must be the assignee or team creator
      if (task.assigned_to != req.user.id && task.role !== 'creator') {
        return res.status(403).json({ error: 'Only the assigned member or team creator can update the status.' });
      }

      await pool.query(
        'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2',
        [req.body.status, req.params.id]
      );

      const enriched = await enrichTask(req.params.id, req.user.id);
      res.json(enriched);
    } catch (err) {
      console.error('Update status error:', err);
      res.status(500).json({ error: 'Failed to update status.' });
    }
  }
);

// PUT /tasks/:id — full update, team creator only
router.put(
  '/:id',
  [
    param('id').isInt(),
    body('title').optional().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('assigned_to').optional({ nullable: true }).isInt({ min: 1 }),
    body('status').optional().isIn(['todo', 'in_progress', 'done', 'need_help', 'need_more_time']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('due_date').optional({ nullable: true }).isDate(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const taskResult = await pool.query(
        `SELECT t.*, tm.role FROM tasks t
         JOIN team_members tm ON t.team_id = tm.team_id AND tm.user_id = $2
         WHERE t.id = $1`,
        [req.params.id, req.user.id]
      );
      if (!taskResult.rows.length) return res.status(404).json({ error: 'Task not found or access denied.' });

      const task = taskResult.rows[0];
      if (task.role !== 'creator') {
        return res.status(403).json({ error: 'Only the team creator can edit tasks. Use /status to update your task status.' });
      }

      const { title, description, assigned_to, status, priority, due_date } = req.body;
      await pool.query(
        `UPDATE tasks SET
           title = COALESCE($1, title),
           description = COALESCE($2, description),
           assigned_to = $3,
           status = COALESCE($4, status),
           priority = COALESCE($5, priority),
           due_date = $6,
           updated_at = NOW()
         WHERE id = $7`,
        [
          title || task.title,
          description !== undefined ? description : task.description,
          assigned_to !== undefined ? assigned_to : task.assigned_to,
          status || task.status,
          priority || task.priority,
          due_date !== undefined ? due_date : task.due_date,
          req.params.id,
        ]
      );

      const enriched = await enrichTask(req.params.id, req.user.id);
      res.json(enriched);
    } catch (err) {
      console.error('Update task error:', err);
      res.status(500).json({ error: 'Failed to update task.' });
    }
  }
);

// DELETE /tasks/:id — team creator only
router.delete('/:id', [param('id').isInt()], async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, tm.role FROM tasks t
       JOIN team_members tm ON t.team_id = tm.team_id AND tm.user_id = $2
       WHERE t.id = $1`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Task not found or access denied.' });
    if (result.rows[0].role !== 'creator') {
      return res.status(403).json({ error: 'Only the team creator can delete tasks.' });
    }
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;
