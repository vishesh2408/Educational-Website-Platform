


// src/contexts/AuthContext.jsx (FINALIZED)
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

// const API_BASE_URL = 'http://localhost:3001/api';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;


const USER_SUMMARY_CACHE_KEY = 'userSummaryCache';
const USER_SUMMARY_TTL_MS = 5 * 60 * 1000; // 5 minutes
let sessionEndpointMissing = false; // module-scoped cache to avoid repeated 404 calls

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const navigate = useNavigate();
  const showToast = useToast();

  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // ensure auth cookie/session is cleared server-side
      });
    } catch (e) {
      console.error('Logout API call failed, clearing locally:', e);
    }
    setCurrentUser(null);
    // clear cached summary on logout
    try { localStorage.removeItem(USER_SUMMARY_CACHE_KEY); } catch (e) { }
    navigate('/');
    showToast('You have been successfully logged out.', 'info');
  }, [navigate, showToast]);

  const handleLoginSuccess = useCallback((user) => {
    setCurrentUser(user);
    // cache a minimal non-sensitive summary for quick rehydrate
    try {
      const summary = { id: user.id || user._id || user._id, username: user.username, role: user.role, profilePicture: user.profilePicture };
      const payload = { data: summary, expiresAt: Date.now() + USER_SUMMARY_TTL_MS };
      localStorage.setItem(USER_SUMMARY_CACHE_KEY, JSON.stringify(payload));
    } catch (e) {
      // ignore storage errors
    }
    if (user.role === 'admin') {
      navigate('/admin');
      showToast('You have been logged in as an administrator. Redirecting to the admin dashboard.', 'info');
    } else if (user.role === 'user') {
      navigate('/');
      showToast(`Welcome, ${user.username}!`, 'success');
    }
  }, [navigate, showToast]);

  useEffect(() => {
    // On mount: one-time cleanup for old localFollowing key and try to seed currentUser quickly from cached minimal summary (non-authoritative)
    try {
      // remove stale follow-state key left by earlier client versions
      try { localStorage.removeItem('localFollowing'); } catch (e) { /* ignore */ }
    } catch (e) {
      // ignore
    }
    try {
      const raw = localStorage.getItem(USER_SUMMARY_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.expiresAt && parsed.expiresAt > Date.now() && parsed.data) {
          setCurrentUser(parsed.data);
        } else {
          try { localStorage.removeItem(USER_SUMMARY_CACHE_KEY); } catch (e) { }
        }
      }
    } catch (e) {
      // ignore malformed cache
    }

    const validateToken = async () => {
      if (sessionEndpointMissing) {
        // If server doesn't expose the session endpoint, skip checks to avoid repeated 404s
        console.warn('Skipping session check: /auth/session not available');
        setIsLoadingUser(false);
        return;
      }
      try {
        // Do a lightweight session check first (204 on success) to avoid fetching full user on expired sessions
        const sessionRes = await fetch(`${API_BASE_URL}/auth/session`, {
          method: 'GET',
          credentials: 'include',
        });

        if (sessionRes.ok) {
          // Session is valid — fetch full user profile
          const response = await fetch(`${API_BASE_URL}/auth/user`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
            // update cached summary
            try {
              const summary = { id: userData.id || userData._id, username: userData.username, role: userData.role, profilePicture: userData.profilePicture };
              const payload = { data: summary, expiresAt: Date.now() + USER_SUMMARY_TTL_MS };
              localStorage.setItem(USER_SUMMARY_CACHE_KEY, JSON.stringify(payload));
            } catch (e) { }
          } else {
            // Unexpected non-OK after session success — log a warning and clear stored user
            console.warn('Authenticated, but fetching user failed:', response.status);
            setCurrentUser(null);
            try { localStorage.removeItem(USER_SUMMARY_CACHE_KEY); } catch (e) { }
          }
        } else {
          // Session check failed (expired, invalid, or endpoint missing)
          if (sessionRes.status === 401) {
            const hadCachedUser = !!localStorage.getItem(USER_SUMMARY_CACHE_KEY);
            setCurrentUser(null);
            try { localStorage.removeItem(USER_SUMMARY_CACHE_KEY); } catch (e) { }
            if (hadCachedUser) {
              try { showToast('Your session has expired. Please sign in again.', 'info'); } catch (e) { }
            }
          } else if (sessionRes.status === 404) {
            // Endpoint not available on this server version — try a one-time fallback to /auth/user
            try {
              const fallback = await fetch(`${API_BASE_URL}/auth/user`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
              });
              if (fallback.ok) {
                const userData = await fallback.json();
                setCurrentUser(userData);
                // update cached summary
                try {
                  const summary = { id: userData.id || userData._id, username: userData.username, role: userData.role, profilePicture: userData.profilePicture };
                  const payload = { data: summary, expiresAt: Date.now() + USER_SUMMARY_TTL_MS };
                  localStorage.setItem(USER_SUMMARY_CACHE_KEY, JSON.stringify(payload));
                } catch (e) { }
              } else {
                sessionEndpointMissing = true;
                console.warn('Session endpoint not found (404). Skipping future session checks.');
              }
            } catch (e) {
              sessionEndpointMissing = true;
              console.warn('Session endpoint not found (404). Skipping future session checks.');
            }
          } else {
            console.warn('Session check returned:', sessionRes.status);
          }
        }
      } catch (error) {
        console.error('Network error during token validation:', error);
        setCurrentUser(null);
        try { localStorage.removeItem(USER_SUMMARY_CACHE_KEY); } catch (e) { }
        try { showToast('Could not connect to the server. Please try again later.', 'error'); } catch (e) { }
      }

      setIsLoadingUser(false);
    };

    validateToken();
  }, [handleLogout, showToast]);

  const updateCurrentUser = useCallback((updatedFields) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      // update cached summary
      try {
        const summary = { id: updated.id || updated._id, username: updated.username, role: updated.role, profilePicture: updated.profilePicture };
        const payload = { data: summary, expiresAt: Date.now() + USER_SUMMARY_TTL_MS };
        localStorage.setItem(USER_SUMMARY_CACHE_KEY, JSON.stringify(payload));
      } catch (e) {}
      return updated;
    });
  }, []);

  const value = {
    currentUser,
    isLoadingUser,
    login: handleLoginSuccess,
    logout: handleLogout,
    updateCurrentUser,
  };

  const memoed = React.useMemo(() => value, [currentUser, isLoadingUser, handleLoginSuccess, handleLogout, updateCurrentUser]);

  return <AuthContext.Provider value={memoed}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};