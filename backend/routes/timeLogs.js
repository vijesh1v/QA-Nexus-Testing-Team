const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get time logs for current user
router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM time_logs WHERE userId = ? ORDER BY timestamp DESC',
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Get time log by ID (own logs or admin)
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM time_logs WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Time log not found' });
    }

    if (row.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(row);
  });
});

// Add new time log
router.post('/', authenticateToken, (req, res) => {
  const { date, startTime, endTime, duration, description } = req.body;

  if (!date || !startTime || !endTime || !duration) {
    return res.status(400).json({ error: 'Date, start time, end time, and duration are required' });
  }

  const id = Date.now().toString();
  const timestamp = Date.now();

  db.run(
    'INSERT INTO time_logs (id, userId, date, startTime, endTime, duration, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, req.user.id, date, startTime, endTime, duration, description || null, timestamp],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({
        id,
        userId: req.user.id,
        date,
        startTime,
        endTime,
        duration,
        description: description || null,
        timestamp
      });
    }
  );
});

// Update time log (own logs or admin)
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { date, startTime, endTime, duration, description } = req.body;

  if (!date || !startTime || !endTime || !duration) {
    return res.status(400).json({ error: 'Date, start time, end time, and duration are required' });
  }

  // Check ownership
  db.get('SELECT userId FROM time_logs WHERE id = ?', [id], (err, log) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!log) {
      return res.status(404).json({ error: 'Time log not found' });
    }

    if (log.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.run(
      'UPDATE time_logs SET date = ?, startTime = ?, endTime = ?, duration = ?, description = ? WHERE id = ?',
      [date, startTime, endTime, duration, description || null, id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Time log not found' });
        }

        res.json({
          id,
          userId: log.userId,
          date,
          startTime,
          endTime,
          duration,
          description: description || null,
          timestamp: log.timestamp
        });
      }
    );
  });
});

// Delete time log (own logs or admin)
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  // Check ownership
  db.get('SELECT userId FROM time_logs WHERE id = ?', [id], (err, log) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!log) {
      return res.status(404).json({ error: 'Time log not found' });
    }

    if (log.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.run('DELETE FROM time_logs WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Time log not found' });
      }

      res.json({ message: 'Time log deleted successfully' });
    });
  });
});

module.exports = router;
