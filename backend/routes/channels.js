const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get all channels
router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM channels ORDER BY name', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get channel by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM channels WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    res.json(row);
  });
});

// Add new channel (admin only)
router.post('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { name, description, type } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }

  const id = Date.now().toString();

  db.run(
    'INSERT INTO channels (id, name, description, type) VALUES (?, ?, ?, ?)',
    [id, name, description || null, type],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({
        id,
        name,
        description: description || null,
        type
      });
    }
  );
});

// Update channel (admin only)
router.put('/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { name, description, type } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }

  db.run(
    'UPDATE channels SET name = ?, description = ?, type = ? WHERE id = ?',
    [name, description || null, type, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      res.json({ id, name, description: description || null, type });
    }
  );
});

// Delete channel (admin only)
router.delete('/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;

  db.run('DELETE FROM channels WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Also delete associated messages
    db.run('DELETE FROM messages WHERE channelId = ?', [id], (err) => {
      if (err) {
        console.error('Error deleting messages:', err);
      }
    });

    res.json({ message: 'Channel deleted successfully' });
  });
});

module.exports = router;
