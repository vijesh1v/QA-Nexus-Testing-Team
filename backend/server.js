const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const channelRoutes = require('./routes/channels');
const messageRoutes = require('./routes/messages');
const timeLogRoutes = require('./routes/timeLogs');
const leaveRequestRoutes = require('./routes/leaveRequests');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow all origins for simplicity
app.use(express.json({ limit: '10mb' })); // For file uploads

// Routes
app.use('/api/auth', authRoutes.router);
app.use('/api/users', userRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/time-logs', timeLogRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
