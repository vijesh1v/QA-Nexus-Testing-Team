import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TimeLog, User, LeaveRequest } from '../types';
import { BarChart, Filter, CheckCircle, XCircle, Calendar, TrendingUp, Clock, Users, FileText } from 'lucide-react';

type ViewType = 'graphical' | 'report' | 'timeline' | 'leave';

export const AdminAnalytics: React.FC = () => {
    const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [filterType, setFilterType] = useState<'all' | 'week' | 'month'>('week');
    const [currentView, setCurrentView] = useState<ViewType>('graphical');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [logs, userList, requests] = await Promise.all([
                api.getAllTimeLogs(),
                api.getUsers(),
                api.getAllLeaveRequests()
            ]);
            setTimeLogs(logs);
            setUsers(userList);
            setLeaveRequests(requests);
        } catch (e) {
            console.error("Failed to load admin data", e);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveTimeLog = async (id: string) => {
        try {
            await api.approveTimeLog(id);
            loadData();
        } catch (e) {
            console.error("Failed to approve time log", e);
        }
    };

    const handleRejectTimeLog = async (id: string) => {
        try {
            await api.rejectTimeLog(id);
            loadData();
        } catch (e) {
            console.error("Failed to reject time log", e);
        }
    };

    const handleUpdateLeaveStatus = async (id: string, status: 'Approved' | 'Rejected') => {
        try {
            await api.updateLeaveStatus(id, status);
            loadData();
        } catch (e) {
            console.error("Failed to update leave status", e);
        }
    };

    // Filter logs based on time period
    const getFilteredLogs = () => {
        const now = new Date();
        if (filterType === 'week') {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return timeLogs.filter(l => new Date(l.date) >= oneWeekAgo);
        } else if (filterType === 'month') {
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return timeLogs.filter(l => new Date(l.date) >= oneMonthAgo);
        }
        return timeLogs;
    };

    const filteredLogs = getFilteredLogs();

    // Aggregate data per user
    const userStats = users.map(user => {
        const userLogs = filteredLogs.filter(l => l.userId === user.id);
        const totalHours = userLogs.reduce((acc, curr) => acc + curr.duration, 0);
        const approvedHours = userLogs.filter(l => l.approvalStatus === 'Approved').reduce((acc, curr) => acc + curr.duration, 0);
        return { ...user, totalHours, approvedHours, logCount: userLogs.length };
    }).sort((a, b) => b.totalHours - a.totalHours);

    const totalHours = filteredLogs.reduce((acc, curr) => acc + curr.duration, 0);
    const pendingApprovals = timeLogs.filter(l => l.approvalStatus === 'Pending').length;
    const pendingLeaves = leaveRequests.filter(r => r.status === 'Pending').length;

    const maxHours = Math.max(...userStats.map(s => s.totalHours), 1);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-slate-400">Loading analytics...</div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b border-slate-200 pb-4 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BarChart className="text-indigo-600" /> Admin Analytics
                    </h1>
                    <p className="text-slate-500">Monitor team performance and manage approvals</p>
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

            {/* View Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                    onClick={() => setCurrentView('graphical')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${currentView === 'graphical' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                >
                    <TrendingUp size={16} /> Graphical View
                </button>
                <button
                    onClick={() => setCurrentView('report')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${currentView === 'report' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                >
                    <FileText size={16} /> Report View
                </button>
                <button
                    onClick={() => setCurrentView('timeline')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${currentView === 'timeline' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                >
                    <Clock size={16} /> Timeline Approvals
                    {pendingApprovals > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingApprovals}</span>
                    )}
                </button>
                <button
                    onClick={() => setCurrentView('leave')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${currentView === 'leave' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                >
                    <Calendar size={16} /> Leave Requests
                    {pendingLeaves > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingLeaves}</span>
                    )}
                </button>
            </div>

            {/* Graphical View */}
            {currentView === 'graphical' && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Clock className="text-blue-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Total Hours</p>
                                    <p className="text-2xl font-bold text-slate-800">{totalHours.toFixed(1)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <TrendingUp className="text-amber-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Pending Approvals</p>
                                    <p className="text-2xl font-bold text-slate-800">{pendingApprovals}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Users className="text-green-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Active Users</p>
                                    <p className="text-2xl font-bold text-slate-800">{users.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Calendar className="text-purple-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Leave Requests</p>
                                    <p className="text-2xl font-bold text-slate-800">{pendingLeaves}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bar Chart: Hours by User */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-semibold text-slate-700 mb-4">Hours Worked by User</h3>
                        <div className="space-y-4">
                            {userStats.map(stat => (
                                <div key={stat.id}>
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <img src={stat.avatar} className="w-6 h-6 rounded-full" alt="" />
                                            <span className="text-sm font-medium text-slate-700">{stat.username}</span>
                                        </div>
                                        <span className="text-sm font-bold text-indigo-600">{stat.totalHours.toFixed(1)}h</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${(stat.totalHours / maxHours) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {stat.logCount} entries • {stat.approvedHours.toFixed(1)}h approved
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Leave Status Distribution */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-semibold text-slate-700 mb-4">Leave Request Status</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {['Pending', 'Approved', 'Rejected'].map(status => {
                                const count = leaveRequests.filter(r => r.status === status).length;
                                const percentage = leaveRequests.length > 0 ? (count / leaveRequests.length) * 100 : 0;
                                return (
                                    <div key={status} className="text-center">
                                        <div className={`text-3xl font-bold mb-1 ${status === 'Approved' ? 'text-green-600' :
                                                status === 'Rejected' ? 'text-red-600' :
                                                    'text-amber-600'
                                            }`}>
                                            {count}
                                        </div>
                                        <div className="text-sm text-slate-600 mb-2">{status}</div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div
                                                className={`h-full rounded-full ${status === 'Approved' ? 'bg-green-500' :
                                                        status === 'Rejected' ? 'bg-red-500' :
                                                            'bg-amber-500'
                                                    }`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Report View */}
            {currentView === 'report' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700">
                        Detailed Activity Report
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-slate-500 bg-white border-b border-slate-100">
                                <tr>
                                    <th className="px-4 py-3 font-medium">User</th>
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Time</th>
                                    <th className="px-4 py-3 font-medium">Duration</th>
                                    <th className="px-4 py-3 font-medium">Description</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                            No time logs found for the selected period
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-800">{log.username}</td>
                                            <td className="px-4 py-3 text-slate-500">{log.date}</td>
                                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                                {log.startTime} - {log.endTime}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-slate-600">{log.duration}h</td>
                                            <td className="px-4 py-3 text-slate-500 truncate max-w-md">{log.description}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.approvalStatus === 'Approved' ? 'bg-green-100 text-green-700' :
                                                        log.approvalStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                            'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {log.approvalStatus || 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Timeline Approvals */}
            {currentView === 'timeline' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700 flex justify-between items-center">
                        <span>Timeline Approval Queue</span>
                        <span className="text-xs font-normal text-slate-500 px-2 py-0.5 bg-white rounded border border-slate-200">
                            {pendingApprovals} Pending
                        </span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                        {timeLogs.filter(l => l.approvalStatus === 'Pending').length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <CheckCircle size={48} className="mx-auto mb-2 opacity-20" />
                                <p>No pending timeline approvals</p>
                            </div>
                        ) : (
                            timeLogs.filter(l => l.approvalStatus === 'Pending').map(log => (
                                <div key={log.id} className="p-4 hover:bg-slate-50">
                                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <img
                                                    src={users.find(u => u.id === log.userId)?.avatar}
                                                    className="w-8 h-8 rounded-full"
                                                    alt=""
                                                />
                                                <div>
                                                    <span className="font-medium text-slate-800">{log.username}</span>
                                                    <span className="text-slate-400 mx-2">•</span>
                                                    <span className="text-sm text-slate-500">{log.date}</span>
                                                </div>
                                            </div>
                                            <div className="ml-10">
                                                <div className="text-sm text-slate-600 mb-1">
                                                    <span className="font-medium">{log.startTime} - {log.endTime}</span>
                                                    <span className="text-slate-400 mx-2">•</span>
                                                    <span className="font-semibold text-indigo-600">{log.duration}h</span>
                                                </div>
                                                <p className="text-sm text-slate-500">{log.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 lg:flex-col lg:w-32">
                                            <button
                                                onClick={() => handleApproveTimeLog(log.id)}
                                                className="flex-1 flex justify-center items-center gap-1 bg-green-50 text-green-700 border border-green-200 py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                                            >
                                                <CheckCircle size={14} /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleRejectTimeLog(log.id)}
                                                className="flex-1 flex justify-center items-center gap-1 bg-red-50 text-red-700 border border-red-200 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                                            >
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Leave Requests */}
            {currentView === 'leave' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700 flex justify-between items-center">
                        <span>Leave Request Management</span>
                        <span className="text-xs font-normal text-slate-500 px-2 py-0.5 bg-white rounded border border-slate-200">
                            {pendingLeaves} Pending
                        </span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                        {leaveRequests.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">No leave requests found</div>
                        ) : (
                            leaveRequests.map(req => {
                                const user = users.find(u => u.id === req.userId);
                                return (
                                    <div key={req.id} className="p-4 hover:bg-slate-50">
                                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <img src={user?.avatar} className="w-8 h-8 rounded-full" alt="" />
                                                    <div>
                                                        <span className="font-medium text-slate-800">{user?.username || req.username}</span>
                                                        <span className="text-slate-400 mx-2">•</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${req.type === 'Sick' ? 'bg-red-100 text-red-700' :
                                                                req.type === 'Vacation' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-purple-100 text-purple-700'
                                                            }`}>
                                                            {req.type}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-10">
                                                    <p className="text-sm font-medium text-slate-800 mb-1">
                                                        {req.startDate} to {req.endDate}
                                                    </p>
                                                    <p className="text-sm text-slate-500">{req.reason}</p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Requested on {new Date(req.timestamp).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 lg:flex-col lg:w-32">
                                                {req.status === 'Pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateLeaveStatus(req.id, 'Approved')}
                                                            className="flex-1 flex justify-center items-center gap-1 bg-green-50 text-green-700 border border-green-200 py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                                                        >
                                                            <CheckCircle size={14} /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateLeaveStatus(req.id, 'Rejected')}
                                                            className="flex-1 flex justify-center items-center gap-1 bg-red-50 text-red-700 border border-red-200 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                                                        >
                                                            <XCircle size={14} /> Reject
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className={`text-center py-2 px-3 rounded-lg text-sm font-medium ${req.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {req.status}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};