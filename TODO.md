# QA Nexus Database Persistence Implementation TODO

## Backend Setup
- [x] Create backend/ directory structure
- [x] Initialize backend/package.json with dependencies (express, sqlite3, bcryptjs, jsonwebtoken, cors, dotenv)
- [x] Create backend/server.js (main Express server)
- [x] Create backend/database.js (SQLite setup and schema)
- [x] Create .env file for environment variables (DB_PATH, JWT_SECRET, PORT)

## Database Schema
- [x] Define SQLite tables: users, channels, messages, time_logs, leave_requests
- [x] Initialize database with default data (admin/tester users, default channels)

## API Endpoints
- [x] Create backend/routes/auth.js (login, logout, verify token)
- [x] Create backend/routes/users.js (CRUD for users)
- [x] Create backend/routes/channels.js (CRUD for channels)
- [x] Create backend/routes/messages.js (CRUD for messages)
- [x] Create backend/routes/timeLogs.js (CRUD for time logs)
- [x] Create backend/routes/leaveRequests.js (CRUD for leave requests)
- [x] Configure CORS and middleware in server.js

## Authentication
- [x] Implement JWT token generation and verification
- [x] Add authentication middleware for protected routes

## Frontend Updates
- [ ] Update services/storage.ts to use API calls instead of localStorage
- [ ] Update components/Login.tsx for JWT-based authentication
- [ ] Handle token storage in localStorage (for session persistence)

## Testing and Deployment
- [ ] Start backend server on port 5000
- [ ] Test API endpoints manually (Postman/curl)
- [ ] Update frontend to connect to backend API
- [ ] Test full functionality (login, add users, send messages, persist data)
- [ ] Ensure build process works for deployment
