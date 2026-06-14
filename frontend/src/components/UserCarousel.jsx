import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import './UserCarousel.css';
import { normalizeImageSrc } from '../utils/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// const API_BASE_URL = 'http://localhost:3001/api';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

const UserCard = ({ user, onFollow, isFollowing, isLoading }) => {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-900/30 p-4 text-center transition-all duration-300 hover:border-gray-300 dark:hover:border-slate-700/60 hover:bg-gray-200/60 dark:hover:bg-slate-900/40">
      <div className="relative mx-auto mb-3 flex h-[84px] w-[84px] items-center justify-center">
        {user.profilePicture ? (
          <img
            src={normalizeImageSrc(user.profilePicture)}
            alt={user.username}
            className="h-[84px] w-[84px] rounded-full object-cover ring-2 ring-gray-200 dark:ring-slate-800 ring-offset-2 ring-offset-gray-100 dark:ring-offset-slate-950"
          />
        ) : (
          <div className="h-[84px] w-[84px] rounded-full bg-gray-200 dark:bg-slate-800 ring-2 ring-gray-200 dark:ring-slate-800 ring-offset-2 ring-offset-gray-100 dark:ring-offset-slate-950" aria-hidden="true" />
        )}

        {user.role === 'staff' && (
          <span
            className="absolute -right-1 -top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]"
            title="Staff"
            aria-hidden="false"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 2l2.9 6.59L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-0.68L12 2z" fill="currentColor" />
            </svg>
          </span>
        )}
      </div>

      <p className="text-sm font-semibold text-gray-850 dark:text-slate-200">{user.username}</p>
      <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-slate-400">
        {user.role === 'staff' ? (user.bio || 'Staff member') : (user.bio || 'Learner')}
      </p>

      <div className="mt-3">
        <button
          className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition duration-300 disabled:cursor-not-allowed disabled:opacity-70 ${
            isFollowing
              ? 'border border-gray-250 dark:border-slate-800 bg-gray-100/50 dark:bg-slate-950/60 text-gray-655 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-slate-900/60'
              : 'bg-gradient-to-r from-purple-600 to-teal-600 text-white hover:shadow-[0_0_15px_rgba(20,184,166,0.25)]'
          }`}
          onClick={() => onFollow(user.id)}
          aria-pressed={isFollowing}
          aria-label={isFollowing ? `Unfollow ${user.username}` : `Follow ${user.username}`}
          disabled={isLoading}
        >
          <span className="inline-flex items-center justify-center" aria-hidden="true">
            {isLoading ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="0"></circle>
              </svg>
            ) : isFollowing ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span>{isFollowing ? 'Following' : 'Follow'}</span>
        </button>
      </div>
    </div>
  );
};

const UserCarousel = ({ users: propUsers }) => {
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState({});
  const [loadingFollow, setLoadingFollow] = useState({});
  const trackRef = useRef(null);
  const { currentUser } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (propUsers && propUsers.length > 0) {
      setUsers(propUsers);
      return;
    }
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/public/users`);
        const data = await res.json();
        // Normalize user objects so we always have a stable `id` field
        const usersNormalized = (data || []).map(u => {
          const nid = u.id || u._id || (u._id && String(u._id)) || (u.id && String(u.id));
          return { ...u, id: nid };
        });
        setUsers(usersNormalized);
        // If user is logged in, try to infer who they are already following from per-user flags
        if (currentUser) {
          const inferred = {};
          usersNormalized.forEach(u => {
            const id = String(u.id || u._id || '');
            if (!id) return;
            const flags = [u.isFollowing, u.is_following, u.following, u.followedByCurrentUser, u.isFollowed, u.followed, u.is_followed];
            if (flags.some(f => !!f)) inferred[id] = true;
          });
          // (no localStorage fallback — authoritative server list is used where available)
          if (Object.keys(inferred).length) {
            setFollowing(prev => ({ ...prev, ...inferred }));
          }
        }
      } catch (e) {
        console.error('Failed to fetch users', e);
      }
    };
    fetchUsers();
  }, [currentUser]);

  // Fetch authoritative following list from backend when user logs in
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    const fetchFollowing = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/following`, {
          credentials: 'include'
        });
        if (!res.ok) {
          // backend might not expose this endpoint (older servers) — keep local fallback
          console.warn('GET /user/following returned', res.status);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        // backend returns an array of user objects or ids
        const serverFollowing = {};
        if (Array.isArray(data)) {
          data.forEach(item => {
            const id = (item && (item.id || item._id)) ? String(item.id || item._id) : (item ? String(item) : null);
            if (id) serverFollowing[id] = true;
          });
        }
        if (Object.keys(serverFollowing).length) {
          setFollowing(prev => ({ ...prev, ...serverFollowing }));
        }
      } catch (err) {
        console.error('Failed to fetch following list', err);
      }
    };
    fetchFollowing();
    return () => { cancelled = true; };
  }, [currentUser]);

  const scroll = (dir = 'left') => {
    if (!trackRef.current) return;
    const el = trackRef.current;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const handleFollow = async (targetId) => {
    if (!currentUser) {
      showToast('Please sign in to follow users.', 'info');
      return;
    }
    try {
      setLoadingFollow(prev => ({ ...prev, [targetId]: true }));
      // save previous state and optimistic toggle
      const wasFollowing = !!following[targetId];
      setFollowing(prev => ({ ...prev, [targetId]: !wasFollowing }));
      const res = await fetch(`${API_BASE_URL}/user/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetUserId: targetId })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Follow failed', err);
        const msg = (err.msg || '').toString().toLowerCase();
        // If server says we're already following, treat as success and set state
        if (msg.includes('already follow') || msg.includes('already following')) {
          setFollowing(prev => ({ ...prev, [targetId]: true }));
          showToast(err.msg || 'Already following', 'info');
          return;
        }
        // otherwise rollback optimistic change to the saved previous value
        setFollowing(prev => ({ ...prev, [targetId]: wasFollowing }));
        showToast(`Follow failed: ${err.msg || 'Server error'}`, 'error');
      } else {
        // update from server if provided
        const json = await res.json().catch(() => ({}));
        if (json && typeof json.following !== 'undefined') {
          setFollowing(prev => ({ ...prev, [targetId]: !!json.following }));
        } else {
          // backend didn't return state — assume optimistic change succeeded
          setFollowing(prev => ({ ...prev, [targetId]: !wasFollowing }));
        }
        // optionally show success message if backend returned one
        if (json && json.msg) showToast(json.msg, 'success');
      }
    } catch (err) {
      console.error('Follow error', err);
      // rollback optimistic change to saved previous value
      const wasFollowing = !!following[targetId];
      setFollowing(prev => ({ ...prev, [targetId]: wasFollowing }));
      showToast('Network error occurred while following. Please check your connection and try again.', 'error');
    } finally {
      setLoadingFollow(prev => ({ ...prev, [targetId]: false }));
    }
  };

  return (
    <div className="mt-6 rounded-3xl border border-gray-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 backdrop-blur-md p-6 user-carousel-card shadow-xl shadow-sm dark:shadow-none">
      <div className="flex justify-between items-start gap-4 mb-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Explore People</h3>
          <p className="mt-1 text-xs text-gray-555 dark:text-slate-400">Browse learners and staff, follow to get updates.</p>
        </div>
        <button
          onClick={() => navigate('/user/dashboard/community')}
          className="px-3 py-1.5 text-xs font-semibold text-teal-650 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 border border-teal-500/20 dark:border-teal-500/10 bg-teal-500/5 hover:bg-teal-500/10 rounded-xl transition duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1 shadow-sm"
        >
          <span>Explore More</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="carousel-wrap mt-4">
        <button className="carousel-nav left shrink-0 bg-gray-50 hover:bg-gray-150 border border-gray-200 text-gray-700 dark:bg-white/5 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10 transition" onClick={() => scroll('left')} aria-label="Scroll left"><ChevronLeft className="w-5 h-5" /></button>
        <div className="carousel-track [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700/60 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-slate-950/20" ref={trackRef} role="list">
          {users.map(u => (
            <div key={u.id} role="listitem" className="carousel-item">
              <UserCard user={u} onFollow={handleFollow} isFollowing={!!following[u.id]} isLoading={!!loadingFollow[u.id]} />
            </div>
          ))}
        </div>
        <button className="carousel-nav right shrink-0 bg-gray-50 hover:bg-gray-150 border border-gray-200 text-gray-700 dark:bg-white/5 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10 transition" onClick={() => scroll('right')} aria-label="Scroll right"><ChevronRight className="w-5 h-5" /></button>
      </div>
      {/* Toast is rendered globally by ToastProvider */}
    </div>
  );
};

export default UserCarousel;
