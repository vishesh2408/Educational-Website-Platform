// src/components/AdminDashboard.js
import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, GraduationCap, BookOpen, Code, Award,
    MessageSquare, Briefcase, GitBranch, NotebookText, Settings,
    LogOut, Info
} from 'lucide-react';
import Toast from './Toast';
import { useAuth } from '../contexts/AuthContext';
import CourseManagement from './CourseManagement';
import ContestManagement from './ContestManagement';
import QuizManagement from './QuizManagement';
import ForumPostManagement from './ForumPostManagement';
import SkillManagement from './SkillManagement';
import TrackManagement from './TrackManagement';
import NoteManagement from './NoteManagement';
import DashboardOverview from './DashboardOverview';
import AdminForumManagement from './AdminForumManagement';
import './AdminDashboard.css';

const SidebarLink = ({ icon, label, active, onClick }) => (
    <li>
        <button
            className={`sidebar-link-button ${active ? 'active' : ''}`}
            onClick={onClick}
        >
            {icon}
            <span className="sidebar-link-text">{label}</span>
        </button>
    </li>
);

const AdminDashboard = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'info', timeout = 3500) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), timeout);
    };

    if (!currentUser || currentUser.role !== 'admin') {
        return <Navigate to="/auth" replace />;
    }

    const activePath = location.pathname.split('/')[2] || 'overview';

    return (
        <div className="admin-dashboard-container">
            <aside className={`admin-sidebar ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
                <div className="admin-sidebar-nav-section">
                    <h2 className="admin-sidebar-nav-title">Navigation</h2>
                    <ul className="admin-sidebar-nav-list">
                        <SidebarLink icon={<LayoutDashboard size={18} />} label="Dashboard" active={activePath === 'overview'} onClick={() => navigate('/admin/overview')} />
                        <SidebarLink icon={<Users size={18} />} label="Users" active={activePath === 'users'} onClick={() => navigate('/admin/users')} />
                        <SidebarLink icon={<GraduationCap size={18} />} label="Staff" active={activePath === 'staff'} onClick={() => navigate('/admin/staff')} />
                        <SidebarLink icon={<BookOpen size={18} />} label="Courses" active={activePath === 'courses'} onClick={() => navigate('/admin/courses')} />
                        <SidebarLink icon={<Code size={18} />} label="Contests" active={activePath === 'contests'} onClick={() => navigate('/admin/contests')} />
                        <SidebarLink icon={<Award size={18} />} label="Quizzes" active={activePath === 'quizzes'} onClick={() => navigate('/admin/quizzes')} />
                        <SidebarLink icon={<MessageSquare size={18} />} label="Forum Posts" active={activePath === 'forum-posts'} onClick={() => navigate('/admin/forum-posts')} />
                        <SidebarLink icon={<MessageSquare size={18} />} label="Forum Premium" active={activePath === 'forum-premiums'} onClick={() => navigate('/admin/forum-premiums')} />
                        <SidebarLink icon={<Briefcase size={18} />} label="Skills" active={activePath === 'skills'} onClick={() => navigate('/admin/skills')} />
                        <SidebarLink icon={<GitBranch size={18} />} label="Tracks" active={activePath === 'tracks'} onClick={() => navigate('/admin/tracks')} />
                        <SidebarLink icon={<NotebookText size={18} />} label="Notes" active={activePath === 'notes'} onClick={() => navigate('/admin/notes')} />
                        <SidebarLink icon={<Settings size={18} />} label="Settings" active={false} onClick={() => showToast('Settings coming soon!', 'info')} />
                    </ul>
                </div>
            </aside>
            <div className="admin-main-content">
                <Toast toast={toast} onClose={() => setToast(null)} />
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="mobile-sidebar-toggle-button"
                    aria-label="Toggle sidebar"
                >
                    <Info size={24} />
                </button>
                <h1 className="admin-page-title">Admin Dashboard</h1>
                <div className="admin-content-card">
                    <div className="admin-welcome-header">
                        <h2 className="admin-welcome-title">
                            Welcome, <span className="admin-welcome-username">{currentUser?.username || 'Admin'}</span>!
                        </h2>
                        <button onClick={logout} className="admin-logout-button">
                            <LogOut size={20} className="icon-mr" /> Logout
                        </button>
                    </div>
                    <p className="admin-welcome-text">Manage your website's content.</p>
                    <Routes>
                        <Route path="overview" element={<DashboardOverview />} />
                        <Route path="courses" element={<CourseManagement />} />
                        <Route path="contests" element={<ContestManagement />} />
                        <Route path="quizzes" element={<QuizManagement />} />
                        <Route path="forum-posts" element={<ForumPostManagement />} />
                        <Route path="forum-premiums" element={<AdminForumManagement />} />
                        <Route path="skills" element={<SkillManagement />} />
                        <Route path="users" element={React.createElement(require('./AdminUserManagement').default)} />
                        <Route path="staff" element={React.createElement(require('./StaffManagement').default)} />
                        <Route path="tracks" element={<TrackManagement />} />
                        <Route path="notes" element={<NoteManagement />} />
                        {/* ✅ This is the fix. It redirects the base /admin path to /admin/overview. */}
                        <Route path="/" element={<Navigate to="overview" replace />} />
                        <Route path="*" element={<DashboardOverview />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;



