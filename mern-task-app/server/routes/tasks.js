const express = require('express');
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const router = express.Router();

// Create task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, dueDate, priority, assignedTo } = req.body;
    const task = await Task.create({
      title, description, dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || 'low',
      createdBy: req.user._id,
      assignedTo: assignedTo || null
    });
    res.json(task);
  } catch (err) { res.status(500).json({ message: 'Error creating task' }); }
});

// Pagination list: query ?page=1&limit=10&assignedTo=...&priority=...
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.max(1, parseInt(req.query.limit || '10'));
    const filter = {};
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.priority) filter.priority = req.query.priority;
    // By default show only tasks visible to admin or assigned to user
    // If user is admin show all
    if (req.user.role !== 'admin' && !req.query.all) {
      filter.$or = [{ assignedTo: req.user._id }, { createdBy: req.user._id }];
    }
    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ tasks, page, total, pages: Math.ceil(total / limit) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Error listing' }); }
});

// Get details
router.get('/:id', auth, async (req, res) => {
  const t = await Task.findById(req.params.id).populate('assignedTo', 'name email').populate('createdBy', 'name');
  if (!t) return res.status(404).json({ message: 'Not found' });
  res.json(t);
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, dueDate, priority, status, assignedTo } = req.body;
    const update = { title, description, priority, status, assignedTo };
    if (dueDate) update.dueDate = new Date(dueDate);
    const t = await Task.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(t);
  } catch (err) { res.status(500).json({ message: 'Error updating' }); }
});

// Delete with confirmation handled on client; server just deletes
router.delete('/:id', auth, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
