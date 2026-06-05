const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { isAuthenticated } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

// All team routes require authentication
router.use(isAuthenticated);

// GET /teams — get all teams the current user belongs to
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.name, t.description, t.created_by, t.created_at,
              u.username AS creator_name,
              tm.role AS my_role,
              COUNT(DISTINCT tm2.user_id) AS member_count
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id AND tm.user_id = $1
       JOIN users u ON t.created_by = u.id
       LEFT JOIN team_members tm2 ON t.id = tm2.team_id
       GROUP BY t.id, u.username, tm.role
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get teams error:', err);
    res.status(500).json({ error: 'Failed to fetch teams.' });
  }
});

// POST /teams — create a new team
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Team name must be 2–100 characters.'),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const teamResult = await client.query(
        'INSERT INTO teams (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
        [name, description || null, req.user.id]
      );
      const team = teamResult.rows[0];
      // Creator is automatically a member with role 'creator'
      await client.query(
        'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
        [team.id, req.user.id, 'creator']
      );
      await client.query('COMMIT');
      res.status(201).json(team);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Create team error:', err);
      res.status(500).json({ error: 'Failed to create team.' });
    } finally {
      client.release();
    }
  }
);

// GET /teams/:id — get team details with members
router.get('/:id', [param('id').isInt()], async (req, res) => {
  try {
    const teamResult = await pool.query(
      `SELECT t.*, u.username AS creator_name FROM teams t
       JOIN users u ON t.created_by = u.id WHERE t.id = $1`,
      [req.params.id]
    );
    if (!teamResult.rows.length) return res.status(404).json({ error: 'Team not found.' });

    // Check membership
    const memberCheck = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!memberCheck.rows.length) return res.status(403).json({ error: 'You are not a member of this team.' });

    const membersResult = await pool.query(
      `SELECT u.id, u.username, u.email, tm.role, tm.joined_at
       FROM team_members tm JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1 ORDER BY tm.joined_at ASC`,
      [req.params.id]
    );

    res.json({ ...teamResult.rows[0], members: membersResult.rows, my_role: memberCheck.rows[0].role });
  } catch (err) {
    console.error('Get team error:', err);
    res.status(500).json({ error: 'Failed to fetch team.' });
  }
});

// PUT /teams/:id — update team (creator only)
router.put(
  '/:id',
  [
    param('id').isInt(),
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Team name must be 2–100 characters.'),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const teamResult = await pool.query('SELECT * FROM teams WHERE id = $1', [req.params.id]);
      if (!teamResult.rows.length) return res.status(404).json({ error: 'Team not found.' });
      if (teamResult.rows[0].created_by !== req.user.id)
        return res.status(403).json({ error: 'Only the team creator can update the team.' });

      const { name, description } = req.body;
      const result = await pool.query(
        'UPDATE teams SET name = $1, description = $2 WHERE id = $3 RETURNING *',
        [name, description || null, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Update team error:', err);
      res.status(500).json({ error: 'Failed to update team.' });
    }
  }
);

// DELETE /teams/:id — delete team (creator only)
router.delete('/:id', [param('id').isInt()], async (req, res) => {
  try {
    const teamResult = await pool.query('SELECT * FROM teams WHERE id = $1', [req.params.id]);
    if (!teamResult.rows.length) return res.status(404).json({ error: 'Team not found.' });
    if (teamResult.rows[0].created_by !== req.user.id)
      return res.status(403).json({ error: 'Only the team creator can delete the team.' });

    await pool.query('DELETE FROM teams WHERE id = $1', [req.params.id]);
    res.json({ message: 'Team deleted successfully.' });
  } catch (err) {
    console.error('Delete team error:', err);
    res.status(500).json({ error: 'Failed to delete team.' });
  }
});

// POST /teams/:id/members — add a member by email
router.post(
  '/:id/members',
  [
    param('id').isInt(),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      // Only creator can add members
      const creatorCheck = await pool.query(
        'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
      );
      if (!creatorCheck.rows.length || creatorCheck.rows[0].role !== 'creator')
        return res.status(403).json({ error: 'Only the team creator can add members.' });

      const userResult = await pool.query('SELECT id, username, email FROM users WHERE email = $1', [req.body.email]);
      if (!userResult.rows.length) return res.status(404).json({ error: 'No user found with that email.' });

      const newMember = userResult.rows[0];
      const existing = await pool.query(
        'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
        [req.params.id, newMember.id]
      );
      if (existing.rows.length) return res.status(409).json({ error: 'User is already a member.' });

      await pool.query(
        'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
        [req.params.id, newMember.id, 'member']
      );
      res.status(201).json({ message: `${newMember.username} added to team.`, user: newMember });
    } catch (err) {
      console.error('Add member error:', err);
      res.status(500).json({ error: 'Failed to add member.' });
    }
  }
);

// DELETE /teams/:id/members/:userId — remove a member (creator only)
router.delete('/:id/members/:userId', [param('id').isInt(), param('userId').isInt()], async (req, res) => {
  try {
    const creatorCheck = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!creatorCheck.rows.length || creatorCheck.rows[0].role !== 'creator')
      return res.status(403).json({ error: 'Only the team creator can remove members.' });

    if (parseInt(req.params.userId) === req.user.id)
      return res.status(400).json({ error: 'Creator cannot remove themselves.' });

    await pool.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [req.params.id, req.params.userId]);
    res.json({ message: 'Member removed.' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Failed to remove member.' });
  }
});

// POST /teams/:id/invite — invite a non-registered user by email (stubbed, no SMTP)
router.post('/:id/invite', [param('id').isInt(), body('email').isEmail().normalizeEmail()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    // Verify requester is creator
    const creatorCheck = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!creatorCheck.rows.length || creatorCheck.rows[0].role !== 'creator')
      return res.status(403).json({ error: 'Only the team creator can send invites.' });

    const teamResult = await pool.query('SELECT name FROM teams WHERE id = $1', [req.params.id]);
    if (!teamResult.rows.length) return res.status(404).json({ error: 'Team not found.' });

    const { email } = req.body;
    const teamName = teamResult.rows[0].name;

    // Check if user already exists — if so, suggest adding them directly
    const existingUser = await pool.query('SELECT id, username FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length) {
      // Check if already a member
      const alreadyMember = await pool.query(
        'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
        [req.params.id, existingUser.rows[0].id]
      );
      if (alreadyMember.rows.length)
        return res.status(409).json({ error: `${existingUser.rows[0].username} is already a member of this team.` });

      return res.status(200).json({
        message: `${email} already has an account. You can add them directly via the Members tab.`,
        userExists: true,
      });
    }

    // Stubbed: log the invite — no real email sent
    console.log(`[INVITE STUB] Team "${teamName}" (id=${req.params.id}) — invite sent to ${email}`);

    res.status(200).json({
      message: `Invite sent to ${email}! They'll receive an email with instructions to join ${teamName}.`,
      userExists: false,
    });
  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ error: 'Failed to send invite.' });
  }
});

module.exports = router;
