import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';
import Toast from './Toast';

const StaffManagement = () => {
  const { currentUser } = useAuth();
  const [dashboard, setDashboard] = useState([]);
  const [replyInputs, setReplyInputs] = useState({});
  const [replyLoading, setReplyLoading] = useState({});
  const [replyErrors, setReplyErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  const API_BASE_URL = `${BASE_URL}/api`;

  useEffect(() => {
    if (!currentUser) return;
    fetchDashboard();
  }, [currentUser]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/staff/dashboard`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch staff dashboard');
      const data = await res.json();
      setDashboard(data.dashboard || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReplyChange = (postId, value) => {
    setReplyInputs(prev => ({ ...prev, [postId]: value }));
    setReplyErrors(prev => ({ ...prev, [postId]: '' }));
  };

  const submitReply = async (postId) => {
    const content = (replyInputs[postId] || '');
    const trimmed = content.trim();
    // Basic validation
    if (!trimmed) {
      setReplyErrors(prev => ({ ...prev, [postId]: 'Please enter a reply.' }));
      return;
    }
    if (trimmed.length < 3) {
      setReplyErrors(prev => ({ ...prev, [postId]: 'Reply is too short.' }));
      return;
    }

    // Optimistic UI: append a temporary reply locally
    const tempId = `temp-${Date.now()}`;
    const tempReply = {
      _id: tempId,
      content: trimmed,
      userId: { username: currentUser?.username || 'You' },
      createdAt: new Date().toISOString(),
      isTemp: true,
    };

    setDashboard(prev => prev.map(entry => {
      if (String(entry.post._id) === String(postId)) {
        return { ...entry, replies: [...entry.replies, tempReply] };
      }
      return entry;
    }));

    setReplyLoading(prev => ({ ...prev, [postId]: true }));

    try {
      const res = await fetch(`${API_BASE_URL}/forum-posts/${postId}/replies`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to submit reply');
      // Require the server to return the created reply and replace the temp one.
      if (data && data.reply) {
        setDashboard(prev => prev.map(entry => {
          if (String(entry.post._id) === String(postId)) {
            return { ...entry, replies: entry.replies.map(r => r._id === tempId ? data.reply : r) };
          }
          return entry;
        }));
        // Show a brief success toast
        setToast({ type: 'success', message: 'Reply posted' });
        setTimeout(() => setToast(null), 2500);
      } else {
        throw new Error('Server did not return created reply');
      }

      // Clear input and errors
      setReplyInputs(prev => ({ ...prev, [postId]: '' }));
      setReplyErrors(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Reply submit error:', err);
      // Remove optimistic reply and show error
      setDashboard(prev => prev.map(entry => {
        if (String(entry.post._id) === String(postId)) {
          return { ...entry, replies: entry.replies.filter(r => r._id !== tempId) };
        }
        return entry;
      }));
      setReplyErrors(prev => ({ ...prev, [postId]: err.message || 'Failed to submit reply' }));
    } finally {
      setReplyLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  if (!currentUser || (currentUser.role !== 'staff' && currentUser.role !== 'admin')) {
    return <div className="p-4">Staff access required.</div>;
  }

  return (
    <div className="p-4">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <h2 className="text-xl font-semibold mb-4">Staff Dashboard</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      {dashboard.map(entry => (
        <div key={entry.post._id} className="mb-6 bg-white p-4 rounded shadow">
          <div className="font-medium">{entry.post.title || 'Post'}</div>
          <div className="text-sm text-gray-600">By: {entry.post.userId ? entry.post.userId.username : 'Unknown'}</div>
          <div className="mt-3">
            <h4 className="font-semibold">Replies</h4>
            {entry.replies.length === 0 && <div className="text-sm text-gray-500">No replies</div>}
            {entry.replies.map(r => (
              <div key={r._id} className={`p-2 rounded mt-2 ${r.authoredByCurrentStaff ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-800">{r.content}</div>
                <div className="text-xs text-gray-500">By: {r.userId ? r.userId.username : 'Unknown'}</div>
              </div>
            ))}
            {/* Reply composer for staff */}
            <div className="mt-3">
              <textarea
                placeholder="Write a reply..."
                value={replyInputs[entry.post._id] || ''}
                onChange={(e) => handleReplyChange(entry.post._id, e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                aria-label="Write a reply"
                aria-invalid={!!replyErrors[entry.post._id]}
                aria-describedby={replyErrors[entry.post._id] ? `reply-error-${entry.post._id}` : undefined}
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => handleReplyChange(entry.post._id, '')}
                  className="px-3 py-1 text-sm border rounded bg-gray-100"
                  disabled={!!replyLoading[entry.post._id]}
                  aria-disabled={!!replyLoading[entry.post._id]}
                >
                  Cancel
                </button>
                <button
                  onClick={() => submitReply(entry.post._id)}
                  className={`px-3 py-1 text-sm text-white rounded ${replyLoading[entry.post._id] ? 'bg-gray-400' : 'bg-blue-600'}`}
                  disabled={!!replyLoading[entry.post._id]}
                  aria-busy={!!replyLoading[entry.post._id]}
                  aria-disabled={!!replyLoading[entry.post._id]}
                >
                  {replyLoading[entry.post._id] ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size="4" className="text-white" ariaHidden={true} />
                      <span>Replying...</span>
                    </span>
                  ) : 'Reply'}
                </button>
              </div>
              {replyErrors[entry.post._id] && (
                <div id={`reply-error-${entry.post._id}`} className="text-sm text-red-500 mt-2" role="alert" aria-live="assertive">
                  {replyErrors[entry.post._id]}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StaffManagement;
