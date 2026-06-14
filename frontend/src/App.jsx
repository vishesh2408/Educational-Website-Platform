

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LearnBentIcon from './contexts/LearnBentIcon';
import HomePage from './components/HomePage';
const ContestsPage = lazy(() => import('./components/ContestsPage'));
const ForumPage = lazy(() => import('./components/ForumPage'));
const QuizzesPage = lazy(() => import('./components/QuizzesPage'));
const CoursesPage = lazy(() => import('./components/CoursesPage'));
const CourseDetail = lazy(() => import('./components/CourseDetail'));
const TutorialDetail = lazy(() => import('./components/TutorialDetail'));
const TopicView = lazy(() => import('./components/TopicView'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
import AuthPage from './components/AuthPage';
const Profile = lazy(() => import('./components/Profile'));
const NotificationsPage = lazy(() => import('./components/NotificationsPage'));
const CommunityPage = lazy(() => import('./components/CommunityPage'));
const PageSection = lazy(() => import('./components/PageSection'));
import UserDashboard from './components/UserDashboard';
const PaymentPage = lazy(() => import('./components/PaymentPage'));
const PaymentStatus = lazy(() => import('./components/PaymentStatus'));
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { ProtectedRoute, AdminRoute, UserRoute } from './components/ProtectedRoute';
import './App.css';
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const SubscriptionsPage = lazy(() => import('./components/SubscriptionsPage'));
const ForumPremiumPage = lazy(() => import('./components/ForumPremiumPage'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white/20 dark:bg-slate-950/40 backdrop-blur-md flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center justify-center">
        {/* Logo (same style as navbar) */}
        <div className="flex items-center gap-3 mb-8">
          <LearnBentIcon size={64} className="drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]" />
          <span className="text-gray-900 dark:text-white font-bold text-3xl">LearnBent</span>
        </div>

        {/* Animated Colorful Loader - Centered */}
        <div className="relative flex items-center justify-center w-64 h-64">
          <div className="absolute w-12 h-12 bg-[rgb(158,136,246)] rounded animate-move" style={{ animationDelay: '-1s' }} />
          <div className="absolute w-12 h-12 bg-[rgb(97,183,253)] rounded animate-move" style={{ animationDelay: '-2s' }} />
          <div className="absolute w-12 h-12 bg-[rgb(95,249,175)] rounded animate-move" style={{ animationDelay: '-3s' }} />
          <div className="absolute w-12 h-12 bg-[rgb(243,171,89)] rounded animate-move" style={{ animationDelay: '-4s' }} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { currentUser, isLoadingUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.scrollTo({ top: 0, behavior: 'instant' });
    document.body.scrollTo({ top: 0, behavior: 'instant' });
  }, [location]);

  useEffect(() => {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement('link');
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className={`${theme}-theme relative min-h-screen`}>
      {isLoadingUser && <FullScreenLoader />}
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to={currentUser?.role === 'admin' ? '/admin' : '/user/dashboard'} />} />

          {/* Public Route */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />


          {/* Admin Protected Route */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* User Protected Route */}
          {/* User Dashboard - Now publicly accessible */}
          <Route path="/user/dashboard/*" element={<UserDashboard />}>
            <Route index element={<HomePage />} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
            <Route path="contests" element={<ContestsPage />} />
            <Route path="forum" element={<ForumPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:id" element={<CourseDetail />} />
            <Route path="courses/:id/topics/:topicId" element={<TopicView />} />
            <Route path="tutorials/:id" element={<TutorialDetail />} />
            <Route path="tutorials/:id/topics/:topicId" element={<TopicView />} />
            <Route path="quizzes" element={<QuizzesPage />} />
            <Route path="payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
            <Route path="forum-premium" element={<ForumPremiumPage />} />
            <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          </Route>

          {/* User account subscriptions (outside dashboard path for direct link) */}
          {/* User account subscriptions - Protected */}
          <Route
            path="/user/account/subscriptions"
            element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>}
          />

          <Route
            path="/payment-status"
            element={<ProtectedRoute><PaymentStatus /></ProtectedRoute>}
          />

          {/* Catch-all */}
          <Route
            path="*"
            element={
              <PageSection title="Page Not Found">
                <p className="text-center text-lg text-gray-600">The page you’re looking for does not exist.</p>
              </PageSection>
            }
          />
        </Routes>
      </Suspense>
    </div>
  );
}
