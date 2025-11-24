const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get leave requests for current user
router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM leave_requests WHERE userId = ? ORDER BY timestamp DESC',
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Get all leave requests (admin only)
router.get('/all', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(
    `SELECT lr.*, u.username FROM leave_requests lr
     JOIN users u ON lr.userId = u.id
     ORDER BY lr.timestamp DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Get leave request by ID (own requests or admin)
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM leave_requests WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (row.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(row);
  });
});

// Add new leave request
router.post('/', authenticateToken, (req, res) => {
  const { startDate, endDate, type, reason } = req.body;

  if (!startDate || !endDate || !type) {
    return res.status(400).json({ error: 'Start date, end date, and type are required' });
  }

  const id = Date.now().toString();
  const timestamp = Date.now();

  db.run(
    'INSERT INTO leave_requests (id, userId, startDate, endDate, type, reason, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, req.user.id, startDate, endDate, type, reason || null, 'Pending', timestamp],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({
        id,
        userId: req.user.id,
        startDate,
        endDate,
        type,
        reason: reason || null,
        status: 'Pending',
        timestamp
      });
    }
  );
});

// Update leave request status (admin only)
router.put('/:id/status', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(
    'UPDATE leave_requests SET status = ? WHERE id = ?',
    [status, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Leave request not found' });
      }

      // Get updated request
      db.get('SELECT * FROM leave_requests WHERE id = ?', [id], (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(row);
      });
    }
  );
});

// Update leave request (own requests only, if still pending)
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, type, reason } = req.body;

  if (!startDate || !endDate || !type) {
    return res.status(400).json({ error: 'Start date, end date, and type are required' });
  }

  // Check ownership and status
  db.get('SELECT userId, status FROM leave_requests WHERE id = ?', [id], (err, request) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!request) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (request.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ error: 'Cannot update a processed leave request' });
    }

    db.run(
      'UPDATE leave_requests SET startDate = ?, endDate = ?, type = ?, reason = ? WHERE id = ?',
      [startDate, endDate, type, reason || null, id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Leave request not found' });
        }

        res.json({
          id,
          userId: request.userId,
          startDate,
          endDate,
          type,
          reason: reason || null,
          status: request.status,
          timestamp: request.timestamp
        });
      }
    );
  });
});

// Delete leave request (own requests only, if still pending)
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  // Check ownership and status
  db.get('SELECT userId, status FROM leave_requests WHERE id = ?', [id], (err, request) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!request) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (request.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ error: 'Cannot delete a processed leave request' });
    }

    db.run('DELETE FROM leave_requests WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Leave request not found' });
      }

      res.json({ message: 'Leave request deleted successfully' });
    });
  });
});

module.exports = router;
