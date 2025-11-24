import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Trash2, Plus, X, ShieldAlert, Key, Save } from 'lucide-react';
import { api } from '../services/api';

interface AdminPanelProps {
  onClose: () => void;
  currentUser: User;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: UserRole.TESTER });
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'profile'>('users');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const fetchedUsers = await api.getUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setLoading(true);
        await api.deleteUser(userId);
        await loadUsers();
      } catch (err: any) {
        alert(err.message || 'Failed to delete user');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;

    try {
      setLoading(true);
      const user = await api.addUser({
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
        avatar: `https://ui-avatars.com/api/?name=${newUser.username}&background=random`,
      });

      await loadUsers();
      setShowAddModal(false);
      setNewUser({ username: '', password: '', role: UserRole.TESTER });
      alert(`User created!\nUsername: ${user.username}\nPassword: ${newUser.password}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      alert("Passwords do not match or are empty");
      return;
    }

    try {
      setLoading(true);
      await api.updateUser(currentUser.id, { password: newPassword });
      alert("Password updated successfully! Please login again.");
      localStorage.removeItem('qa_nexus_token');
      localStorage.removeItem('qa_nexus_current_user');
      window.location.reload(); // Force re-login
    } catch (err: any) {
      alert(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="text-amber-500" />
              Admin Dashboard
            </h2>
            <p className="text-sm text-slate-500">Manage team access and permissions</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-slate-200 px-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Manage Users
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            My Profile
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'users' ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-slate-700">Team Members ({users.length})</h3>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus size={16} />
                  Add Member
                </button>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Password</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 group">
                        <td className="px-4 py-3 flex items-center gap-3">
                          <img src={user.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-200" />
                          <span className="font-medium text-slate-800">{user.username}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">
                          ••••••••
                        </td>
                        <td className="px-4 py-3 text-right">
                          {user.username !== 'admin' && user.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                              title="Remove User"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="max-w-sm mx-auto mt-4">
              <h3 className="font-semibold text-slate-700 mb-4">Update Your Credentials</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
                  <p className="text-sm text-slate-500 mb-1">Username</p>
                  <p className="font-medium text-slate-800">{currentUser.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Confirm new password"
                  />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2">
                  <Save size={16} /> Update Profile
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] bg-black/20 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-4">Add New Member</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value={UserRole.TESTER}>Tester</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <Key size={14} className="absolute right-3 top-3 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Share this password with the user.</p>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create & Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};