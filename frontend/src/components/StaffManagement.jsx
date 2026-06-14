import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';
import Toast from './Toast';
import { 
  ChevronDown, 
  MessageSquare, 
  User, 
  Clock, 
  FileText, 
  MessageCircle, 
  CornerDownRight, 
  Sparkles 
} from 'lucide-react';

const StaffManagement = () => {
  const { currentUser } = useAuth();
  const [dashboard, setDashboard] = useState([]);
  const [replyInputs, setReplyInputs] = useState({});
  const [replyLoading, setReplyLoading] = useState({});
  const [replyErrors, setReplyErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

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

  const toggleCard = (postId) => {
    setExpandedCards(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }) + ' ' + date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const categoryStyles = {
    bug: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/50',
    feature: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50',
    question: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50',
    discussion: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border border-teal-200 dark:border-teal-900/50',
  };

  const submitReply = async (postId) => {
    const content = (replyInputs[postId] || '');
    const trimmed = content.trim();
    if (!trimmed) {
      setReplyErrors(prev => ({ ...prev, [postId]: 'Please enter a reply.' }));
      return;
    }
    if (trimmed.length < 3) {
      setReplyErrors(prev => ({ ...prev, [postId]: 'Reply is too short.' }));
      return;
    }

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
      if (data && data.reply) {
        setDashboard(prev => prev.map(entry => {
          if (String(entry.post._id) === String(postId)) {
            return { ...entry, replies: entry.replies.map(r => r._id === tempId ? data.reply : r) };
          }
          return entry;
        }));
        setToast({ type: 'success', message: 'Reply posted successfully' });
        setTimeout(() => setToast(null), 2500);
      } else {
        throw new Error('Server did not return created reply');
      }

      setReplyInputs(prev => ({ ...prev, [postId]: '' }));
      setReplyErrors(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Reply submit error:', err);
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
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-xl max-w-md mx-auto my-8 text-center shadow-sm">
        <h3 className="font-bold text-lg mb-1">Access Denied</h3>
        <p className="text-sm">Staff or Admin authentication is required to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-1 md:p-3">
      <Toast toast={toast} onClose={() => setToast(null)} />
      
      {/* Sleek Dashboard Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-150 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles size={20} className="text-teal-500 animate-pulse" />
            Staff Query Inbox
          </h2>
          <p className="text-xs text-gray-550 dark:text-slate-400 mt-1">
            Review student forum discussions, check inquiries, and post official replies.
          </p>
        </div>
        
        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 hover:bg-teal-100 dark:hover:bg-teal-950/50 rounded-lg border border-teal-200/60 dark:border-teal-900/30 transition-all duration-150 flex items-center gap-1.5 shadow-xs"
        >
          {loading ? (
            <>
              <Spinner size="3" className="text-teal-700 dark:text-teal-400 animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <span>Refresh Inbox</span>
            </>
          )}
        </button>
      </div>

      {loading && dashboard.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-slate-400">
          <Spinner size="8" className="text-teal-600 dark:text-teal-400 mb-3 animate-spin" />
          <span className="text-sm font-medium">Fetching dashboard posts...</span>
        </div>
      )}

      {error && (
        <div className="p-5 bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-sm flex flex-col gap-2 max-w-xl mx-auto my-6 shadow-sm">
          <h3 className="font-bold">Error loading dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchDashboard} className="mt-2 self-start px-3.5 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 rounded-lg text-xs font-semibold text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800 transition-all duration-150">
            Try Again
          </button>
        </div>
      )}

      {!loading && dashboard.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40 p-8 max-w-xl mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
            <MessageCircle size={22} />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-slate-200 mb-1">No Active Queries</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs mx-auto">
            All student posts have been resolved or there are no discussions yet. Check back later!
          </p>
        </div>
      )}

      <div className="space-y-4">
        {dashboard.map(entry => {
          const isExpanded = !!expandedCards[entry.post._id];
          return (
            <div 
              key={entry.post._id} 
              className="bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800/80 shadow-xs overflow-hidden transition-all duration-300 hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700/80"
            >
              {/* Card Header (Clickable for toggle collapse/expand) */}
              <div 
                onClick={() => toggleCard(entry.post._id)}
                className="p-4 flex items-start justify-between gap-4 cursor-pointer select-none hover:bg-gray-50/40 dark:hover:bg-slate-800/20 transition-colors duration-200"
              >
                <div className="flex-1 min-w-0">
                  {/* Top row: Author & Date & Category Badge */}
                  <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
                      <User size={13} className="text-gray-400 dark:text-slate-500" />
                      <span className="font-semibold text-gray-700 dark:text-slate-300">
                        {entry.post.userId ? entry.post.userId.username : 'Unknown'}
                      </span>
                    </div>
                    
                    <span className="text-gray-300 dark:text-slate-700">•</span>
                    
                    <div className="flex items-center gap-1 text-gray-400 dark:text-slate-500">
                      <Clock size={13} />
                      <span>{formatDate(entry.post.createdAt)}</span>
                    </div>

                    {entry.post.category && (
                      <>
                        <span className="text-gray-300 dark:text-slate-700">•</span>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${categoryStyles[entry.post.category] || categoryStyles.discussion}`}>
                          {entry.post.category.charAt(0).toUpperCase() + entry.post.category.slice(1)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Middle row: Post Title */}
                  <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-150">
                    {entry.post.title || 'Discussion Post'}
                  </h3>

                  {/* Bottom row: Tag List */}
                  {entry.post.tags && entry.post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.post.tags.map(tag => (
                        <span key={tag} className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold border border-gray-200 dark:border-slate-750">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right side: Stats & Collapse Trigger */}
                <div className="flex items-center gap-3 self-center shrink-0">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700/60 font-medium">
                    <MessageSquare size={13} className="text-gray-400 dark:text-slate-500" />
                    <span>{entry.replies.length} {entry.replies.length === 1 ? 'reply' : 'replies'}</span>
                  </div>

                  <div className={`text-gray-400 dark:text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              {/* Card Body (Collapsible Content) */}
              {isExpanded && (
                <div className="border-t border-gray-150 dark:border-slate-800 bg-gray-50/20 dark:bg-slate-900/10 p-4 space-y-5">
                  
                  {/* Original Post Content */}
                  <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-gray-150 dark:border-slate-800/80 shadow-xs">
                    <div className="text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400 font-bold mb-2 flex items-center gap-1.5">
                      <FileText size={12} />
                      Original Query
                    </div>
                    <p className="text-sm text-gray-850 dark:text-slate-250 whitespace-pre-wrap leading-relaxed">
                      {entry.post.content}
                    </p>
                    {entry.post.imageUrl && (
                      <div className="mt-4 overflow-hidden rounded-lg border border-gray-100 dark:border-slate-800 max-h-96">
                        <img src={entry.post.imageUrl} alt="Attached query image" className="object-contain max-h-96 w-full bg-slate-50 dark:bg-slate-900" />
                      </div>
                    )}
                  </div>

                  {/* Replies Timeline */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <MessageCircle size={12} />
                      Replies / Activity
                    </h4>

                    {entry.replies.length === 0 ? (
                      <div className="text-sm text-gray-400 dark:text-slate-500 py-3 px-4 border border-dashed border-gray-200 dark:border-slate-850 rounded-lg text-center bg-gray-50/30 dark:bg-slate-900/20">
                        No replies posted yet. Be the first to answer this query!
                      </div>
                    ) : (
                      <div className="space-y-3 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-150 dark:before:bg-slate-800">
                        {entry.replies.map(r => (
                          <div 
                            key={r._id} 
                            className={`p-3.5 rounded-xl border relative transition-all duration-200 ${
                              r.authoredByCurrentStaff 
                                ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200/60 dark:border-amber-900/30' 
                                : 'bg-white dark:bg-slate-850 border-gray-150 dark:border-slate-800/80 shadow-xs'
                            }`}
                          >
                            {/* Left dot connection for timeline */}
                            <span className={`absolute -left-[18.5px] top-[18px] w-2.5 h-2.5 rounded-full border-2 ${
                              r.authoredByCurrentStaff
                                ? 'bg-amber-400 border-amber-50 dark:border-slate-900'
                                : 'bg-gray-300 border-white dark:border-slate-900'
                            }`} />

                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                                  {r.userId ? r.userId.username : 'Unknown'}
                                </span>
                                
                                {r.authoredByCurrentStaff && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-200 dark:border-amber-900/30 uppercase tracking-wider">
                                    You (Staff)
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 dark:text-slate-500">
                                {formatDate(r.createdAt)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-750 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {r.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reply composer for staff */}
                  <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-gray-150 dark:border-slate-800/80 shadow-xs">
                    <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                      <CornerDownRight size={12} />
                      Respond as Staff
                    </div>
                    
                    <textarea
                      placeholder="Write a clear, helpful reply..."
                      value={replyInputs[entry.post._id] || ''}
                      onChange={(e) => handleReplyChange(entry.post._id, e.target.value)}
                      className="w-full p-3 text-sm text-gray-850 dark:text-slate-100 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-150"
                      rows={3}
                      aria-label="Write a reply"
                      aria-invalid={!!replyErrors[entry.post._id]}
                      aria-describedby={replyErrors[entry.post._id] ? `reply-error-${entry.post._id}` : undefined}
                    />

                    <div className="flex items-center justify-between gap-2 mt-3">
                      <div className="text-xs text-gray-400 dark:text-slate-500">
                        {replyInputs[entry.post._id]?.trim().length || 0} characters
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReplyChange(entry.post._id, '')}
                          className="px-4 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-700 transition-all duration-150"
                          disabled={!!replyLoading[entry.post._id]}
                          aria-disabled={!!replyLoading[entry.post._id]}
                        >
                          Cancel
                        </button>
                        
                        <button
                          onClick={() => submitReply(entry.post._id)}
                          className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 transition-all duration-150 ${
                            replyLoading[entry.post._id] 
                              ? 'bg-gray-400 dark:bg-slate-700 cursor-not-allowed' 
                              : 'bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 shadow-sm shadow-teal-500/10'
                          }`}
                          disabled={!!replyLoading[entry.post._id]}
                          aria-busy={!!replyLoading[entry.post._id]}
                          aria-disabled={!!replyLoading[entry.post._id]}
                        >
                          {replyLoading[entry.post._id] ? (
                            <>
                              <Spinner size="3" className="text-white animate-spin" ariaHidden={true} />
                              <span>Replying...</span>
                            </>
                          ) : (
                            <>
                              <span>Post Reply</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {replyErrors[entry.post._id] && (
                      <div id={`reply-error-${entry.post._id}`} className="text-xs text-red-500 mt-2 bg-red-50/50 dark:bg-red-950/10 border border-red-200/40 dark:border-red-950/30 p-2 rounded-lg" role="alert" aria-live="assertive">
                        {replyErrors[entry.post._id]}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StaffManagement;
