import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { TimeLog, User, LeaveRequest } from '../types';
import { BarChart, Filter, CheckCircle, XCircle, Calendar } from 'lucide-react';

export const AdminAnalytics: React.FC = () => {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'week' | 'month'>('week');

  useEffect(() => {
    setUsers(storage.getUsers());
    refreshData();
  }, [filterType]);

  const refreshData = () => {
    let logs = storage.getTimeLogs();
    const requests = storage.getLeaveRequests();
    
    // Simple Filtering Logic
    const now = new Date();
    if (filterType === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        logs = logs.filter(l => new Date(l.date) >= oneWeekAgo);
    } else if (filterType === 'month') {
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        logs = logs.filter(l => new Date(l.date) >= oneMonthAgo);
    }

    setTimeLogs(logs);
    setLeaveRequests(requests);
  };

  const updateLeaveStatus = (req: LeaveRequest, status: 'Approved' | 'Rejected') => {
      const updated = { ...req, status };
      storage.updateLeaveRequest(updated);
      refreshData();
  };

  // Aggregate data per user
  const userStats = users.map(user => {
      const userLogs = timeLogs.filter(l => l.userId === user.id);
      const totalHours = userLogs.reduce((acc, curr) => acc + curr.duration, 0);
      return { ...user, totalHours, logCount: userLogs.length };
  }).sort((a, b) => b.totalHours - a.totalHours);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart className="text-indigo-600" /> Team Analytics
            </h1>
            <p className="text-slate-500">Monitor team performance and manage leave requests.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <Filter size={16} className="text-slate-400 ml-2" />
            <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-transparent text-sm font-medium text-slate-700 outline-none py-1 pr-2"
            >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="all">All Time</option>
            </select>
        </div>
      </div>

      {/* Work Hours Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 font-semibold text-slate-700">
                  Work Hours by User ({filterType === 'all' ? 'All Time' : filterType === 'week' ? 'Last 7 Days' : 'Last Month'})
              </div>
              <div className="divide-y divide-slate-100">
                  {userStats.map(stat => (
                      <div key={stat.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                              <img src={stat.avatar} className="w-10 h-10 rounded-full bg-slate-200" alt="" />
                              <div>
                                  <div className="font-medium text-slate-800">{stat.username}</div>
                                  <div className="text-xs text-slate-500">{stat.logCount} entries logged</div>
                              </div>
                          </div>
                          <div className="text-right">
                              <div className="text-lg font-bold text-indigo-600">{stat.totalHours.toFixed(2)} h</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 font-semibold text-slate-700 flex justify-between">
                  <span>Leave Requests</span>
                  <span className="text-xs font-normal text-slate-500 px-2 py-0.5 bg-white rounded border border-slate-200">
                      {leaveRequests.filter(r => r.status === 'Pending').length} Pending
                  </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                  {leaveRequests.length === 0 && <div className="p-6 text-center text-slate-400">No requests found</div>}
                  {leaveRequests.map(req => {
                      const user = users.find(u => u.id === req.userId);
                      return (
                        <div key={req.id} className="p-4 hover:bg-slate-50">
                            <div className="flex justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <img src={user?.avatar} className="w-6 h-6 rounded-full" alt="" />
                                    <span className="font-medium text-sm">{user?.username}</span>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    req.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                                    req.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>{req.status}</span>
                            </div>
                            <p className="text-sm text-slate-800 mb-1 font-medium">
                                {req.type}: {req.startDate} to {req.endDate}
                            </p>
                            <p className="text-xs text-slate-500 mb-3">{req.reason}</p>
                            
                            {req.status === 'Pending' && (
                                <div className="flex gap-2 mt-2">
                                    <button 
                                        onClick={() => updateLeaveStatus(req, 'Approved')}
                                        className="flex-1 flex justify-center items-center gap-1 bg-green-50 text-green-700 border border-green-200 py-1.5 rounded text-xs font-medium hover:bg-green-100"
                                    >
                                        <CheckCircle size={12} /> Approve
                                    </button>
                                    <button 
                                        onClick={() => updateLeaveStatus(req, 'Rejected')}
                                        className="flex-1 flex justify-center items-center gap-1 bg-red-50 text-red-700 border border-red-200 py-1.5 rounded text-xs font-medium hover:bg-red-100"
                                    >
                                        <XCircle size={12} /> Reject
                                    </button>
                                </div>
                            )}
                        </div>
                      );
                  })}
              </div>
          </div>
      </div>
      
      {/* Detailed Log Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700">Detailed Activity Logs</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-slate-500 bg-white border-b border-slate-100">
                    <tr>
                        <th className="px-4 py-3 font-medium">User</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Duration</th>
                        <th className="px-4 py-3 font-medium">Description</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {timeLogs.map(log => {
                        const user = users.find(u => u.id === log.userId);
                        return (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-800">{user?.username}</td>
                                <td className="px-4 py-3 text-slate-500">{log.date}</td>
                                <td className="px-4 py-3 font-mono text-slate-600">{log.duration}h</td>
                                <td className="px-4 py-3 text-slate-500 truncate max-w-md">{log.description}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};