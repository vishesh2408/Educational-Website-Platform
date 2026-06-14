import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Eye } from 'lucide-react';
import Toast from './Toast';
import Skeleton from './Skeleton';

// Default API base same as other admin components
const API_BASE = process.env.REACT_APP_API_BASE || (window.location.hostname.includes('localhost') ? 'http://localhost:3001' : '');

// Simple utility to format date
const fmt = (d) => d ? new Date(d).toLocaleString() : '-';

const BarChart = ({ data, width = 400, height = 180, label }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    const barWidth = Math.floor(width / data.length) - 8;
    return (
        <div className="p-3 bg-white rounded shadow-sm">
            <div className="text-sm font-medium mb-2">{label}</div>
            <svg width={width} height={height}>
                {data.map((d, i) => {
                    const barH = Math.round((d.value / max) * (height - 40));
                    const x = i * (barWidth + 8) + 20;
                    const y = height - barH - 20;
                    return (
                        <g key={d.label}>
                            <rect x={x} y={y} width={barWidth} height={barH} fill="#14b8a6" rx="4" />
                            <text x={x + barWidth / 2} y={height - 6} fontSize="11" textAnchor="middle" fill="#334155">{d.label}</text>
                            <text x={x + barWidth / 2} y={y - 6} fontSize="11" textAnchor="middle" fill="#0f172a">{d.value}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

const AdminUserManagement = () => {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterName, setFilterName] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all | loggedin | notlogged
    const [selectedUser, setSelectedUser] = useState(null);
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'info', timeout = 3500) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), timeout);
    };

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/users`, { credentials: 'include' });
            if (!res.ok) {
                const t = await res.text();
                console.error('Failed to fetch users', res.status, t);
                setUsers([]);
                return;
            }
            const data = await res.json();
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users', err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    // derive filtered list
    const filtered = useMemo(() => {
        const q = filterName.trim().toLowerCase();
        return users.filter(u => {
            if (q) {
                const match = (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
                if (!match) return false;
            }
            if (filterStatus === 'loggedin') {
                // heuristic: activeSessions > 0
                return (u.activity && u.activity.activeSessions && u.activity.activeSessions > 0);
            }
            if (filterStatus === 'notlogged') {
                return !(u.activity && u.activity.activeSessions && u.activity.activeSessions > 0);
            }
            return true;
        });
    }, [users, filterName, filterStatus]);

    // stats for charts
    const planCounts = useMemo(() => {
        const map = {};
        users.forEach(u => {
            const p = (u.subscription && u.subscription.plan) || 'free';
            map[p] = (map[p] || 0) + 1;
        });
        return Object.keys(map).map(k => ({ label: k, value: map[k] }));
    }, [users]);

    const activeSessionBuckets = useMemo(() => {
        const buckets = { '0': 0, '1-2': 0, '3+': 0 };
        users.forEach(u => {
            const n = (u.activity && u.activity.activeSessions) || 0;
            if (n === 0) buckets['0']++;
            else if (n <= 2) buckets['1-2']++;
            else buckets['3+']++;
        });
        return Object.keys(buckets).map(k => ({ label: k, value: buckets[k] }));
    }, [users]);

    // Utility actions for selected user
    const handleCopyId = (user) => {
        if (!user || !user._id) return showToast('No user selected', 'error');
        navigator.clipboard.writeText(user._id).then(() => showToast('Copied id', 'success'));
    };

    const handleRefreshUser = async (user) => {
        if (!user || !user._id) return fetchUsers();
        try {
            const res = await fetch(`${API_BASE}/api/admin/users/${user._id}`, { credentials: 'include' });
                if (!res.ok) {
                const t = await res.text();
                console.error('Failed to fetch user', res.status, t);
                showToast('Failed to refresh user', 'error');
                return;
            }
            const d = await res.json();
            setSelectedUser(d);
        } catch (err) {
            console.error(err);
            showToast('Error refreshing user', 'error');
        }
    };

    const handleSaveUser = async (user) => {
        if (!user) return showToast('No user data', 'error');
        try {
            const payload = {
                username: user.username,
                email: user.email,
                role: user.role,
                bio: user.bio,
            };

            // For new user, include password (required by schema)
            let res;
            if (user._id) {
                res = await fetch(`${API_BASE}/api/admin/users/${user._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                });
            } else {
                // set default password if none provided
                const password = user.password && user.password.length > 0 ? user.password : 'ChangeMe123!';
                res = await fetch(`${API_BASE}/api/admin/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ ...payload, password }),
                });
            }

            let data;
            if (res.headers.get('content-type')?.includes('application/json')) data = await res.json(); else data = await res.text();
            if (!res.ok) {
                console.error('Save failed', res.status, data);
                return showToast((data && data.msg) || data || 'Save failed', 'error');
            }

            showToast('Saved', 'success');
            await fetchUsers();
            // refresh selected user with server data if possible
            if (res.headers.get('content-type')?.includes('application/json') && data && data._id) setSelectedUser(data);
            else setSelectedUser(null);
        } catch (err) {
            console.error('Error saving user', err);
            showToast('Error saving user', 'error');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!id) return;
        if (!window.confirm('Delete this user? This action cannot be undone.')) return;
        try {
            const res = await fetch(`${API_BASE}/api/admin/users/${id}`, { method: 'DELETE', credentials: 'include' });
            let data;
            if (res.headers.get('content-type')?.includes('application/json')) data = await res.json(); else data = await res.text();
            if (!res.ok) {
                console.error('Delete failed', res.status, data);
                return showToast((data && data.msg) || data || 'Delete failed', 'error');
            }
            showToast('Deleted', 'success');
            setSelectedUser(null);
            fetchUsers();
        } catch (err) {
            console.error('Delete error', err);
            showToast('Error deleting user', 'error');
        }
    };

    // render Toast
    useEffect(() => {
        // no-op; toast state used to render Toast component
    }, [toast]);

    return (
        <div className="p-6 bg-transparent min-h-screen">
            <Toast toast={toast} onClose={() => setToast(null)} />
            <h2 className="text-2xl font-semibold mb-4">User Management</h2>
            <div className="space-y-4">
                <div className="bg-white p-4 rounded shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <input placeholder="Search by name or email" value={filterName} onChange={e => setFilterName(e.target.value)} className="p-2 border rounded w-full sm:w-64 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option value="all">All users</option>
                            <option value="loggedin">Currently logged in</option>
                            <option value="notlogged">Not logged in</option>
                        </select>
                        <button onClick={fetchUsers} className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded cursor-pointer transition-colors border-none font-medium">Refresh</button>
                        <button onClick={() => setSelectedUser({})} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors cursor-pointer border-none">New User</button>
                    </div>
                    <div className="text-sm text-gray-500 whitespace-nowrap">Total users: {users.length}</div>
                </div>

                <div className="admin-table-container">
                    {loading ? (
                        <div className="p-2">
                            <Skeleton variant="list" count={6} />
                        </div>
                    ) : (
                        <table className="admin-table">
                            <thead className="admin-table-thead">
                                <tr>
                                    <th className="admin-table-th">Name</th>
                                    <th className="admin-table-th">Email</th>
                                    <th className="admin-table-th">Role</th>
                                    <th className="admin-table-th">Plan</th>
                                    <th className="admin-table-th">Active Sessions</th>
                                    <th className="admin-table-th">Joined</th>
                                    <th className="admin-table-th rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(u => (
                                    <tr 
                                        key={u._id} 
                                        className="admin-table-tr admin-table-tr-clickable" 
                                        onClick={() => setSelectedUser(u)}
                                    >
                                        <td className="admin-table-td font-semibold">{u.username}</td>
                                        <td className="admin-table-td text-gray-600 dark:text-gray-400">{u.email}</td>
                                        <td className="admin-table-td capitalize">{u.role}</td>
                                        <td className="admin-table-td capitalize">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                (u.subscription?.plan) === 'starter'
                                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    : (u.subscription?.plan) === 'professional'
                                                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                                                    : (u.subscription?.plan) === 'enterprise'
                                                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                                {(u.subscription?.plan) || 'free'}
                                            </span>
                                        </td>
                                        <td className="admin-table-td">{(u.activity && u.activity.activeSessions) || 0}</td>
                                        <td className="admin-table-td">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="admin-table-td admin-table-actions">
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setSelectedUser(u); 
                                                }} 
                                                title="View Details" 
                                                className="admin-action-button edit-button"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BarChart data={planCounts} label="Users by Subscription Plan" />
                    <BarChart data={activeSessionBuckets} label="Active Sessions Distribution" />
                </div>
            </div>

            {/* Selected User Detail Modal */}
            {selectedUser && (
                <div className="modal-overlay">
                    <div className="modal-content-box modal-content-box-lg">
                        <div className="modal-header">
                            <h3 className="modal-title font-semibold text-gray-900 dark:text-white">
                                {selectedUser._id ? 'User Details' : 'Create New User'}
                            </h3>
                            <button onClick={() => setSelectedUser(null)} className="modal-close-button border-none bg-none p-1 rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body space-y-4 text-sm py-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Username</label>
                                    <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-650 dark:text-white" value={selectedUser.username || ''} onChange={e => setSelectedUser(prev => ({ ...prev, username: e.target.value }))} />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Email</label>
                                    <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-650 dark:text-white" value={selectedUser.email || ''} onChange={e => setSelectedUser(prev => ({ ...prev, email: e.target.value }))} />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Role</label>
                                    <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-650 dark:text-white" value={selectedUser.role || 'user'} onChange={e => setSelectedUser(prev => ({ ...prev, role: e.target.value }))}>
                                        <option value="user">user</option>
                                        <option value="admin">admin</option>
                                    </select>
                                </div>

                                {!selectedUser._id ? (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Password (for new user)</label>
                                        <input type="password" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-650 dark:text-white" value={selectedUser.password || ''} onChange={e => setSelectedUser(prev => ({ ...prev, password: e.target.value }))} />
                                    </div>
                                ) : (
                                    <div className="hidden md:block"></div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Bio</label>
                                <textarea className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-650 dark:text-white h-24" value={selectedUser.bio || ''} onChange={e => setSelectedUser(prev => ({ ...prev, bio: e.target.value }))} />
                            </div>

                            {selectedUser._id && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
                                    <div>
                                        <span className="font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Created</span>
                                        <span className="text-sm block mt-0.5 text-gray-700 dark:text-gray-300 font-medium">{selectedUser.createdAt ? fmt(selectedUser.createdAt) : '-'}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Last Login Attempt</span>
                                        <span className="text-sm block mt-0.5 text-gray-700 dark:text-gray-300 font-medium">{selectedUser.lastLoginAttempt ? fmt(selectedUser.lastLoginAttempt) : '-'}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions-footer flex justify-between pt-4 mt-4 border-t border-gray-150 dark:border-gray-700">
                            <div>
                                {selectedUser._id && (
                                    <button onClick={() => handleDeleteUser(selectedUser._id)} className="px-3 py-2 bg-red-500 hover:bg-red-650 text-white rounded text-sm font-semibold transition-colors cursor-pointer border-none">Delete User</button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleCopyId(selectedUser)} className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm font-medium transition-colors cursor-pointer border-none">Copy ID</button>
                                <button onClick={() => handleRefreshUser(selectedUser)} className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm font-medium transition-colors cursor-pointer border-none">Refresh</button>
                                <button onClick={() => handleSaveUser(selectedUser)} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm font-semibold transition-colors cursor-pointer border-none">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserManagement;
