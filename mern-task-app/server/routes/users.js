const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// List users (for assigning tasks)
router.get('/', auth, async (req, res) => {
  const users = await User.find().select('_id name email');
  res.json(users);
});

// Remove user (admin only check simple)
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
