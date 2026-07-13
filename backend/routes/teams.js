const express = require('express');
const router = express.Router();
const { sb } = require('../db/supabase');
const { isAuthenticated } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

router.use(isAuthenticated);

const TEAM_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f97316', '#84cc16',
];
const pickColor = () => TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)];

router.get('/', async (req, res) => {
  try {
    const memberships = await sb('team_members').select('team_id,role', { user_id: String(req.user.id) });
    if (!memberships.length) return res.json([]);
    const teamIds = memberships.map(m => m.team_id);
    const allTeams = await sb('team_members').in('team_id,user_id', 'team_id', teamIds);
    const countMap = {};
    allTeams.forEach(t => { countMap[t.team_id] = (countMap[t.team_id] || 0) + 1; });
    const teamsData = await Promise.all(teamIds.map(id => sb('teams').get('*', { id })));
    const creatorIds = [...new Set(teamsData.filter(t=>t).map(t => t.created_by))];
    const creators = creatorIds.length ? await sb('users').in('id,username', 'id', creatorIds) : [];
    const creatorMap = {};
    creators.forEach(c => creatorMap[c.id] = c.username);
    const memMap = {};
    memberships.forEach(m => memMap[m.team_id] = m.role);
    const result = teamsData.filter(Boolean).map(t => ({
      ...t, creator_name: creatorMap[t.created_by] || null,
      my_role: memMap[t.id] || null, member_count: countMap[t.id] || 1,
    }));
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(result);
  } catch (err) {
    console.error('Get teams error:', err);
    res.status(500).json({ error: 'Failed to fetch teams.' });
  }
});

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Team name must be 2-100 characters.'),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, description } = req.body;
    try {
      const team = await sb('teams').insert({ name, description: description || null, created_by: req.user.id, color: pickColor() });
      if (team && team.error) return res.status(500).json({ error: team.error });
      const mem = await sb('team_members').insert({ team_id: team.id, user_id: req.user.id, role: 'creator' });
      if (mem && mem.error) return res.status(500).json({ error: mem.error });
      res.status(201).json(team);
    } catch (err) {
      console.error('Create team error:', err);
      res.status(500).json({ error: 'Failed to create team.' });
    }
  }
);

router.get('/:id', [param('id').isInt()], async (req, res) => {
  try {
    const team = await sb('teams').get('*', { id: String(req.params.id) });
    if (!team) return res.status(404).json({ error: 'Team not found.' });
    const memberCheck = await sb('team_members').get('role', { team_id: String(req.params.id), user_id: String(req.user.id) });
    if (!memberCheck) return res.status(403).json({ error: 'You are not a member of this team.' });
    const members = await sb('team_members').select('user_id,role,joined_at', { team_id: String(req.params.id) });
    const userIds = members.map(m => m.user_id);
    const users = userIds.length ? await sb('users').in('id,username,email', 'id', userIds) : [];
    const userMap = {};
    users.forEach(u => userMap[u.id] = u);
    const creator = await sb('users').get('username', { id: String(team.created_by) });
    res.json({ ...team, creator_name: creator ? creator.username : null, members: members.map(m => ({ ...m, ...userMap[m.user_id] })), my_role: memberCheck.role });
  } catch (err) {
    console.error('Get team error:', err);
    res.status(500).json({ error: 'Failed to fetch team.' });
  }
});

router.put(
  '/:id',
  [
    param('id').isInt(),
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Team name must be 2-100 characters.'),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const team = await sb('teams').get('*', { id: String(req.params.id) });
      if (!team) return res.status(404).json({ error: 'Team not found.' });
      if (team.created_by !== req.user.id) return res.status(403).json({ error: 'Only the team creator can update the team.' });
      const { name, description } = req.body;
      const updated = await sb('teams').update({ name, description: description || null }, { id: String(req.params.id) });
      res.json(updated[0]);
    } catch (err) {
      console.error('Update team error:', err);
      res.status(500).json({ error: 'Failed to update team.' });
    }
  }
);

router.delete('/:id', [param('id').isInt()], async (req, res) => {
  try {
    const team = await sb('teams').get('*', { id: String(req.params.id) });
    if (!team) return res.status(404).json({ error: 'Team not found.' });
    if (team.created_by !== req.user.id) return res.status(403).json({ error: 'Only the team creator can delete the team.' });
    await sb('teams').delete({ id: String(req.params.id) });
    res.json({ message: 'Team deleted successfully.' });
  } catch (err) {
    console.error('Delete team error:', err);
    res.status(500).json({ error: 'Failed to delete team.' });
  }
});

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
      const creatorCheck = await sb('team_members').get('role', { team_id: String(req.params.id), user_id: String(req.user.id) });
      if (!creatorCheck || creatorCheck.role !== 'creator') return res.status(403).json({ error: 'Only the team creator can add members.' });
      const targetUser = await sb('users').get('id,username,email', { email: req.body.email });
      if (!targetUser) return res.status(404).json({ error: 'No user found with that email.' });
      const existing = await sb('team_members').get('id', { team_id: String(req.params.id), user_id: String(targetUser.id) });
      if (existing) return res.status(409).json({ error: 'User is already a member.' });
      await sb('team_members').insert({ team_id: parseInt(req.params.id), user_id: targetUser.id, role: 'member' });
      res.status(201).json({ message: `${targetUser.username} added to team.`, user: targetUser });
    } catch (err) {
      console.error('Add member error:', err);
      res.status(500).json({ error: 'Failed to add member.' });
    }
  }
);

router.delete('/:id/members/:userId', [param('id').isInt(), param('userId').isInt()], async (req, res) => {
  try {
    const creatorCheck = await sb('team_members').get('role', { team_id: String(req.params.id), user_id: String(req.user.id) });
    if (!creatorCheck || creatorCheck.role !== 'creator') return res.status(403).json({ error: 'Only the team creator can remove members.' });
    if (parseInt(req.params.userId) === req.user.id) return res.status(400).json({ error: 'Creator cannot remove themselves.' });
    await sb('team_members').delete({ team_id: String(req.params.id), user_id: String(req.params.userId) });
    res.json({ message: 'Member removed.' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Failed to remove member.' });
  }
});

router.post('/:id/invite', [param('id').isInt(), body('email').isEmail().normalizeEmail()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    const creatorCheck = await sb('team_members').get('role', { team_id: String(req.params.id), user_id: String(req.user.id) });
    if (!creatorCheck || creatorCheck.role !== 'creator') return res.status(403).json({ error: 'Only the team creator can send invites.' });
    const team = await sb('teams').get('name', { id: String(req.params.id) });
    if (!team) return res.status(404).json({ error: 'Team not found.' });
    const { email } = req.body;
    const existingUser = await sb('users').get('id,username', { email });
    if (existingUser) {
      const alreadyMember = await sb('team_members').get('id', { team_id: String(req.params.id), user_id: String(existingUser.id) });
      if (alreadyMember) return res.status(409).json({ error: `${existingUser.username} is already a member.` });
      return res.status(200).json({ message: `${email} already has an account. You can add them directly.`, userExists: true });
    }
    console.log(`[INVITE STUB] Team "${team.name}" - invite sent to ${email}`);
    res.status(200).json({ message: `Invite sent to ${email}!`, userExists: false });
  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ error: 'Failed to send invite.' });
  }
});

module.exports = router;
