import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Protect routes that require login
export const ProtectedRoute = ({ children }) => {
  const { currentUser, isLoadingUser } = useAuth();

  if (isLoadingUser) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

// Protect routes that require admin role
export const AdminRoute = ({ children }) => {
  const { currentUser, isLoadingUser } = useAuth();

  if (isLoadingUser) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (currentUser.role !== 'admin') {
    // Optional: redirect unauthorized users to dashboard
    return <Navigate to="/user/dashboard" replace />;
  }

  return children;
};

// Protect routes that require user role
export const UserRoute = ({ children }) => {
  const { currentUser, isLoadingUser } = useAuth();

  if (isLoadingUser) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (currentUser.role !== 'user') {
    // Optional: prevent admin from accessing user pages
    return <Navigate to="/admin" replace />;
  }

  return children;
};
