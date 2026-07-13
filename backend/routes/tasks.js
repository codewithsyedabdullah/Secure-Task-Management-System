const express = require('express');
const router = express.Router();
const { sb } = require('../db/supabase');
const { isAuthenticated } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

router.use(isAuthenticated);

const enrichTask = async (taskId, userId) => {
  const task = await sb('tasks').get('*', { id: String(taskId) });
  if (!task) return null;
  const team = await sb('teams').get('name,color', { id: String(task.team_id) });
  const membership = await sb('team_members').get('role', { team_id: String(task.team_id), user_id: String(userId) });
  if (!membership) return null;
  const creator = await sb('users').get('username', { id: String(task.created_by) });
  const assigneeRows = await sb('task_assignees').select('user_id', { task_id: String(taskId) });
  const userIds = assigneeRows.map(a => a.user_id);
  let assignees = [];
  if (userIds.length) {
    const users = await sb('users').in('id,username', 'id', userIds);
    const statuses = await sb('task_assignee_statuses').in('user_id,status', 'task_id', [taskId]);
    const statusMap = {};
    statuses.forEach(s => statusMap[s.user_id] = s.status);
    assignees = users.map(u => ({ id: u.id, username: u.username, personal_status: statusMap[u.id] || 'todo' }));
  }
  return {
    ...task, team_name: team ? team.name : null, team_color: team ? team.color : null,
    creator_name: creator ? creator.username : null, my_team_role: membership.role,
    assignees, assignee_name: assignees.map(a => a.username).join(', ') || null,
  };
};

