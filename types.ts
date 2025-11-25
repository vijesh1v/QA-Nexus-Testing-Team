export enum UserRole {
  ADMIN = 'admin',
  TESTER = 'tester',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  avatar?: string;
  password?: string; // In a real app, this would be hashed
}

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  url: string; // Base64 data URL for this demo
  name: string;
  mimeType: string;
}

export interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  isAiGenerated?: boolean;
  channelId: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
}

export interface TimeLog {
  id: string;
  userId: string;
  date: string; // ISO Date string YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // in hours
  description: string;
  timestamp: number;
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: number;
  username?: string; // For admin views
}

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: 'Vacation' | 'Sick' | 'Personal';
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: number;
}