import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2, CheckCircle, MessageSquare, User, Trophy, X } from 'lucide-react';

const initialNotifications = [
  {
    id: '1',
    type: 'achievement',
    text: 'Congratulations! You achieved a new rank: "Quiz Master".',
    date: '2 hours ago',
    unread: true,
  },
  {
    id: '2',
    type: 'social',
    text: 'vish2 followed you back.',
    date: '1 day ago',
    unread: true,
  },
  {
    id: '3',
    type: 'feedback',
    text: 'Your question on the forum has a new answer.',
    date: '3 days ago',
    unread: false,
  }
];

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState('all');

  const handleDismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return n.unread;
    return n.type === activeFilter;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'feedback':
        return <MessageSquare size={18} />;
      case 'social':
        return <User size={18} />;
      case 'achievement':
        return <Trophy size={18} />;
      default:
        return <Bell size={18} />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'feedback':
        return 'bg-teal-50/60 text-teal-650 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30';
      case 'social':
        return 'bg-blue-50/60 text-blue-650 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30';
      case 'achievement':
        return 'bg-amber-50/60 text-amber-650 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30';
      default:
        return 'bg-purple-50/60 text-purple-650 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30';
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-transparent text-gray-900 dark:text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-teal-600 via-emerald-500 to-indigo-600 dark:from-teal-400 dark:via-emerald-300 dark:to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
              <Bell className="text-teal-400 shrink-0" size={32} />
              Notifications
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Stay updated with your achievements, social connections, and forum discussions.
            </p>
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-3 shrink-0">
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-white/20 text-gray-750 dark:text-white transition duration-200"
              >
                <CheckCircle size={14} />
                Mark all read
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-red-500/10 border border-rose-200 dark:border-red-500/20 dark:hover:bg-red-500/20 dark:hover:border-red-500/30 text-rose-600 dark:text-red-300 transition duration-200"
              >
                <Trash2 size={14} />
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        {notifications.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-white/10 pb-4 mb-6">
            {['all', 'unread', 'achievement', 'social', 'feedback'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize border transition duration-200 ${
                  activeFilter === filter
                    ? 'bg-gradient-to-r from-purple-500 to-[#167468] text-white border-transparent shadow-md'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-900 dark:bg-white/5 dark:border-white/10 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10'
                }`}
              >
                {filter === 'achievement' ? 'Achievements' : filter}
              </button>
            ))}
          </div>
        )}

        {/* Notifications list */}
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur rounded-2xl shadow-xl overflow-hidden p-6 shadow-sm dark:shadow-none">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredNotifications.map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`flex items-start justify-between py-4 first:pt-0 last:pb-0 gap-4 group ${
                      n.unread ? 'bg-gray-50/70 dark:bg-white/[0.02] -mx-6 px-6' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-xl shrink-0 ${getIconBg(n.type)}`}>
                        {getIcon(n.type)}
                      </div>
                      <div>
                        <p className={`text-sm ${n.unread ? 'text-gray-950 dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                          {n.text}
                        </p>
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                          {n.date}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDismiss(n.id)}
                      className="p-1 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white dark:hover:bg-white/10 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Dismiss notification"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Bell className="mx-auto text-gray-400 dark:text-gray-600 mb-4" size={48} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">All Caught Up!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {activeFilter === 'all'
                    ? "You don't have any notifications right now."
                    : `No notifications match the "${activeFilter}" filter.`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default NotificationsPage;
