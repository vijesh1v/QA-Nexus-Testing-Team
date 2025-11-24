const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get messages for a channel
router.get('/channel/:channelId', authenticateToken, (req, res) => {
  const { channelId } = req.params;

  db.all(
    'SELECT * FROM messages WHERE channelId = ? ORDER BY timestamp ASC',
    [channelId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Parse attachments JSON
      const messages = rows.map(msg => ({
        ...msg,
        attachments: msg.attachments ? JSON.parse(msg.attachments) : null,
        isAiGenerated: Boolean(msg.isAiGenerated)
      }));

      res.json(messages);
    }
  );
});

// Get message by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM messages WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Parse attachments JSON
    const message = {
      ...row,
      attachments: row.attachments ? JSON.parse(row.attachments) : null,
      isAiGenerated: Boolean(row.isAiGenerated)
    };

    res.json(message);
  });
});

// Add new message
router.post('/', authenticateToken, (req, res) => {
  const { content, channelId, attachments, isAiGenerated } = req.body;

  if (!content || !channelId) {
    return res.status(400).json({ error: 'Content and channelId are required' });
  }

  const id = Date.now().toString();
  const timestamp = Date.now();

  db.run(
    'INSERT INTO messages (id, userId, content, timestamp, attachments, isAiGenerated, channelId) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      req.user.id,
      content,
      timestamp,
      attachments ? JSON.stringify(attachments) : null,
      isAiGenerated ? 1 : 0,
      channelId
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({
        id,
        userId: req.user.id,
        content,
        timestamp,
        attachments: attachments || null,
        isAiGenerated: Boolean(isAiGenerated),
        channelId
      });
    }
  );
});

// Update message (own messages only)
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { content, attachments } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  // Check ownership
  db.get('SELECT userId, channelId FROM messages WHERE id = ?', [id], (err, message) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.run(
      'UPDATE messages SET content = ?, attachments = ? WHERE id = ?',
      [content, attachments ? JSON.stringify(attachments) : null, id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Message not found' });
        }

        res.json({
          id,
          userId: message.userId,
          content,
          timestamp: message.timestamp,
          attachments: attachments || null,
          isAiGenerated: Boolean(message.isAiGenerated),
          channelId: message.channelId
        });
      }
    );
  });
});

// Delete message (own messages or admin)
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  // Check ownership
  db.get('SELECT userId FROM messages WHERE id = ?', [id], (err, message) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.run('DELETE FROM messages WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Message not found' });
      }

      res.json({ message: 'Message deleted successfully' });
    });
  });
});

module.exports = router;
