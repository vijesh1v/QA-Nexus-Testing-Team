import './backend/routes/auth.js';
import './backend/routes/users.js';
import './backend/routes/channels.js';
import './backend/routes/messages.js';
import './backend/routes/timeLogs.js';
import './backend/routes/leaveRequests.js';
import fs from 'fs';

console.log('Routes imported');
fs.writeFileSync('routes_success.txt', 'Success');
