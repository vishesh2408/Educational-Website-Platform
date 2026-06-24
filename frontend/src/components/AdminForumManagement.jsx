import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Toast from './Toast';
import Skeleton from './Skeleton';

// Default to backend dev port if REACT_APP_API_BASE not provided (avoids requests hitting the frontend dev server)
const API_BASE = process.env.REACT_APP_API_BASE || (window.location.hostname.includes('localhost') ? 'http://localhost:3001' : '');

const AdminForumManagement = () => {
    const { currentUser } = useAuth();
    const [items, setItems] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        monthlyPrice: 99,
        yearlyPrice: 999,
        features: '',
        postLimit: 0,
        replyLimit: 0,
        active: true,
    });
    const [freeUserInput, setFreeUserInput] = useState('');
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info', timeout = 3500) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), timeout);
    };

    useEffect(() => {
        fetchList();
    }, []);

    const fetchList = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/forum-premiums`, { credentials: 'include' });
            if (!res.ok) {
                const text = await res.text();
                console.error('Failed to load forum premiums', res.status, text);
                setItems([]);
                return;
            }
            const data = await res.json();
            setItems(data || []);
        } catch (err) {
            console.error('Failed to load forum premiums', err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item) => {
        setSelected(item);
        setForm({
            name: item.name || '',
            monthlyPrice: item.monthlyPrice || 0,
            yearlyPrice: item.yearlyPrice || 0,
            features: (item.features || []).join('\n'),
            postLimit: item.postLimit || 0,
            replyLimit: item.replyLimit || 0,
            active: !!item.active,
        });
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name,
                monthlyPrice: Number(form.monthlyPrice),
                yearlyPrice: Number(form.yearlyPrice),
                features: form.features.split('\n').map(f => f.trim()).filter(Boolean),
                postLimit: Number(form.postLimit),
                replyLimit: Number(form.replyLimit),
                active: !!form.active,
            };
            let res;
            if (selected) {
                res = await fetch(`${API_BASE}/api/admin/forum-premiums/${selected._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch(`${API_BASE}/api/admin/forum-premiums`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                });
            }
            let data;
            if (res.headers.get('content-type')?.includes('application/json')) {
                data = await res.json();
            } else {
                data = await res.text();
            }
            if (res.ok) {
                fetchList();
                setSelected(null);
                setForm({ name: '', monthlyPrice: 99, yearlyPrice: 999, features: '', postLimit: 0, replyLimit: 0, active: true });
            } else {
                console.error('Save failed', res.status, data);
                showToast((data && data.msg) || data || 'Error saving', 'error');
            }
        } catch (err) {
            console.error('Save error', err);
            showToast('Error saving', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this forum premium config?')) return;
        try {
            const res = await fetch(`${API_BASE}/api/admin/forum-premiums/${id}`, { method: 'DELETE', credentials: 'include' });
            let data;
            if (res.headers.get('content-type')?.includes('application/json')) {
                data = await res.json();
            } else {
                data = await res.text();
            }
            if (res.ok) fetchList(); else showToast((data && data.msg) || data || 'Delete failed', 'error');
        } catch (err) {
            console.error(err);
            showToast('Delete failed', 'error');
        }
    };

    const handleGrant = async () => {
        if (!selected) return showToast('Select a config first', 'error');
        const userId = freeUserInput.trim();
        if (!userId) return showToast('Provide user id or email', 'error');
        try {
            const res = await fetch(`${API_BASE}/api/admin/forum-premiums/grant-free`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ forumPremiumId: selected._id, userId }),
            });
            let data;
            if (res.headers.get('content-type')?.includes('application/json')) {
                data = await res.json();
            } else {
                data = await res.text();
            }
            if (res.ok) {
                showToast('Granted', 'success');
                fetchList();
                setFreeUserInput('');
            } else {
                console.error('Grant failed', res.status, data);
                showToast((data && data.msg) || data || 'Grant failed', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Grant failed', 'error');
        }
    };

    const handleRevoke = async (userId) => {
        if (!selected) return showToast('Select a config first', 'error');
        try {
            const res = await fetch(`${API_BASE}/api/admin/forum-premiums/revoke-free`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ forumPremiumId: selected._id, userId }),
            });
            let data;
            if (res.headers.get('content-type')?.includes('application/json')) {
                data = await res.json();
            } else {
                data = await res.text();
            }
            if (res.ok) {
                showToast('Revoked', 'success');
                fetchList();
            } else {
                console.error('Revoke failed', res.status, data);
                showToast((data && data.msg) || data || 'Revoke failed', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Revoke failed', 'error');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-gray-900 dark:text-white transition-colors duration-300">
            <Toast toast={toast} onClose={() => setToast(null)} />
            <h2 className="text-2xl font-semibold mb-4">Forum Premium Management</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-1">
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="p-2">
                                <Skeleton variant="list" count={4} />
                            </div>
                        ) : (
                            items && items.length > 0 ? (
                                items.map(item => (
                                    <div key={item._id} className={`p-3 rounded-lg border transition-colors duration-200 ${selected && selected._id === item._id ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50/10 dark:bg-gray-900/10'}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">₹{item.monthlyPrice} / ₹{item.yearlyPrice}</div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => handleSelect(item)} className="px-2 py-1 bg-teal-500 hover:bg-teal-600 text-white rounded transition">Edit</button>
                                                <button onClick={() => handleDelete(item._id)} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition">Del</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-gray-400">No forum premium configs found.</div>
                            )
                        )}
                    </div>
                    <div className="mt-4">
                        <button onClick={() => { setSelected(null); setForm({ name: '', monthlyPrice: 99, yearlyPrice: 999, features: '', postLimit: 0, replyLimit: 0, active: true }); }} className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors">New Config</button>
                    </div>
                </div>
                <div className="col-span-2">
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 outline-none transition" />

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Price (₹)</label>
                                <input type="number" value={form.monthlyPrice} onChange={e => setForm({ ...form, monthlyPrice: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Yearly Price (₹)</label>
                                <input type="number" value={form.yearlyPrice} onChange={e => setForm({ ...form, yearlyPrice: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 outline-none transition" />
                            </div>
                        </div>

                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Features (one per line)</label>
                        <textarea value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 outline-none transition h-28" />

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Post Limit (0 = unlimited)</label>
                                <input type="number" value={form.postLimit} onChange={e => setForm({ ...form, postLimit: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reply Limit (0 = unlimited)</label>
                                <input type="number" value={form.replyLimit} onChange={e => setForm({ ...form, replyLimit: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 outline-none transition" />
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <label className="flex items-center"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="mr-2" /> Active</label>
                        </div>

                        <div className="flex space-x-2">
                            <button onClick={handleSave} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded transition-colors">Save</button>
                            {selected && <button onClick={() => { setSelected(null); setForm({ name: '', monthlyPrice: 99, yearlyPrice: 999, features: '', postLimit: 0, replyLimit: 0, active: true }); }} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors">Cancel</button>}
                        </div>

                        <hr />

                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Free Users / Grants</h3>
                        <div className="flex items-center space-x-2">
                            <input value={freeUserInput} onChange={e => setFreeUserInput(e.target.value)} placeholder="user id or email" className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 outline-none transition flex-grow" />
                            <button onClick={handleGrant} className="px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded transition-colors">Grant</button>
                        </div>

                        <div className="space-y-2 mt-3">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Free users (from selected config):</div>
                            {selected && selected.freeFor && selected.freeFor.users && selected.freeFor.users.length > 0 ? (
                                selected.freeFor.users.map(u => (
                                    <div key={u} className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/10 rounded">
                                        <div className="truncate text-gray-900 dark:text-gray-150">{u}</div>
                                        <button onClick={() => handleRevoke(u)} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition">Revoke</button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-gray-400 dark:text-gray-500">No free users configured.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminForumManagement;
