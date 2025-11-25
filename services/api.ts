import { User, Message, Channel, TimeLog, LeaveRequest } from '../types';

const BASE_URL = '/api';

const getHeaders = () => {
    const token = localStorage.getItem('qa_nexus_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Request failed with status ${response.status}`);
    }
    return response.json();
};

export const api = {
    // Auth
    login: async (username: string, password: string) => {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        return handleResponse(response);
    },

    verifyToken: async () => {
        const response = await fetch(`${BASE_URL}/auth/verify`, {
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // Users
    getUsers: async (): Promise<User[]> => {
        const response = await fetch(`${BASE_URL}/users`, {
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    addUser: async (user: { username: string; password: string; role: string; avatar?: string }): Promise<User> => {
        const response = await fetch(`${BASE_URL}/users`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(user),
        });
        return handleResponse(response);
    },

    updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
        const response = await fetch(`${BASE_URL}/users/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(updates),
        });
        return handleResponse(response);
    },

    deleteUser: async (id: string): Promise<void> => {
        const response = await fetch(`${BASE_URL}/users/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // Channels
    getChannels: async (): Promise<Channel[]> => {
        const response = await fetch(`${BASE_URL}/channels`, {
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // Messages
    getMessages: async (channelId: string): Promise<Message[]> => {
        const response = await fetch(`${BASE_URL}/messages/channel/${channelId}`, {
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    addMessage: async (message: Partial<Message>): Promise<Message> => {
        const response = await fetch(`${BASE_URL}/messages`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(message),
        });
        return handleResponse(response);
    },

    deleteMessage: async (id: string): Promise<void> => {
        const response = await fetch(`${BASE_URL}/messages/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // Time Logs
    getTimeLogs: async (): Promise<TimeLog[]> => {
        const response = await fetch(`${BASE_URL}/time-logs`, {
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    addTimeLog: async (log: Partial<TimeLog>): Promise<TimeLog> => {
        const response = await fetch(`${BASE_URL}/time-logs`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(log),
        });
        return handleResponse(response);
    },

    deleteTimeLog: async (id: string): Promise<void> => {
        const response = await fetch(`${BASE_URL}/time-logs/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // Admin: Get all time logs
    getAllTimeLogs: async (): Promise<TimeLog[]> => {
        const response = await fetch(`${BASE_URL}/time-logs/all`, {
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // Admin: Approve time log
    approveTimeLog: async (id: string): Promise<TimeLog> => {
        const response = await fetch(`${BASE_URL}/time-logs/${id}/approve`, {
            method: 'PUT',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // Admin: Reject time log
    rejectTimeLog: async (id: string): Promise<TimeLog> => {
        const response = await fetch(`${BASE_URL}/time-logs/${id}/reject`, {
            method: 'PUT',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // Leave Requests
    getLeaveRequests: async (): Promise<LeaveRequest[]> => {
        const response = await fetch(`${BASE_URL}/leave-requests`, {
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // Admin: Get all leave requests
    getAllLeaveRequests: async (): Promise<LeaveRequest[]> => {
        const response = await fetch(`${BASE_URL}/leave-requests/all`, {
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    addLeaveRequest: async (request: Partial<LeaveRequest>): Promise<LeaveRequest> => {
        const response = await fetch(`${BASE_URL}/leave-requests`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(request),
        });
        return handleResponse(response);
    },

    updateLeaveRequest: async (id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest> => {
        const response = await fetch(`${BASE_URL}/leave-requests/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(updates),
        });
        return handleResponse(response);
    },

    // Admin: Update leave request status
    updateLeaveStatus: async (id: string, status: 'Pending' | 'Approved' | 'Rejected'): Promise<LeaveRequest> => {
        const response = await fetch(`${BASE_URL}/leave-requests/${id}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status }),
        });
        return handleResponse(response);
    }
};
