const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all('SELECT id, username, role, avatar FROM users ORDER BY username', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get user by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  // Users can view their own profile, admins can view any
  if (req.user.id !== id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  db.get('SELECT id, username, role, avatar FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(row);
  });
});

// Add new user (admin only)
router.post('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { username, password, role, avatar } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required' });
  }

  // Check if username already exists
  db.get('SELECT id FROM users WHERE username = ?', [username], (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({ error: 'Password hashing error' });
      }

      const id = Date.now().toString();

      db.run(
        'INSERT INTO users (id, username, role, avatar, password) VALUES (?, ?, ?, ?, ?)',
        [id, username, role, avatar || null, hash],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.status(201).json({
            id,
            username,
            role,
            avatar: avatar || null
          });
        }
      );
    });
  });
});

// Update user (admin only or self)
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  // Users can update their own profile, admins can update any
  if (req.user.id !== id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { username, role, avatar, password } = req.body;

  // If only updating password
  if (password && !username && !role) {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({ error: 'Password hashing error' });
      }

      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hash, id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
          }

          res.json({ message: 'Password updated successfully' });
        }
      );
    });
    return;
  }

  if (!username || !role) {
    return res.status(400).json({ error: 'Username and role are required' });
  }

  // Check if username already exists (excluding current user)
  db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, id], (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    db.run(
      'UPDATE users SET username = ?, role = ?, avatar = ? WHERE id = ?',
      [username, role, avatar || null, id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({ id, username, role, avatar: avatar || null });
      }
    );
  });
});

// Delete user (admin only, cannot delete self or last admin)
router.delete('/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;

  // Cannot delete self
  if (req.user.id === id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  // Check if user exists and is not the last admin
  db.get('SELECT role FROM users WHERE id = ?', [id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      // Check if there are other admins
      db.get('SELECT COUNT(*) as adminCount FROM users WHERE role = ? AND id != ?', ['admin', id], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (result.adminCount === 0) {
          return res.status(400).json({ error: 'Cannot delete the last admin user' });
        }

        // Proceed with deletion
        deleteUser(id, res);
      });
    } else {
      // Not an admin, safe to delete
      deleteUser(id, res);
    }
  });
});

function deleteUser(id, res) {
  db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Also delete associated data
    db.run('DELETE FROM messages WHERE userId = ?', [id], (err) => {
      if (err) console.error('Error deleting messages:', err);
    });
    db.run('DELETE FROM time_logs WHERE userId = ?', [id], (err) => {
      if (err) console.error('Error deleting time logs:', err);
    });
    db.run('DELETE FROM leave_requests WHERE userId = ?', [id], (err) => {
      if (err) console.error('Error deleting leave requests:', err);
    });

    res.json({ message: 'User deleted successfully' });
  });
}

module.exports = router;
