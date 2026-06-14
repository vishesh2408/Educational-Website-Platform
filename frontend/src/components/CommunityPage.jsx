import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, UserCheck, Search, Heart, Bell, Check, X, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { normalizeImageSrc } from '../utils/image';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

const CommunityPage = () => {
  const { currentUser } = useAuth();
  const showToast = useToast();
  const location = useLocation();
  
  const [friendInput, setFriendInput] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [friendRequests, setFriendRequests] = useState({ sent: [], received: [] });
  const [profileData, setProfileData] = useState({
    social: { followers: 0, following: 0, friends: [], followingList: [] }
  });

  // Dynamic Lists States
  const [activeListType, setActiveListType] = useState('friends'); // 'followers', 'following', 'friends'
  const [friends, setFriends] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Fetch initial profile / social data
  const fetchSocialData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/profile/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProfileData(prev => ({
          ...prev,
          social: data.social || { followers: 0, following: 0, friends: [], followingList: [] }
        }));
      }
    } catch (err) {
      console.error('Failed to fetch social data', err);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/friend-requests`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFriendRequests({ sent: data.sent || [], received: data.received || [] });
      }
    } catch (err) {
      console.error('Failed to fetch friend requests', err);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/friends`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch (err) {
      console.error('Failed to fetch friends', err);
    }
  };

  const fetchFollowing = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/following`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFollowing(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch following', err);
    }
  };

  const fetchFollowers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/followers`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFollowers(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch followers', err);
    }
  };

  const fetchAllLists = async () => {
    setLoadingList(true);
    await Promise.all([fetchFriends(), fetchFollowing(), fetchFollowers()]);
    setLoadingList(false);
  };

  useEffect(() => {
    fetchSocialData();
    fetchFriendRequests();
    fetchAllLists();
  }, []);

  // Listen to redirect tab state from Profile page clicks
  useEffect(() => {
    if (location.state && location.state.activeTab) {
      setActiveListType(location.state.activeTab);
    }
  }, [location.state]);

  // Search logic for connection matching
  useEffect(() => {
    if (!friendInput || friendInput.trim() === '') {
      setFilteredUsers([]);
      setSelectedUser(null);
      setSearching(false);
      setHighlightedIndex(-1);
      return;
    }

    setSearching(true);
    const q = friendInput.trim();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/public/users?q=${encodeURIComponent(q)}`);
        if (!res.ok) {
          setFilteredUsers([]);
          setSearching(false);
          return;
        }
        const users = await res.json();
        setFilteredUsers(users || []);
        setHighlightedIndex(-1);
        const exact = users && users.find(u => (u.username || '').toLowerCase() === q.toLowerCase());
        setSelectedUser(exact || null);
      } catch (err) {
        console.error('User search failed', err);
        setFilteredUsers([]);
      } finally {
        setSearching(false);
      }
    }, 220);

    return () => clearTimeout(t);
  }, [friendInput]);

  const handleSelectSuggestion = (user) => {
    setFriendInput(user.username);
    setSelectedUser(user);
    setFilteredUsers([]);
  };

  const handleAddFriend = async () => {
    const usernameToSend = selectedUser ? selectedUser.username : friendInput.trim();
    if (!usernameToSend) {
      showToast('Please enter a valid username.', 'error');
      return;
    }
    if (requestSent) {
      showToast('Friend request already sent.', 'info');
      return;
    }
    
    const username = usernameToSend;
    const pendingId = `pending-${Date.now()}`;
    const pendingUser = { _id: pendingId, username, profilePicture: '', role: selectedUser?.role || 'user' };
    
    setFriendRequests(prev => ({ ...prev, sent: [...(prev.sent || []), pendingUser] }));
    setRequestSent(true);
    showToast(`Friend request sent to ${username}`, 'info');

    try {
      const res = await fetch(`${API_BASE_URL}/user/friend-request-by-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username })
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) {
        setFriendRequests(prev => ({ ...prev, sent: (prev.sent || []).filter(u => u._id !== pendingId) }));
        setRequestSent(false);
        showToast(result?.msg || 'Failed to send friend request', 'error');
      } else {
        showToast(`Friend request delivered to ${username}`, 'success');
        fetchFriendRequests();
      }
    } catch (err) {
      console.error(err);
      setFriendRequests(prev => ({ ...prev, sent: (prev.sent || []).filter(u => u._id !== pendingId) }));
      setRequestSent(false);
      showToast('Network error during friend request', 'error');
    }
  };

  const handleAcceptRequest = async (senderId) => {
    const senderObj = friendRequests.received.find(u => String(u._id) === String(senderId));
    if (!senderObj) return showToast('Request not found', 'error');

    setFriendRequests(prev => ({ ...prev, received: (prev.received || []).filter(u => String(u._id) !== String(senderId)) }));
    showToast(`Accepted friend request from ${senderObj.username}`, 'success');

    try {
      const res = await fetch(`${API_BASE_URL}/user/friend-request/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ senderId })
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) {
        fetchFriendRequests();
        showToast(result?.msg || 'Failed to accept friend request', 'error');
      } else {
        fetchSocialData();
        fetchFriendRequests();
        fetchAllLists();
      }
    } catch (err) {
      console.error(err);
      fetchFriendRequests();
      showToast('Network error while accepting request', 'error');
    }
  };

  const handleDeclineRequest = async (otherUserId) => {
    const wasReceived = (friendRequests.received || []).some(u => String(u._id) === String(otherUserId));
    const wasSent = (friendRequests.sent || []).some(u => String(u._id) === String(otherUserId));
    const originalReceived = [...friendRequests.received];
    const originalSent = [...friendRequests.sent];

    setFriendRequests(prev => ({
      ...prev,
      received: (prev.received || []).filter(u => String(u._id) !== String(otherUserId)),
      sent: (prev.sent || []).filter(u => String(u._id) !== String(otherUserId))
    }));
    showToast('Friend request removed', 'info');

    try {
      const res = await fetch(`${API_BASE_URL}/user/friend-request/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ otherUserId })
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) {
        setFriendRequests(prev => ({
          ...prev,
          received: wasReceived ? originalReceived : prev.received,
          sent: wasSent ? originalSent : prev.sent
        }));
        showToast(result?.msg || 'Failed to remove request', 'error');
      } else {
        fetchFriendRequests();
        fetchAllLists();
      }
    } catch (err) {
      console.error(err);
      setFriendRequests(prev => ({
        ...prev,
        received: wasReceived ? originalReceived : prev.received,
        sent: wasSent ? originalSent : prev.sent
      }));
      showToast('Network error while declining request', 'error');
    }
  };

  const handleFollowBack = async (targetId) => {
    if (!targetId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/user/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetUserId: targetId })
      });
      const result = await res.json().catch(() => null);
      if (res.ok) {
        showToast(result?.msg || 'Followed back', 'success');
        fetchSocialData();
        fetchAllLists();
      } else {
        showToast(result?.msg || 'Failed to follow', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error during follow action', 'error');
    }
  };

  const handleUnfollow = async (targetId) => {
    if (!targetId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/user/unfollow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: targetId })
      });
      const result = await res.json().catch(() => null);
      if (res.ok) {
        showToast(result?.msg || 'Unfollowed', 'success');
        fetchSocialData();
        fetchAllLists();
      } else {
        showToast(result?.msg || 'Failed to unfollow', 'error');
      }
    } catch (err) {
      console.error('Unfollow error', err);
      showToast('Network error occurred while unfollowing.', 'error');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-transparent text-gray-900 dark:text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-teal-600 via-emerald-500 to-indigo-600 dark:from-teal-400 dark:via-emerald-300 dark:to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
            <Users className="text-teal-400 shrink-0" size={32} />
            Community
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Build your connections, view followers, check who you are following, and connect.
          </p>
        </div>

        {/* Clickable Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setActiveListType('followers')}
            className={`border rounded-2xl p-4 text-center cursor-pointer transition duration-300 hover:scale-105 active:scale-98 ${
              activeListType === 'followers'
                ? 'bg-teal-500/10 border-teal-500/60 shadow-[0_0_20px_rgba(20,184,166,0.15)]'
                : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm dark:shadow-none'
            }`}
          >
            <h3 className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-300">
              {profileData.social?.followers || 0}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Followers</p>
            <span className="text-[10px] text-teal-600/70 dark:text-teal-400/70 block mt-1">Click to view</span>
          </button>
          
          <button
            onClick={() => setActiveListType('following')}
            className={`border rounded-2xl p-4 text-center cursor-pointer transition duration-300 hover:scale-105 active:scale-98 ${
              activeListType === 'following'
                ? 'bg-teal-500/10 border-teal-500/60 shadow-[0_0_20px_rgba(20,184,166,0.15)]'
                : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm dark:shadow-none'
            }`}
          >
            <h3 className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-300">
              {profileData.social?.following || 0}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Following</p>
            <span className="text-[10px] text-teal-600/70 dark:text-teal-400/70 block mt-1">Click to view</span>
          </button>
          
          <button
            onClick={() => setActiveListType('friends')}
            className={`border rounded-2xl p-4 text-center cursor-pointer transition duration-300 hover:scale-105 active:scale-98 ${
              activeListType === 'friends'
                ? 'bg-teal-500/10 border-teal-500/60 shadow-[0_0_20px_rgba(20,184,166,0.15)]'
                : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm dark:shadow-none'
            }`}
          >
            <h3 className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-300">
              {friends.length || profileData.social?.friends?.length || 0}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Friends</p>
            <span className="text-[10px] text-teal-600/70 dark:text-teal-400/70 block mt-1">Click to view</span>
          </button>
        </div>

        {/* Main Content Card */}
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur rounded-2xl shadow-xl p-6 space-y-8 shadow-sm dark:shadow-none">
          
          {/* Find and Connect */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Search size={18} className="text-teal-400" />
              Find and Connect
            </h3>
            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={friendInput}
                  onChange={(e) => { setFriendInput(e.target.value); setRequestSent(false); }}
                  placeholder="Enter username to add"
                  className="flex-grow px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={handleAddFriend}
                  className="bg-gradient-to-r from-purple-500 to-[#167468] hover:opacity-90 px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-1.5 transition duration-200"
                >
                  <UserPlus size={16} />
                  Connect
                </button>
              </div>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {friendInput.trim() && (searching || filteredUsers.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl max-h-52 overflow-y-auto"
                  >
                    {searching ? (
                      <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">Searching...</div>
                    ) : (
                      <div className="p-1 divide-y divide-gray-100 dark:divide-white/5">
                        {filteredUsers.map((u) => {
                          const isSent = (friendRequests.sent || []).some(s => s._id === u._id || s.username === u.username);
                          const isFollowing = (profileData.social?.followingList || []).some(f => String(f) === String(u._id));
                          return (
                            <div key={u._id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg">
                              <div className="flex items-center gap-3">
                                <img
                                  src={u.profilePicture ? normalizeImageSrc(u.profilePicture) : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=0D8ABC&color=fff&size=128`}
                                  alt={u.username}
                                  className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10"
                                />
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{u.username}</div>
                                  <div className="text-xs text-gray-500 capitalize">{u.role || 'User'}</div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {isFollowing ? (
                                  <button onClick={() => handleUnfollow(u._id)} className="px-2.5 py-1 text-xs font-semibold rounded bg-red-600 hover:bg-red-700 text-white transition">Unfollow</button>
                                ) : isSent ? (
                                  <button onClick={() => handleDeclineRequest(u._id)} className="px-2.5 py-1 text-xs font-semibold rounded bg-red-600 hover:bg-red-700 text-white transition">Cancel</button>
                                ) : (
                                  <button
                                    onClick={() => { handleSelectSuggestion(u); handleAddFriend(); }}
                                    className="px-2.5 py-1 text-xs font-semibold rounded bg-teal-500 hover:bg-teal-650 dark:hover:bg-teal-400 text-white dark:text-slate-950 transition"
                                  >
                                    Add
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {requestSent && (
              <p className="mt-2 text-xs text-teal-600 dark:text-teal-400 font-medium flex items-center gap-1">
                <Check size={14} /> Friend request sent!
              </p>
            )}
          </div>

          <hr className="border-gray-200 dark:border-white/10" />

          {/* Dynamic List Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 capitalize">
              {activeListType === 'friends' && <Heart size={18} className="text-teal-400" />}
              {activeListType === 'followers' && <Users size={18} className="text-teal-400" />}
              {activeListType === 'following' && <UserCheck size={18} className="text-teal-400" />}
              {activeListType}
            </h3>

            {loadingList ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-24" />
                        <div className="h-3 bg-gray-150 dark:bg-white/5 rounded w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Friends List */}
                {activeListType === 'friends' && (
                  friends.length > 0 ? (
                    friends.map(friend => (
                      <div key={friend._id || friend.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl">
                        <div className="flex items-center gap-3">
                          <img
                            src={friend.profilePicture ? normalizeImageSrc(friend.profilePicture) : `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username)}&background=0D8ABC&color=fff&size=128`}
                            alt={friend.username}
                            className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 object-cover"
                          />
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{friend.username}</div>
                            <div className="text-xs text-gray-500 capitalize">{friend.role || 'Learner'}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-6 text-center text-sm text-gray-550 dark:text-gray-500">
                      No friends added yet. Connect with other users to grow your circle!
                    </div>
                  )
                )}

                {/* Followers List */}
                {activeListType === 'followers' && (
                  followers.length > 0 ? (
                    followers.map(user => {
                      const isFollowingUser = following.some(f => String(f.id || f._id) === String(user.id || user._id));
                      return (
                        <div key={user.id || user._id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.profilePicture ? normalizeImageSrc(user.profilePicture) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=0D8ABC&color=fff&size=128`}
                              alt={user.username}
                              className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 object-cover"
                            />
                            <div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.username}</div>
                              <div className="text-xs text-gray-500 capitalize">{user.role || 'Learner'}</div>
                            </div>
                          </div>
                          <div>
                            {isFollowingUser ? (
                              <button
                                onClick={() => handleUnfollow(user.id || user._id)}
                                className="px-2.5 py-1 text-xs font-semibold rounded bg-red-600 hover:bg-red-700 text-white transition duration-200"
                              >
                                Unfollow
                              </button>
                            ) : (
                              <button
                                onClick={() => handleFollowBack(user.id || user._id)}
                                className="px-2.5 py-1 text-xs font-semibold rounded bg-teal-500 hover:bg-teal-650 dark:hover:bg-teal-400 text-white dark:text-slate-950 transition duration-200"
                              >
                                Follow Back
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-6 text-center text-sm text-gray-550 dark:text-gray-500">
                      No followers to display yet.
                    </div>
                  )
                )}

                {/* Following List */}
                {activeListType === 'following' && (
                  following.length > 0 ? (
                    following.map(user => (
                      <div key={user.id || user._id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profilePicture ? normalizeImageSrc(user.profilePicture) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=0D8ABC&color=fff&size=128`}
                            alt={user.username}
                            className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 object-cover"
                          />
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.username}</div>
                            <div className="text-xs text-gray-500 capitalize">{user.role || 'Learner'}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnfollow(user.id || user._id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-red-600 hover:bg-red-700 text-white transition duration-200"
                        >
                          Unfollow
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-6 text-center text-sm text-gray-550 dark:text-gray-500">
                      You are not following anyone yet.
                    </div>
                  )
                )}

              </div>
            )}
          </div>

          <hr className="border-gray-200 dark:border-white/10" />

          {/* Incoming Requests */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell size={18} className="text-teal-400" />
              Incoming Requests
            </h3>
            <div className="space-y-3">
              {friendRequests.received.length > 0 ? (
                friendRequests.received.map(u => (
                  <div key={u._id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.profilePicture ? normalizeImageSrc(u.profilePicture) : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=0D8ABC&color=fff&size=128`}
                        alt={u.username}
                        className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 object-cover"
                      />
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{u.username}</div>
                        <div className="text-xs text-gray-500 capitalize">{u.role || 'User'}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(u._id)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-teal-500 hover:bg-teal-650 dark:hover:bg-teal-400 text-white dark:text-slate-950 rounded-lg transition duration-200"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(u._id)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-800 dark:text-white rounded-lg transition duration-200"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-sm text-gray-550 dark:text-gray-500">No incoming friend requests.</div>
              )}
            </div>
          </div>

          <hr className="border-gray-200 dark:border-white/10" />

          {/* Sent Requests */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus size={18} className="text-teal-400" />
              Sent Requests
            </h3>
            <div className="space-y-3">
              {friendRequests.sent.length > 0 ? (
                friendRequests.sent.map(u => (
                  <div key={u._id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.profilePicture ? normalizeImageSrc(u.profilePicture) : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&background=0D8ABC&color=fff&size=128`}
                        alt={u.username}
                        className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 object-cover"
                      />
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{u.username}</div>
                        <div className="text-xs text-gray-500 capitalize">{u.role || 'User'}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeclineRequest(u._id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200 shadow-sm"
                    >
                      Cancel Request
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-sm text-gray-550 dark:text-gray-500">No pending sent requests.</div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CommunityPage;
