import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './UserCarousel.css';
import { normalizeImageSrc } from '../utils/image';

// const API_BASE_URL = 'http://localhost:3001/api';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

const UserCard = ({ user, onFollow, isFollowing, isLoading }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 text-center">
      <div className="relative mx-auto mb-3 flex h-[84px] w-[84px] items-center justify-center">
        {user.profilePicture ? (
          <img
            src={normalizeImageSrc(user.profilePicture)}
            alt={user.username}
            className="h-[84px] w-[84px] rounded-full object-cover ring-2 ring-white/10"
          />
        ) : (
          <div className="h-[84px] w-[84px] rounded-full bg-white/10 ring-2 ring-white/10" aria-hidden="true" />
        )}

        {user.role === 'staff' && (
          <span
            className="absolute -right-1 -top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/10"
            title="Staff"
            aria-hidden="false"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 2l2.9 6.59L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-0.68L12 2z" fill="currentColor" />
            </svg>
          </span>
        )}
      </div>

      <p className="text-sm font-semibold text-white">{user.username}</p>
      <p className="mt-1 line-clamp-2 text-xs text-white/70">
        {user.role === 'staff' ? (user.bio || 'Staff member') : (user.bio || 'Learner')}
      </p>

      <div className="mt-3">
        <button
          className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
            isFollowing
              ? 'border border-white/10 bg-white/10 text-white hover:bg-white/15'
              : 'bg-gradient-to-r from-purple-500 to-[#167468] text-white hover:opacity-95'
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

const UserCarousel = () => {
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState({});
  const [loadingFollow, setLoadingFollow] = useState({});
  const trackRef = useRef(null);
  const { currentUser } = useAuth();
  const showToast = useToast();

  useEffect(() => {
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
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 user-carousel-card">
      <h3 className="text-lg font-semibold text-white">Explore People</h3>
      <p className="mt-1 text-sm text-white/70">Browse learners and staff, follow to get updates.</p>

      <div className="carousel-wrap">
        <button className="carousel-nav left" onClick={() => scroll('left')} aria-label="Scroll left">‹</button>
        <div className="carousel-track" ref={trackRef} role="list">
          {users.map(u => (
            <div key={u.id} role="listitem" className="carousel-item">
              <UserCard user={u} onFollow={handleFollow} isFollowing={!!following[u.id]} isLoading={!!loadingFollow[u.id]} />
            </div>
          ))}
        </div>
        <button className="carousel-nav right" onClick={() => scroll('right')} aria-label="Scroll right">›</button>
      </div>
      {/* Toast is rendered globally by ToastProvider */}
    </div>
  );
};

export default UserCarousel;
