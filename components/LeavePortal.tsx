import React, { useState, useEffect } from 'react';
import { User, LeaveRequest } from '../types';
import { api } from '../services/api';
import { CalendarDays, Send, Clock } from 'lucide-react';

interface LeavePortalProps {
  currentUser: User;
}

export const LeavePortal: React.FC<LeavePortalProps> = ({ currentUser }) => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<'Vacation' | 'Sick' | 'Personal'>('Vacation');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const all = await api.getLeaveRequests();
      setRequests(all.filter(r => r.userId === currentUser.id).sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      console.error("Failed to load leave requests", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return;

    try {
      await api.addLeaveRequest({
        startDate,
        endDate,
        type,
        reason,
      });

      loadRequests();
      setReason('');
      setStartDate('');
      setEndDate('');
    } catch (e) {
      console.error("Failed to add leave request", e);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarDays className="text-teal-600" /> Leave Management
        </h1>
        <p className="text-slate-500">Submit leave requests and track approval status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Request Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
          <h2 className="font-semibold text-slate-800 mb-4">New Leave Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Leave Type</label>
              <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-2 border border-slate-200 rounded-lg text-sm">
                <option value="Vacation">Vacation</option>
                <option value="Sick">Sick Leave</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Reason</label>
              <textarea required value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm h-24 resize-none" placeholder="Why do you need leave?"></textarea>
            </div>
            <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
              <Send size={16} /> Submit Request
            </button>
          </form>
        </div>

        {/* History */}
        <div className="md:col-span-2">
          <h2 className="font-semibold text-slate-800 mb-4">Request History</h2>
          <div className="space-y-3">
            {requests.length === 0 && <p className="text-slate-400 text-sm italic">No leave history found.</p>}
            {requests.map(req => (
              <div key={req.id} className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${req.type === 'Sick' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>{req.type}</span>
                    <span className="text-sm font-medium text-slate-800">
                      {req.startDate} <span className="text-slate-400 mx-1">to</span> {req.endDate}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{req.reason}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                    }`}>
                    {req.status}
                  </span>
                  <span className="text-[10px] text-slate-400">Requested on {new Date(req.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};