router.get('/', async (req, res) => {
  try {
    const { team_id, assigned_to, status, search } = req.query;
    const memberships = await sb('team_members').select('team_id', { user_id: String(req.user.id) });
    const teamIds = memberships.map(m => m.team_id);
    if (!teamIds.length) return res.json([]);
    let filteredIds = teamIds;
    if (team_id) filteredIds = filteredIds.filter(id => String(id) === String(team_id));
    if (!filteredIds.length) return res.json([]);
    let tasks = (await sb('task_assignee_statuses').in('*', 'task_id', filteredIds)).length
      ? await sb('tasks').in('*', 'team_id', filteredIds)
      : await Promise.all(filteredIds.map(tid => sb('tasks').select('*', { team_id: String(tid) }).then(r => r))).then(arrays => arrays.flat());
    tasks = tasks.filter(Boolean);
    if (status) tasks = tasks.filter(t => t.status === status);
    if (search) tasks = tasks.filter(t => (t.title && t.title.toLowerCase().includes(search.toLowerCase())) || (t.description && t.description.toLowerCase().includes(search.toLowerCase())));
    const tasksWithDetails = await Promise.all(tasks.map(t => enrichTask(t.id, req.user.id)));
    res.json(tasksWithDetails.filter(Boolean));
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

router.get('/reminders', async (req, res) => {
  try {
    const memberships = await sb('team_members').select('team_id', { user_id: String(req.user.id) });
    const teamIds = memberships.map(m => m.team_id);
    if (!teamIds.length) return res.json([]);
    const tasks = await sb('tasks').in('*', 'team_id', teamIds);
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const reminders = tasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) <= tomorrow);
    const teamMap = {};
    for (const t of reminders) {
      if (!teamMap[t.team_id]) {
        const team = await sb('teams').get('name', { id: String(t.team_id) });
        teamMap[t.team_id] = team ? team.name : null;
      }
    }
    res.json(reminders.map(t => ({ id: t.id, title: t.title, due_date: t.due_date, status: t.status, priority: t.priority, team_name: teamMap[t.team_id] })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reminders.' });
  }
});

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
    const roleCheck = await sb('team_members').get('role', { team_id: String(team_id), user_id: String(req.user.id) });
    if (!roleCheck) return res.status(403).json({ error: 'You are not a member of this team.' });
    if (roleCheck.role !== 'creator') return res.status(403).json({ error: 'Only the team creator can create tasks.' });
    for (const uid of assignees) {
      const check = await sb('team_members').get('id', { team_id: String(team_id), user_id: String(uid) });
      if (!check) return res.status(400).json({ error: `User ${uid} is not a team member.` });
    }
    const task = await sb('tasks').insert({ title, description: description || null, team_id, created_by: req.user.id, status: 'todo', priority: priority || 'medium', due_date: due_date || null });
    if (task && task.error) return res.status(500).json({ error: task.error });
    for (const uid of assignees) {
      await sb('task_assignees').insert({ task_id: task.id, user_id: uid }).catch(() => {});
    }
    const enriched = await enrichTask(task.id, req.user.id);
    res.status(201).json(enriched);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

router.get('/:id', [param('id').isInt()], async (req, res) => {
  try {
    const task = await enrichTask(req.params.id, req.user.id);
    if (!task) return res.status(404).json({ error: 'Task not found or access denied.' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task.' });
  }
});

router.put('/:id/status', [
  param('id').isInt(),
  body('status').isIn(['todo', 'in_progress', 'done', 'need_help', 'need_more_time']).withMessage('Invalid status.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const task = await sb('tasks').get('*', { id: String(req.params.id) });
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    const membership = await sb('team_members').get('role', { team_id: String(task.team_id), user_id: String(req.user.id) });
    if (!membership) return res.status(404).json({ error: 'Task not found.' });
    const isAssignee = await sb('task_assignees').get('id', { task_id: String(req.params.id), user_id: String(req.user.id) });
    if (!isAssignee && membership.role !== 'creator') return res.status(403).json({ error: 'Only assignees or the team creator can update the status.' });
    if (isAssignee) {
      await sb('task_assignee_statuses').update({ status: req.body.status, updated_at: new Date().toISOString() }, { task_id: String(req.params.id), user_id: String(req.user.id) });
    }
    const allAssignees = await sb('task_assignees').select('user_id', { task_id: String(req.params.id) });
    let overallStatus = req.body.status;
    if (allAssignees.length > 1) {
      const savedStatuses = await sb('task_assignee_statuses').select('status', { task_id: String(req.params.id) });
      const savedArr = savedStatuses.map(r => r.status);
      const allDone = savedArr.length === allAssignees.length && savedArr.every(s => s === 'done');
      const anyNeedHelp = savedArr.includes('need_help');
      const anyNeedMoreTime = savedArr.includes('need_more_time');
      const anyInProgress = savedArr.includes('in_progress');
      if (allDone) overallStatus = 'done';
      else if (anyNeedHelp) overallStatus = 'need_help';
      else if (anyNeedMoreTime) overallStatus = 'need_more_time';
      else if (anyInProgress) overallStatus = 'in_progress';
      else overallStatus = 'todo';
    }
    await sb('tasks').update({ status: overallStatus, updated_at: new Date().toISOString() }, { id: String(req.params.id) });
    const enriched = await enrichTask(req.params.id, req.user.id);
    res.json(enriched);
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

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
    const task = await sb('tasks').get('*', { id: String(req.params.id) });
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    const membership = await sb('team_members').get('role', { team_id: String(task.team_id), user_id: String(req.user.id) });
    if (!membership) return res.status(404).json({ error: 'Task not found.' });
    if (membership.role !== 'creator') return res.status(403).json({ error: 'Only the team creator can edit tasks.' });
    const { title, description, assignees, status, priority, due_date } = req.body;
    await sb('tasks').update({
      title: title || task.title,
      description: description !== undefined ? description : task.description,
      status: status || task.status,
      priority: priority || task.priority,
      due_date: due_date !== undefined ? due_date : task.due_date,
      updated_at: new Date().toISOString(),
    }, { id: String(req.params.id) });
    if (assignees !== undefined) {
      await sb('task_assignees').delete({ task_id: String(req.params.id) });
      await sb('task_assignee_statuses').delete({ task_id: String(req.params.id) });
      for (const uid of assignees) {
        const check = await sb('team_members').get('id', { team_id: String(task.team_id), user_id: String(uid) });
        if (check) await sb('task_assignees').insert({ task_id: parseInt(req.params.id), user_id: uid }).catch(() => {});
      }
    }
    const enriched = await enrichTask(req.params.id, req.user.id);
    res.json(enriched);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

router.delete('/:id', [param('id').isInt()], async (req, res) => {
  try {
    const task = await sb('tasks').get('*', { id: String(req.params.id) });
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    const membership = await sb('team_members').get('role', { team_id: String(task.team_id), user_id: String(req.user.id) });
    if (!membership || membership.role !== 'creator') return res.status(403).json({ error: 'Only the team creator can delete tasks.' });
    await sb('tasks').delete({ id: String(req.params.id) });
    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;
