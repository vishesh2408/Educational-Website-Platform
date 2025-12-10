


// import React, { useState, useEffect } from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import HomePage from './components/HomePage';
// import ContestsPage from './components/ContestsPage';
// import ForumPage from './components/ForumPage';
// import QuizzesPage from './components/QuizzesPage';
// import CoursesPage from './components/CoursesPage';
// import AdminDashboard from './components/AdminDashboard';
// import AuthPage from './components/AuthPage';
// import Profile from './components/Profile';
// import PageSection from './components/PageSection';
// import UserDashboard from './components/UserDashboard';
// import { useAuth } from './contexts/AuthContext';
// import { useTheme } from './contexts/ThemeContext';
// import './App.css';

// export default function App() {
//   const { currentUser, isLoadingUser, logout } = useAuth();
//   const { theme, toggleTheme } = useTheme();
//   const [isMenuOpen, setIsMenuOpen] = useState(false);

//   useEffect(() => {
//     if (!document.querySelector('link[href*="font-awesome"]')) {
//       const link = document.createElement('link');
//       link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
//       link.rel = 'stylesheet';
//       document.head.appendChild(link);
//     }
//   }, []);

//   if (isLoadingUser) {
//     return (
//       <div className="flex items-center justify-center min-h-[calc(100vh-7rem)] text-2xl text-gray-600">
//         Loading user session...
//       </div>
//     );
//   }

//   return (
//     // FIX: Removed `flex flex-col min-h-screen` from here. 
//     // We will handle the layout one level down in UserDashboard.
//     <div className={`${theme}-theme`}> 
//       <Routes>
//         <Route path="/" element={<Navigate to="/user/dashboard" />} />
//         <Route path="/auth" element={<AuthPage />} />
//         <Route path="/admin/*" element={<AdminDashboard />} />

//         <Route
//           path="/user/dashboard"
//           element={
//             <UserDashboard
//               theme={theme}
//               toggleTheme={toggleTheme}
//               user={currentUser}
//               logout={logout}
//               isMenuOpen={isMenuOpen}
//               setIsMenuOpen={setIsMenuOpen}
//             />
//           }>
//           <Route index element={<HomePage />} />
//           <Route path="profile" element={<Profile />} />
//           <Route path="contests" element={<ContestsPage />} />
//           <Route path="forum" element={<ForumPage />} />
//           <Route path="courses" element={<CoursesPage />} />
//           <Route path="quizzes" element={<QuizzesPage />} />
//         </Route>

//         <Route
//           path="*"
//           element={
//             <PageSection title="Page Not Found">
//               <p className="text-center text-lg text-gray-600">The page you’re looking for does not exist.</p>
//             </PageSection>
//           }
//         />
//       </Routes>
//     </div>
//   );
// }



import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-7rem)] text-2xl text-gray-600">
        Loading user session...
      </div>
    );
  }

  return (
    <div className={`${theme}-theme`}>
      <Suspense fallback={<div className="p-6">Loading…</div>}>
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
