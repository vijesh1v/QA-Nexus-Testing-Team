import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './backend/database.js';
import { router as authRoutes } from './backend/routes/auth.js';
import userRoutes from './backend/routes/users.js';
import channelRoutes from './backend/routes/channels.js';
import messageRoutes from './backend/routes/messages.js';
import timeLogRoutes from './backend/routes/timeLogs.js';
import leaveRequestRoutes from './backend/routes/leaveRequests.js';
import fs from 'fs';

console.log('All imports successful');
fs.writeFileSync('all_imports_success.txt', 'Success');
