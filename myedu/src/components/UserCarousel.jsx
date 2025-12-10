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
    <div className="card user-card">
      <div className="profileImage">
        {user.profilePicture ? (
          <img src={normalizeImageSrc(user.profilePicture)} alt={user.username} className="profile-img" />
        ) : (
          <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" className="profile-svg">
            <circle r="60" fill="transparent" cy="64" cx="64"></circle>
            <circle r="48" fill="transparent" cy="64" cx="64"></circle>
            <path fill="#191919" d="m64 14a32 32 0 0 1 32 32v41a6 6 0 0 1 -6 6h-52a6 6 0 0 1 -6-6v-41a32 32 0 0 1 32-32z"></path>
            <path opacity="1" fill="#191919" d="m62.73 22h2.54a23.73 23.73 0 0 1 23.73 23.73v42.82a4.45 4.45 0 0 1 -4.45 4.45h-41.1a4.45 4.45 0 0 1 -4.45-4.45v-42.82a23.73 23.73 0 0 1 23.73-23.73z"></path>
            <circle r="7" fill="#fbc0aa" cy="65" cx="89"></circle>
            <path fill="#4bc190" d="m64 124a59.67 59.67 0 0 0 34.69-11.06l-3.32-9.3a10 10 0 0 0 -9.37-6.64h-43.95a10 10 0 0 0 -9.42 6.64l-3.32 9.3a59.67 59.67 0 0 0 34.69 11.06z"></path>
          </svg>
        )}
        {user.role === 'staff' && (
          <span className="staff-badge" title="Staff" aria-hidden="false">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 2l2.9 6.59L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-0.68L12 2z" fill="currentColor" />
            </svg>
          </span>
        )}
      </div>
      <div className="textContainer">
        <p className="name">{user.username}</p>
        <p className="profile">{user.role === 'staff' ? (user.bio || 'Staff member') : (user.bio || 'Learner')}</p>
        <div className="mt-2">
          <button
            className={`follow-btn ${isFollowing ? 'following' : ''}`}
            onClick={() => onFollow(user.id)}
            aria-pressed={isFollowing}
            aria-label={isFollowing ? `Unfollow ${user.username}` : `Follow ${user.username}`}
            disabled={isLoading}
          >
            <span className="icon" aria-hidden="true">
              {isLoading ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="spinner">
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
            <span className="text">{isFollowing ? 'Following' : 'Follow'}</span>
          </button>
        </div>
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
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mt-6 user-carousel-card">
      <h3 className="text-lg font-semibold mb-2">Explore People</h3>
      <p className="text-sm text-gray-500 mb-3">Browse learners and staff, follow to get updates.</p>

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
