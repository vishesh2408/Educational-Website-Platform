import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white p-4 rounded shadow-sm flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <input placeholder="Search by name or email" value={filterName} onChange={e => setFilterName(e.target.value)} className="p-2 border rounded w-64" />
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="p-2 border rounded">
                                <option value="all">All users</option>
                                <option value="loggedin">Currently logged in</option>
                                <option value="notlogged">Not logged in</option>
                            </select>
                            <button onClick={fetchUsers} className="px-3 py-2 bg-teal-600 text-white rounded">Refresh</button>
                        </div>
                        <div className="text-sm text-gray-500">Total users: {users.length}</div>
                    </div>

                    <div className="bg-white p-4 rounded shadow-sm">
                        {loading ? (
                            <div className="p-2">
                                <Skeleton variant="list" count={6} />
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-xs text-gray-500">
                                        <th className="py-2">Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Plan</th>
                                        <th>Active Sessions</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(u => (
                                        <tr key={u._id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedUser(u)}>
                                            <td className="py-2">{u.username}</td>
                                            <td>{u.email}</td>
                                            <td>{u.role}</td>
                                            <td>{(u.subscription && u.subscription.plan) || 'free'}</td>
                                            <td>{(u.activity && u.activity.activeSessions) || 0}</td>
                                            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
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

                <div className="lg:col-span-1">
                    <div className="bg-white p-4 rounded shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Selected User</h3>
                            <div>
                                <button onClick={() => { setSelectedUser(null); }} className="px-2 py-1 bg-gray-200 rounded mr-2">Clear</button>
                                <button onClick={() => { setSelectedUser({}); }} className="px-2 py-1 bg-teal-500 text-white rounded">New User</button>
                            </div>
                        </div>

                        {selectedUser ? (
                            <div className="mt-3 space-y-2 text-sm">
                                <label className="block text-xs text-gray-600">Username</label>
                                <input className="w-full p-2 border rounded" value={selectedUser.username || ''} onChange={e => setSelectedUser(prev => ({ ...prev, username: e.target.value }))} />

                                <label className="block text-xs text-gray-600">Email</label>
                                <input className="w-full p-2 border rounded" value={selectedUser.email || ''} onChange={e => setSelectedUser(prev => ({ ...prev, email: e.target.value }))} />

                                <label className="block text-xs text-gray-600">Role</label>
                                <select className="w-full p-2 border rounded" value={selectedUser.role || 'user'} onChange={e => setSelectedUser(prev => ({ ...prev, role: e.target.value }))}>
                                    <option value="user">user</option>
                                    <option value="admin">admin</option>
                                </select>

                                {!selectedUser._id && (
                                    <>
                                        <label className="block text-xs text-gray-600">Password (for new user)</label>
                                        <input type="password" className="w-full p-2 border rounded" value={selectedUser.password || ''} onChange={e => setSelectedUser(prev => ({ ...prev, password: e.target.value }))} />
                                    </>
                                )}

                                <label className="block text-xs text-gray-600">Bio</label>
                                <textarea className="w-full p-2 border rounded" value={selectedUser.bio || ''} onChange={e => setSelectedUser(prev => ({ ...prev, bio: e.target.value }))} />

                                <div className="text-sm text-gray-500">Created: {selectedUser.createdAt ? fmt(selectedUser.createdAt) : '-'}</div>
                                <div className="text-sm text-gray-500">Last Login Attempt: {selectedUser.lastLoginAttempt ? fmt(selectedUser.lastLoginAttempt) : '-'}</div>

                                <div className="mt-2">
                                    <button onClick={() => handleCopyId(selectedUser)} className="px-3 py-2 bg-gray-200 rounded mr-2">Copy ID</button>
                                    <button onClick={() => handleRefreshUser(selectedUser)} className="px-3 py-2 bg-gray-200 rounded mr-2">Refresh</button>
                                    <button onClick={() => handleSaveUser(selectedUser)} className="px-3 py-2 bg-teal-600 text-white rounded mr-2">Save</button>
                                    {selectedUser._id && <button onClick={() => handleDeleteUser(selectedUser._id)} className="px-3 py-2 bg-red-500 text-white rounded">Delete</button>}
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 mt-3">Click a user above to view details or click New User to create one.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserManagement;
