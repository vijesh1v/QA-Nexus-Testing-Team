const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbPath = path.resolve(process.env.DB_PATH || './database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          role TEXT NOT NULL,
          avatar TEXT,
          password TEXT NOT NULL
        )
      `);

      // Channels table
      db.run(`
        CREATE TABLE IF NOT EXISTS channels (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL
        )
      `);

      // Messages table
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          attachments TEXT, -- JSON string
          isAiGenerated INTEGER DEFAULT 0,
          channelId TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users (id),
          FOREIGN KEY (channelId) REFERENCES channels (id)
        )
      `);

      // Time logs table
      db.run(`
        CREATE TABLE IF NOT EXISTS time_logs (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          date TEXT NOT NULL,
          startTime TEXT NOT NULL,
          endTime TEXT NOT NULL,
          duration REAL NOT NULL,
          description TEXT,
          timestamp INTEGER NOT NULL,
          FOREIGN KEY (userId) REFERENCES users (id)
        )
      `);

      // Leave requests table
      db.run(`
        CREATE TABLE IF NOT EXISTS leave_requests (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          startDate TEXT NOT NULL,
          endDate TEXT NOT NULL,
          type TEXT NOT NULL,
          reason TEXT,
          status TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          FOREIGN KEY (userId) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // Insert default data
          insertDefaultData().then(resolve).catch(reject);
        }
      });
    });
  });
}

// Insert default users and channels
function insertDefaultData() {
  return new Promise((resolve, reject) => {
    // Default users
    const defaultUsers = [
      { id: 'u1', username: 'admin', role: 'admin', avatar: 'https://ui-avatars.com/api/?name=admin&background=random', password: 'admin' },
      { id: 'u2', username: 'tester', role: 'tester', avatar: 'https://ui-avatars.com/api/?name=tester&background=random', password: 'tester' }
    ];

    // Default channels
    const defaultChannels = [
      { id: '1', name: 'General', description: 'Team announcements and general chat', type: 'public' },
      { id: '2', name: 'Bug Reports', description: 'Discussion about critical bugs', type: 'public' },
      { id: '3', name: 'Releases', description: 'Deployment coordination', type: 'public' }
    ];

    // Insert users
    let userCount = 0;
    defaultUsers.forEach(user => {
      bcrypt.hash(user.password, 10, (err, hash) => {
        if (err) reject(err);
        db.run(
          'INSERT OR IGNORE INTO users (id, username, role, avatar, password) VALUES (?, ?, ?, ?, ?)',
          [user.id, user.username, user.role, user.avatar, hash],
          (err) => {
            if (err) reject(err);
            userCount++;
            if (userCount === defaultUsers.length) {
              // Insert channels
              let channelCount = 0;
              defaultChannels.forEach(channel => {
                db.run(
                  'INSERT OR IGNORE INTO channels (id, name, description, type) VALUES (?, ?, ?, ?)',
                  [channel.id, channel.name, channel.description, channel.type],
                  (err) => {
                    if (err) reject(err);
                    channelCount++;
                    if (channelCount === defaultChannels.length) {
                      resolve();
                    }
                  }
                );
              });
            }
          }
        );
      });
    });
  });
}

module.exports = { db, initializeDatabase };
