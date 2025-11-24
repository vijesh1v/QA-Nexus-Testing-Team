import React from 'react';
import { Channel, User, UserRole } from '../types';
import { LogOut, Hash, Shield, Clock, CalendarDays, BarChart2, MessageSquare } from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  activeChannelId: string;
  onChannelSelect: (id: string) => void;
  onLogout: () => void;
  onAdminClick: () => void;
  channels: Channel[];
  currentView: string;
  onViewChange: (view: 'chat' | 'time' | 'leave' | 'analytics') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeChannelId,
  onChannelSelect,
  onLogout,
  onAdminClick,
  channels,
  currentView,
  onViewChange
}) => {
  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/50">
          QN
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-none">QA Nexus</h1>
          <span className="text-xs text-slate-400">Team Workspace</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        
        {/* Main Nav */}
        <div className="px-2 space-y-1">
            <button 
                onClick={() => onViewChange('chat')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${currentView === 'chat' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50'}`}
            >
                <MessageSquare size={18} /> Chat
            </button>
            <button 
                onClick={() => onViewChange('time')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${currentView === 'time' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50'}`}
            >
                <Clock size={18} /> Time Sheet
            </button>
            <button 
                onClick={() => onViewChange('leave')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${currentView === 'leave' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50'}`}
            >
                <CalendarDays size={18} /> Leave
            </button>
            {currentUser.role === UserRole.ADMIN && (
                <button 
                    onClick={() => onViewChange('analytics')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${currentView === 'analytics' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50'}`}
                >
                    <BarChart2 size={18} /> Team Analytics
                </button>
            )}
        </div>

        {/* Channels (Only visible in Chat view) */}
        {currentView === 'chat' && (
            <div>
                <div className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Channels
                </div>
                <nav className="space-y-1 px-2">
                {channels.map(channel => (
                    <button
                    key={channel.id}
                    onClick={() => onChannelSelect(channel.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        activeChannelId === channel.id
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                    >
                    <Hash size={18} />
                    <span className="truncate">{channel.name}</span>
                    </button>
                ))}
                </nav>
            </div>
        )}
      </div>

      {/* User Profile & Admin */}
      <div className="p-4 bg-slate-950/50 border-t border-slate-800 space-y-2">
        {currentUser.role === 'admin' && (
          <button
            onClick={onAdminClick}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-amber-400 hover:bg-amber-950/30 transition-colors"
          >
            <Shield size={16} />
            <span>Admin Panel</span>
          </button>
        )}
        
        <div className="flex items-center gap-3 pt-2">
          <img
            src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.username}`}
            alt={currentUser.username}
            className="w-8 h-8 rounded-full bg-slate-700"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentUser.username}</p>
            <p className="text-xs text-slate-500 capitalize">{currentUser.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};