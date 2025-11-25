const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get all time logs (admin only)
router.get('/all', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(
    `SELECT tl.*, u.username 
     FROM time_logs tl
     JOIN users u ON tl.userId = u.id
     ORDER BY tl.timestamp DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

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

// Approve time log (admin only)
router.put('/:id/approve', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const approvedAt = Date.now();

  db.get('SELECT * FROM time_logs WHERE id = ?', [id], (err, log) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!log) {
      return res.status(404).json({ error: 'Time log not found' });
    }

    db.run(
      'UPDATE time_logs SET approvalStatus = ?, approvedBy = ?, approvedAt = ? WHERE id = ?',
      ['Approved', req.user.id, approvedAt, id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          ...log,
          approvalStatus: 'Approved',
          approvedBy: req.user.id,
          approvedAt
        });
      }
    );
  });
});

// Reject time log (admin only)
router.put('/:id/reject', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const approvedAt = Date.now();

  db.get('SELECT * FROM time_logs WHERE id = ?', [id], (err, log) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!log) {
      return res.status(404).json({ error: 'Time log not found' });
    }

    db.run(
      'UPDATE time_logs SET approvalStatus = ?, approvedBy = ?, approvedAt = ? WHERE id = ?',
      ['Rejected', req.user.id, approvedAt, id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          ...log,
          approvalStatus: 'Rejected',
          approvedBy: req.user.id,
          approvedAt
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
