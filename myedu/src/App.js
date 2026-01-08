

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
const HomePage = lazy(() => import('./components/HomePage'));
const ContestsPage = lazy(() => import('./components/ContestsPage'));
const ForumPage = lazy(() => import('./components/ForumPage'));
const QuizzesPage = lazy(() => import('./components/QuizzesPage'));
const CoursesPage = lazy(() => import('./components/CoursesPage'));
const CourseDetail = lazy(() => import('./components/CourseDetail'));
const TopicView = lazy(() => import('./components/TopicView'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AuthPage = lazy(() => import('./components/AuthPage'));
const Profile = lazy(() => import('./components/Profile'));
const PageSection = lazy(() => import('./components/PageSection'));
const UserDashboard = lazy(() => import('./components/UserDashboard'));
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { ProtectedRoute, AdminRoute, UserRoute } from './components/ProtectedRoute';
import './App.css';
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const SubscriptionsPage = lazy(() => import('./components/SubscriptionsPage'));

function FullScreenLoader() {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center justify-center">
        {/* Logo (same style as navbar) */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-[#167468] p-4 rounded-xl">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <span className="text-white font-bold text-3xl">LearnBent</span>
        </div>

        {/* Animated Colorful Loader - Centered */}
        <div className="relative flex items-center justify-center w-64 h-64">
          <div className="absolute w-12 h-12 bg-[rgb(158,136,246)] rounded animate-move shadow-[0px_7px_29px_0px_rgb(158,136,246)]" style={{ animationDelay: '-1s' }} />
          <div className="absolute w-12 h-12 bg-[rgb(97,183,253)] rounded animate-move shadow-[0px_7px_29px_0px_rgb(97,183,253)]" style={{ animationDelay: '-2s' }} />
          <div className="absolute w-12 h-12 bg-[rgb(95,249,175)] rounded animate-move shadow-[0px_7px_29px_0px_rgb(95,249,175)]" style={{ animationDelay: '-3s' }} />
          <div className="absolute w-12 h-12 bg-[rgb(243,171,89)] rounded animate-move shadow-[0px_7px_29px_0px_rgb(243,171,89)]" style={{ animationDelay: '-4s' }} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { currentUser, isLoadingUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement('link');
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  if (isLoadingUser) {
    return <FullScreenLoader />;
  }

  return (
    <div className={`${theme}-theme`}>
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
        <Route
          path="/user/dashboard/*"
          element={
            <UserRoute>
              <UserDashboard />
            </UserRoute>
          }>
          <Route index element={<HomePage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="contests" element={<ContestsPage />} />
          <Route path="forum" element={<ForumPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="courses/:id/topics/:topicId" element={<TopicView/>} />
          <Route path="quizzes" element={<QuizzesPage />} />
        </Route>

        {/* User account subscriptions (outside dashboard path for direct link) */}
        <Route
          path="/user/account/subscriptions"
          element={
            <UserRoute>
              <SubscriptionsPage />
            </UserRoute>
          }
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
