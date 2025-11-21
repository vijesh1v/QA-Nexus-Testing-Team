import React, { useState, useEffect } from 'react';
import { User, TimeLog } from '../types';
import { storage } from '../services/storage';
import { Clock, Save, Trash2, Calendar } from 'lucide-react';

interface TimeTrackerProps {
  currentUser: User;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    const allLogs = storage.getTimeLogs();
    // Filter for current user
    setLogs(allLogs.filter(l => l.userId === currentUser.id).sort((a, b) => b.timestamp - a.timestamp));
  };

  const calculateDuration = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const diffInMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    return Number((diffInMinutes / 60).toFixed(2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime || !description) return;

    const duration = calculateDuration(startTime, endTime);
    
    const newLog: TimeLog = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      date,
      startTime,
      endTime,
      duration: duration > 0 ? duration : 0,
      description,
      timestamp: Date.now()
    };

    storage.addTimeLog(newLog);
    loadLogs();
    setDescription('');
    setStartTime('');
    setEndTime('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this entry?')) {
        storage.deleteTimeLog(id);
        loadLogs();
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Clock className="text-blue-600" /> Time Tracker
        </h1>
        <p className="text-slate-500">Log your daily work activity and hours.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
          <h2 className="font-semibold text-slate-800 mb-4">Add New Entry</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Log In Time</label>
                <input 
                  type="time" 
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Log Out Time</label>
                <input 
                  type="time" 
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Work Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Details of tasks performed..."
                className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
              />
            </div>
            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Save size={16} /> Save Entry
            </button>
          </form>
        </div>

        {/* Logs List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
           <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <h3 className="font-semibold text-slate-700">Your Work History</h3>
               <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">Total Entries: {logs.length}</span>
           </div>
           
           <div className="overflow-y-auto flex-1 max-h-[600px]">
               {logs.length === 0 ? (
                   <div className="p-8 text-center text-slate-400">
                       <Calendar size={48} className="mx-auto mb-2 opacity-20" />
                       <p>No logs found. Start tracking your time!</p>
                   </div>
               ) : (
                   <table className="w-full text-sm text-left">
                       <thead className="bg-slate-50 text-slate-500 font-medium">
                           <tr>
                               <th className="px-4 py-3">Date</th>
                               <th className="px-4 py-3">Time</th>
                               <th className="px-4 py-3">Hours</th>
                               <th className="px-4 py-3">Description</th>
                               <th className="px-4 py-3 text-right">Action</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                           {logs.map(log => (
                               <tr key={log.id} className="hover:bg-slate-50">
                                   <td className="px-4 py-3 font-medium text-slate-700">{log.date}</td>
                                   <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                       {log.startTime} - {log.endTime}
                                   </td>
                                   <td className="px-4 py-3">
                                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.duration >= 8 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                           {log.duration} hrs
                                       </span>
                                   </td>
                                   <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={log.description}>{log.description}</td>
                                   <td className="px-4 py-3 text-right">
                                       <button 
                                        onClick={() => handleDelete(log.id)}
                                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                                       >
                                           <Trash2 size={16} />
                                       </button>
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               )}
           </div>
        </div>
      </div>
    </div>
  );
};