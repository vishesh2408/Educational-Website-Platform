// // src/components/DashboardOverview.js

import Skeleton from './Skeleton';
// src/components/DashboardOverview.js
import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Code } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import './AdminDashboard.css';

// ✅ Correct Recharts imports
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

// const API_BASE_URL = 'http://localhost:3001/api';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

// Calculate monthly activity from user registrations and content creation
const calculateMonthlyActivity = (users = [], courses = [], forumPosts = []) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyData = months.map((name, index) => ({ name, value: 0 }));

    // Count user registrations by month
    users.forEach(user => {
        if (user.createdAt) {
            const date = new Date(user.createdAt);
            const monthIndex = date.getMonth();
            if (monthIndex >= 0 && monthIndex < 12) {
                monthlyData[monthIndex].value += 1;
            }
        }
    });

    // Add course creation activity
    courses.forEach(course => {
        if (course.createdAt) {
            const date = new Date(course.createdAt);
            const monthIndex = date.getMonth();
            if (monthIndex >= 0 && monthIndex < 12) {
                monthlyData[monthIndex].value += 2; // Weight courses more
            }
        }
    });

    // Add forum post activity (smaller weight)
    forumPosts.forEach(post => {
        if (post.createdAt && !post.parentId) { // Only top-level posts
            const date = new Date(post.createdAt);
            const monthIndex = date.getMonth();
            if (monthIndex >= 0 && monthIndex < 12) {
                monthlyData[monthIndex].value += 0.5;
            }
        }
    });

    return monthlyData;
};

const StatCard = ({ title, value, color }) => (
    <div className={`stat-card ${color}`}>
        <h4 className="stat-card-value">{value}</h4>
        <p className="stat-card-title">{title}</p>
    </div>
);

const ChartCard = ({ title, children }) => (
    <div className="chart-card">
        <h4 className="chart-title">{title}</h4>
        <div className="chart-responsive-container">{children}</div>
    </div>
);

