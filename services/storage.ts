import { User, Message, Channel, UserRole, TimeLog, LeaveRequest } from '../types';

const USERS_KEY = 'qa_nexus_users';
const MESSAGES_KEY = 'qa_nexus_messages';
const CHANNELS_KEY = 'qa_nexus_channels';
const TIME_LOGS_KEY = 'qa_nexus_time_logs';
const LEAVE_REQUESTS_KEY = 'qa_nexus_leave_requests';

const DEFAULT_CHANNELS: Channel[] = [
  { id: '1', name: 'General', description: 'Team announcements and general chat', type: 'public' },
  { id: '2', name: 'Bug Reports', description: 'Discussion about critical bugs', type: 'public' },
  { id: '3', name: 'Releases', description: 'Deployment coordination', type: 'public' },
];

const DEFAULT_USERS: User[] = [
  { id: 'u1', username: 'admin', role: UserRole.ADMIN, avatar: 'https://ui-avatars.com/api/?name=admin&background=random', password: 'admin' },
  { id: 'u2', username: 'tester', role: UserRole.TESTER, avatar: 'https://ui-avatars.com/api/?name=tester&background=random', password: 'tester' },
];

// Initialize storage if empty
if (!localStorage.getItem(USERS_KEY)) {
  localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
}
if (!localStorage.getItem(CHANNELS_KEY)) {
  localStorage.setItem(CHANNELS_KEY, JSON.stringify(DEFAULT_CHANNELS));
}
if (!localStorage.getItem(MESSAGES_KEY)) {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify([]));
}
if (!localStorage.getItem(TIME_LOGS_KEY)) {
  localStorage.setItem(TIME_LOGS_KEY, JSON.stringify([]));
}
if (!localStorage.getItem(LEAVE_REQUESTS_KEY)) {
  localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify([]));
}

export const storage = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
  
  addUser: (user: User): void => {
    const users = storage.getUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  updateUser: (updatedUser: User): void => {
    let users = storage.getUsers();
    users = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  deleteUser: (userId: string): void => {
    let users = storage.getUsers();
    // Prevent deleting the last admin
    const user = users.find(u => u.id === userId);
    if (user?.username === 'admin') return; 
    
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getMessages: (channelId: string): Message[] => {
    const allMessages: Message[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    return allMessages.filter(m => m.channelId === channelId).sort((a, b) => a.timestamp - b.timestamp);
  },

  addMessage: (message: Message): void => {
    const allMessages: Message[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    allMessages.push(message);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMessages));
  },

  deleteMessage: (messageId: string): void => {
    let allMessages: Message[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    allMessages = allMessages.filter(m => m.id !== messageId);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMessages));
  },

  getChannels: (): Channel[] => JSON.parse(localStorage.getItem(CHANNELS_KEY) || '[]'),

  // Time Tracking
  getTimeLogs: (): TimeLog[] => JSON.parse(localStorage.getItem(TIME_LOGS_KEY) || '[]'),

  addTimeLog: (log: TimeLog): void => {
    const logs = storage.getTimeLogs();
    logs.push(log);
    localStorage.setItem(TIME_LOGS_KEY, JSON.stringify(logs));
  },

  deleteTimeLog: (id: string): void => {
    let logs = storage.getTimeLogs();
    logs = logs.filter(l => l.id !== id);
    localStorage.setItem(TIME_LOGS_KEY, JSON.stringify(logs));
  },

  // Leave Management
  getLeaveRequests: (): LeaveRequest[] => JSON.parse(localStorage.getItem(LEAVE_REQUESTS_KEY) || '[]'),

  addLeaveRequest: (request: LeaveRequest): void => {
    const requests = storage.getLeaveRequests();
    requests.push(request);
    localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(requests));
  },

  updateLeaveRequest: (request: LeaveRequest): void => {
    let requests = storage.getLeaveRequests();
    requests = requests.map(r => r.id === request.id ? request : r);
    localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(requests));
  }
};