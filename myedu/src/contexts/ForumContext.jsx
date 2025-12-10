// src/contexts/ForumContext.jsx
import React, { createContext, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const ForumContext = createContext(null);

export const ForumProvider = ({ children, forumHandlers }) => {
  const { currentUser } = useAuth();
  const showToast = useToast();

  const value = React.useMemo(
    () => ({
      currentUser,
      showToast,
      onReply: forumHandlers?.onReply,
      onLike: forumHandlers?.onLike,
      onMarkAsSolution: forumHandlers?.onMarkAsSolution,
      onToggleReplies: forumHandlers?.onToggleReplies,
    }),
    [currentUser, showToast, forumHandlers?.onReply, forumHandlers?.onLike, forumHandlers?.onMarkAsSolution, forumHandlers?.onToggleReplies]
  );

  return (
    <ForumContext.Provider value={value}>
      {children}
    </ForumContext.Provider>
  );
};

export const useForumContext = () => {
  const context = useContext(ForumContext);
  if (!context) {
    throw new Error('useForumContext must be used within a ForumProvider');
  }
  return context;
};