const DashboardOverview = () => {
    const { currentUser } = useAuth();
    const { openModal } = useModal();
    
    const [stats, setStats] = useState({
        totalCourses: 0, totalContests: 0, totalQuizzes: 0, totalForumPosts: 0,
        totalSkills: 0, totalTracks: 0, totalNotes: 0,
        courseTypeData: [], contestStatusData: [], forumCategoryData: [],
        monthlyData: [
            { name: 'Jan', value: 400 }, { name: 'Feb', value: 300 }, { name: 'Mar', value: 600 },
            { name: 'Apr', value: 800 }, { name: 'May', value: 500 }, { name: 'Jun', value: 700 },
            { name: 'Jul', value: 900 }
        ],
    });
    // pricing/subscription-related state removed from admin dashboard
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    // Paid courses list (used for subscription/pricing summaries if needed)
    const [paidCourses, setPaidCourses] = useState([]);
    // show skeleton while dashboard stats load

    const fetchDashboardStats = useCallback(async () => {
        setIsLoadingStats(true);

        const fetchOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        };

        try {
            const [coursesRes, contestsRes, quizzesRes, forumPostsRes, skillsRes, tracksRes, notesRes, usersRes] =
                await Promise.all([
                    fetch(`${API_BASE_URL}/admin/courses`, fetchOptions),
                    fetch(`${API_BASE_URL}/admin/contests`, fetchOptions),
                    fetch(`${API_BASE_URL}/admin/quizzes`, fetchOptions),
                    fetch(`${API_BASE_URL}/admin/forum-posts`, fetchOptions),
                    fetch(`${API_BASE_URL}/admin/skills`, fetchOptions),
                    fetch(`${API_BASE_URL}/admin/tracks`, fetchOptions),
                    fetch(`${API_BASE_URL}/admin/notes`, fetchOptions),
                    fetch(`${API_BASE_URL}/admin/users`, fetchOptions).catch(() => null), // Optional: may not exist
                ]);

            if ([coursesRes, contestsRes, quizzesRes, forumPostsRes, skillsRes, tracksRes, notesRes]
                .some(res => res && (res.status === 401 || res.status === 403))) {
                openModal('Session Expired', 'You are unauthorized. Please log in with admin privileges.');
                setIsLoadingStats(false);
                return;
            }

            const [coursesData, contestsData, quizzesData, forumPostsData, skillsData, tracksData, notesData, usersData] =
                await Promise.all([
                    coursesRes.json(), contestsRes.json(), quizzesRes.json(), forumPostsRes.json(),
                    skillsRes.json(), tracksRes.json(), notesRes.json(),
                    usersRes ? usersRes.json().catch(() => []) : Promise.resolve([]),
                ]);

            const courseType = Object.entries(coursesData.reduce((acc, course) => { acc[course.type] = (acc[course.type] || 0) + 1; return acc; }, {}))
                .map(([name, value]) => ({ name, value }));
            const contestStatus = Object.entries(contestsData.reduce((acc, contest) => { acc[contest.status] = (acc[contest.status] || 0) + 1; return acc; }, {}))
                .map(([name, value]) => ({ name, value }));
            const forumCategory = Object.entries(forumPostsData.reduce((acc, post) => { if (!post.parentId) { acc[post.category] = (acc[post.category] || 0) + 1; } return acc; }, {}))
                .map(([name, value]) => ({ name, value }));

            // Calculate monthly user registration activity from actual data
            // Note: If admin/users endpoint doesn't exist, usersData will be empty array
            const monthlyData = calculateMonthlyActivity(Array.isArray(usersData) ? usersData : [], coursesData, forumPostsData);

            // Filter paid courses for subscription section
            const paidCoursesData = coursesData.filter(course => course.type === 'paid' && course.status === 'running');

            setStats({
                totalCourses: coursesData.length, totalContests: contestsData.length, totalQuizzes: quizzesData.length,
                totalForumPosts: forumPostsData.length, totalSkills: skillsData.length, totalTracks: tracksData.length,
                totalNotes: notesData.length,
                courseTypeData: courseType, contestStatusData: contestStatus, forumCategoryData: forumCategory,
                monthlyData: monthlyData,
            });
            setPaidCourses(paidCoursesData);

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            // Fallback to empty monthly data on error
            setStats(prev => ({ ...prev, monthlyData: [] }));
        } finally {
            setIsLoadingStats(false);
        }
    }, [openModal]);

    useEffect(() => { fetchDashboardStats(); }, [fetchDashboardStats]);

    // subscription/pricing functions removed from admin dashboard

    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#8A2BE2', '#DE3163'];

    return (
        <div className="dashboard-overview-container">
            {isLoadingStats ? (
                <div className="p-4">{/* dashboard skeleton */}
                    <Skeleton variant="card" count={1} />
                 </div>
            ) : (
                <>
                    <h3 className="admin-section-title"><LayoutDashboard size={20} /> Dashboard Overview</h3>
                    <div className="dashboard-overview-grid">
                        <StatCard title="Total Courses" value={stats.totalCourses} color="stat-card-pink" />
                        <StatCard title="Total Contests" value={stats.totalContests} color="stat-card-orange" />
                        <StatCard title="Total Quizzes" value={stats.totalQuizzes} color="stat-card-purple" />
                        <StatCard title="Total Forum Posts" value={stats.totalForumPosts} color="stat-card-yellow" />
                        <StatCard title="Total Skills" value={stats.totalSkills} color="stat-card-indigo" />
                        <StatCard title="Total Tracks" value={stats.totalTracks} color="stat-card-pink" />
                        <StatCard title="Total Notes" value={stats.totalNotes} color="stat-card-orange" />
                    </div>

                    <h3 className="admin-section-title admin-section-spacing"><Code size={20} /> Data Visualizations</h3>
                    <div className="chart-grid-container">
                        <ChartCard title="Courses by Type">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stats.courseTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#0088FE" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Contests by Status">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={stats.contestStatusData} dataKey="value" cx="50%" cy="50%" outerRadius={100} label>
                                        {stats.contestStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Forum Posts by Category">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stats.forumCategoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#FF8042" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Monthly User Activity">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stats.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#00C49F" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    {/* Subscription/pricing UI removed from admin dashboard - moved to HomePage (user-facing) */}
                </>
            )}
        </div>
    );
};

export default DashboardOverview;
