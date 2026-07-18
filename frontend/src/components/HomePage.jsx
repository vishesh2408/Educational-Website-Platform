

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    ArrowLeft,
    Play,
    Check,
    Shield,
    Sparkles,
    MessageCircle,
    Clock,
    BookOpen,
    Award,
    ChevronRight,
    ChevronLeft,
    Terminal,
    Briefcase,
    Cpu,
    Layers,
    Compass,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import SectionTitle from './SectionTitle';
import SkillCard from './SkillCard';
import TrackCard from './TrackCard';
import CourseCard from './CourseCard';
import Features from './Features';
import Skeleton from './Skeleton';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

function AnimatedBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            <motion.div
                className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
                animate={{ x: [0, 100, 0], y: [0, -100, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                style={{ top: '10%', left: '10%' }}
            />
            <motion.div
                className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
                animate={{ x: [0, -100, 0], y: [0, 100, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
                style={{ top: '50%', right: '10%' }}
            />
            <motion.div
                className="absolute w-96 h-96 bg-[#167468]/20 rounded-full blur-3xl"
                animate={{ x: [0, 50, 0], y: [0, -50, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                style={{ bottom: '10%', left: '30%' }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />
        </div>
    );
}

const HomePage = () => {
    const [skills, setSkills] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [courses, setCourses] = useState([]);
    const [resourceSections, setResourceSections] = useState([]);
    const [miscellaneousNotes, setMiscellaneousNotes] = useState([]);
    const [pricingPlans, setPricingPlans] = useState([]);
    
    // Pagination States for Resource categories (4 cards at a time)
    const [roadmapPage, setRoadmapPage] = useState(0);
    const [interviewPage, setInterviewPage] = useState(0);
    const [placementPage, setPlacementPage] = useState(0);
    const [toolPage, setToolPage] = useState(0);
    const [miscPage, setMiscPage] = useState(0);
    const [billingPeriod, setBillingPeriod] = useState('monthly');
    const [pricingError, setPricingError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { currentUser } = useAuth();
    const { openModal } = useModal();
    const showToast = useToast();
    const navigate = useNavigate();
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const [subLoading, setSubLoading] = useState(false);
    const [forumBillingPeriod, setForumBillingPeriod] = useState('monthly');
    const [forumSubscriptionStatus, setForumSubscriptionStatus] = useState(null);
    const [forumSubLoading, setForumSubLoading] = useState(false);
    const [forumSuccessMessage, setForumSuccessMessage] = useState(null);
    const [forumDetailsOpen, setForumDetailsOpen] = useState(false);
    const [forumPremiumPlan, setForumPremiumPlan] = useState(null);
    const [showAllTech, setShowAllTech] = useState(false);

    const forumFeaturesList = [
        {
            key: 'posts',
            title: 'Unlimited posts & replies',
            desc: 'Create and reply without limits so you can iterate fast.',
            icon: <MessageCircle className="w-4 h-4 text-teal-500" />,
        },
        {
            key: 'priority',
            title: 'Priority visibility',
            desc: 'Your posts are highlighted and more likely to get answers quickly.',
            icon: <Sparkles className="w-4 h-4 text-amber-500" />,
        },
        {
            key: 'previews',
            title: 'Premium course previews',
            desc: 'Early access to selected lesson previews and sneak peeks.',
            icon: <BookOpen className="w-4 h-4 text-purple-500" />,
        },
        {
            key: 'adfree',
            title: 'Ad-free browsing',
            desc: 'Cleaner forum experience without third-party distractions.',
            icon: <Shield className="w-4 h-4 text-blue-500" />,
        },
        {
            key: 'support',
            title: 'Badge & priority support',
            desc: 'A special badge and faster replies from mentors and staff.',
            icon: <Award className="w-4 h-4 text-yellow-500" />,
        },
        {
            key: 'analytics',
            title: 'Post analytics',
            desc: 'See engagement stats for your posts to improve clarity and answers.',
            icon: <Clock className="w-4 h-4 text-slate-500" />,
        },
    ];

    const fetchSkills = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/public/skills`);
            const data = await response.json();
            if (response.ok) {
                setSkills(data);
            } else {
                throw new Error(data.msg || 'Failed to fetch skills.');
            }
        } catch (err) {
            console.error('Error fetching skills:', err);
            setError('Failed to load skills.');
        }
    }, []);

    const fetchTracks = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/public/tracks`);
            const data = await response.json();
            if (response.ok) {
                setTracks(data);
            } else {
                throw new Error(data.msg || 'Failed to fetch tracks.');
            }
        } catch (err) {
            console.error('Error fetching tracks:', err);
            setError('Failed to load tracks.');
        }
    }, []);

    const fetchCourses = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/public/courses`);
            const data = await response.json();
            if (response.ok) {
                setCourses(data.slice(0, 6));
            } else {
                throw new Error(data.msg || 'Failed to fetch courses for homepage.');
            }
        } catch (err) {
            console.error('Error fetching homepage courses:', err);
            setError('Failed to load courses for homepage.');
        }
    }, []);

    const fetchResourceSections = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/public/sections`);
            if (response.ok) {
                const data = await response.json();
                setResourceSections(data || []);
            }
        } catch (err) {
            console.error('Error fetching resource sections in home:', err);
        }
    }, []);

    const fetchMiscellaneousNotes = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/public/notes?type=miscellaneous`);
            const data = await response.json();
            if (response.ok) {
                setMiscellaneousNotes(data || []);
            }
        } catch (err) {
            console.error('Error fetching miscellaneous notes in home:', err);
        }
    }, []);

    const fetchPricingPlans = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/public/pricing-plans`);
            const data = await res.json();
            if (res.ok) {
                // Keep all plans, including Forum Premium, so they render in the grid
                setPricingPlans(data);
                
                const forumPlan = data.find(p => p.isForumPremium);
                if (forumPlan) {
                    setForumPremiumPlan(forumPlan);
                }
                setPricingError(false);
            } else {
                setPricingPlans([]);
                setPricingError(true);
            }
        } catch (err) {
            console.error('Error fetching pricing plans:', err);
            setPricingError(true);
        }
    }, []);

    const fetchForumSubscriptionStatus = useCallback(async () => {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_BASE_URL}/user/subscription/status`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok) setForumSubscriptionStatus(data.subscription);
        } catch (err) {
            console.error('Error fetching forum subscription status:', err);
        }
    }, [currentUser]);

    const fetchSubscriptionStatus = useCallback(async () => {
        if (!currentUser) return;
        try {
            const res = await fetch(`${API_BASE_URL}/user/subscription/status`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok) setSubscriptionStatus(data.subscription);
        } catch (err) {
            console.error('Error fetching subscription status:', err);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchForumSubscriptionStatus();
        fetchSubscriptionStatus();
    }, [fetchForumSubscriptionStatus, fetchSubscriptionStatus]);

    const handleForumSubscribe = useCallback(async (planType) => {
        if (!currentUser) {
            showToast('Please log in to subscribe to Forum Premium.', 'info');
            return;
        }
        const amt = forumPremiumPlan
            ? (forumBillingPeriod === 'monthly' ? forumPremiumPlan.monthlyPrice : forumPremiumPlan.yearlyPrice)
            : (forumBillingPeriod === 'monthly' ? 99 : 999);

        navigate('/user/dashboard/payment', {
            state: {
                planName: forumPremiumPlan?.name || 'Forum Premium',
                planType: forumPremiumPlan?.planType || 'professional',
                billingPeriod: forumBillingPeriod,
                amount: amt,
                isForumPremium: true
            }
        });
    }, [currentUser, forumBillingPeriod, forumPremiumPlan, navigate, showToast]);

    const handleSubscribe = useCallback(async (plan) => {
        if (plan.isForumPremium) {
            navigate('/user/dashboard/forum-premium');
            return { ok: true };
        }
        if (!currentUser) {
            showToast('Please log in to subscribe.', 'info');
            return { ok: false, msg: 'login required' };
        }
        navigate('/user/dashboard/payment', {
            state: {
                planName: plan.name,
                planType: plan.planType,
                billingPeriod: billingPeriod,
                amount: billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
                isForumPremium: false
            }
        });
        return { ok: true };
    }, [currentUser, billingPeriod, navigate, showToast]);

    useEffect(() => {
        const loadAllData = async () => {
            setIsLoading(true);
            setError(null);
            await Promise.all([
                fetchSkills(),
                fetchTracks(),
                fetchCourses(),
                fetchPricingPlans(),
                fetchResourceSections(),
                fetchMiscellaneousNotes(),
            ]).catch(err => {
                console.error("Overall homepage data fetch error:", err);
            });
            setIsLoading(false);
        };

        loadAllData();
    }, [fetchSkills, fetchTracks, fetchCourses, fetchPricingPlans, fetchResourceSections, fetchMiscellaneousNotes]);

    const handleAction = useCallback((itemTitle, itemPrice, isPaid, itemId) => {
        // Navigate to course detail page instead of opening modal
        if (itemId) {
            navigate(`/user/dashboard/courses/${itemId}`);
        } else {
            if (openModal) {
                openModal(
                    `Action for ${itemTitle}`,
                    `You clicked to ${itemPrice === 'Free' ? 'access' : 'enroll in'} "${itemTitle}".`
                );
            } else {
                console.log(`Action: ${itemTitle}`);
            }
        }
    }, [navigate, openModal]);


    const handleGetStarted = useCallback(() => {
        if (!currentUser) {
            navigate('/auth');
            return;
        }
        navigate('/user/dashboard/courses');
    }, [currentUser, navigate]);

    // Categories groupings
    const roadmaps = resourceSections.filter(s => s.type === 'roadmap');
    const interviews = resourceSections.filter(s => s.type === 'interview');
    const placements = resourceSections.filter(s => s.type === 'placement');
    const softwareTools = resourceSections.filter(s => s.type === 'software_tool');
    const miscellaneous = resourceSections.filter(s => s.type === 'miscellaneous');

    const renderDashboardSection = (title, items, page, setPage, linkPath, badgeColor, categoryName, IconComponent) => {
        if (!items || items.length === 0) return null;
        
        const totalPages = Math.ceil(items.length / 4);
        const visibleItems = items.slice(page * 4, (page + 1) * 4);
        
        return (
            <div className="mt-16">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 mb-6">
                    <div className="flex items-center gap-2">
                        <IconComponent size={20} className="text-teal-550 dark:text-teal-400" />
                        <h3 className="text-lg sm:text-xl font-extrabold text-gray-800 dark:text-white">{title}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-bold">
                            {items.length} total
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate(linkPath)}
                            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
                        >
                            View All <ChevronRight size={14} />
                        </button>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-lg">
                                <button
                                    onClick={() => setPage(Math.max(page - 1, 0))}
                                    disabled={page === 0}
                                    className="p-1 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="text-[9px] font-bold px-1 text-gray-500 dark:text-gray-400 min-w-[28px] text-center">
                                    {page + 1} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(Math.min(page + 1, totalPages - 1))}
                                    disabled={page === totalPages - 1}
                                    className="p-1 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                    aria-label="Next page"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {visibleItems.map(section => (
                        <div
                            key={section._id}
                            onClick={() => navigate(linkPath)}
                            className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="relative h-32 overflow-hidden bg-gray-100 dark:bg-white/10">
                                <img
                                    src={section.imageUrl || 'https://placehold.co/400x224/cccccc/000000?text=Resource'}
                                    alt={section.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-3 left-3 right-3">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${badgeColor} text-white backdrop-blur-sm mb-1`}>
                                        {categoryName}
                                    </span>
                                    <h4 className="text-sm font-bold text-white leading-tight line-clamp-2">{section.title}</h4>
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col justify-between">
                                <p className="text-gray-655 dark:text-gray-300 text-xs mb-3 line-clamp-2">
                                    {section.description || 'Access dynamic notes, guides, and learning documents.'}
                                </p>
                                <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 group-hover:underline flex items-center gap-1 mt-auto">
                                    Open Category <ArrowRight size={10} className="inline ml-1" />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderMiscNotesSection = (title, items, page, setPage, IconComponent) => {
        if (!items || items.length === 0) return null;
        
        const totalPages = Math.ceil(items.length / 4);
        const visibleItems = items.slice(page * 4, (page + 1) * 4);
        
        return (
            <div className="mt-16">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 mb-6">
                    <div className="flex items-center gap-2">
                        <IconComponent size={20} className="text-teal-550 dark:text-teal-400" />
                        <h3 className="text-lg sm:text-xl font-extrabold text-gray-800 dark:text-white">{title}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-bold">
                            {items.length} total
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate("/user/dashboard/miscellaneous")}
                            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
                        >
                            View All <ChevronRight size={14} />
                        </button>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-lg">
                                <button
                                    onClick={() => setPage(Math.max(page - 1, 0))}
                                    disabled={page === 0}
                                    className="p-1 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="text-[9px] font-bold px-1 text-gray-500 dark:text-gray-400 min-w-[28px] text-center">
                                    {page + 1} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(Math.min(page + 1, totalPages - 1))}
                                    disabled={page === totalPages - 1}
                                    className="p-1 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                    aria-label="Next page"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {visibleItems.map(note => {
                        // Strip HTML tags for clean description preview
                        const rawText = note.content ? note.content.replace(/<[^>]*>/g, '') : '';
                        const previewText = rawText.length > 80 ? rawText.substring(0, 80) + '...' : rawText;
                        
                        return (
                            <div
                                key={note._id}
                                onClick={() => navigate("/user/dashboard/miscellaneous", { state: { sectionId: note.sectionId, noteId: note._id } })}
                                className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <div className="relative h-32 overflow-hidden bg-gray-100 dark:bg-white/10">
                                    <img
                                        src={note.imageUrl || 'https://placehold.co/400x224/7c3aed/ffffff?text=Miscellaneous'}
                                        alt={note.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-pink-500/80 text-white backdrop-blur-sm mb-1">
                                            {note.subject || 'Miscellaneous'}
                                        </span>
                                        <h4 className="text-sm font-bold text-white leading-tight line-clamp-2">{note.title}</h4>
                                    </div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <p className="text-gray-655 dark:text-gray-300 text-xs mb-3 line-clamp-2">
                                        {previewText || 'Access general knowledge, coding tips, and CS topics.'}
                                    </p>
                                    <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 group-hover:underline flex items-center gap-1 mt-auto">
                                        Read Topic <ArrowRight size={10} className="inline ml-1" />
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <main className="min-h-screen relative bg-transparent">
                <AnimatedBackground />
                <div className="animate-pulse">
                    {/* Hero Skeleton */}
                    <section className="relative pt-10 md:pt-12 pb-16">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                                <div className="lg:col-span-7 space-y-6">
                                    {/* Badge */}
                                    <div className="h-9 w-56 rounded-full bg-gray-200 dark:bg-white/10"></div>
                                    {/* Title */}
                                    <div className="space-y-3">
                                        <div className="h-12 w-3/4 rounded-lg bg-gray-200 dark:bg-white/10"></div>
                                        <div className="h-12 w-1/2 rounded-lg bg-gradient-to-r from-gray-200 to-gray-100 dark:from-white/10 dark:to-white/5"></div>
                                    </div>
                                    {/* Description */}
                                    <div className="space-y-2">
                                        <div className="h-5 w-full rounded bg-gray-200 dark:bg-white/10"></div>
                                        <div className="h-5 w-5/6 rounded bg-gray-200 dark:bg-white/10"></div>
                                    </div>
                                    {/* Buttons */}
                                    <div className="flex gap-4">
                                        <div className="h-12 w-40 rounded-2xl bg-gradient-to-r from-purple-300/40 to-teal-300/40 dark:from-purple-500/20 dark:to-teal-500/20"></div>
                                        <div className="h-12 w-36 rounded-lg bg-gray-200 dark:bg-white/10 border border-gray-200 dark:border-white/10"></div>
                                    </div>
                                </div>
                                <div className="lg:col-span-5">
                                    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 backdrop-blur shadow-md dark:shadow-none">
                                        {/* Stats 2x2 */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 space-y-2">
                                                    <div className="h-7 w-12 rounded bg-gray-200 dark:bg-white/15"></div>
                                                    <div className="h-4 w-20 rounded bg-gray-200 dark:bg-white/10"></div>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Tech tags */}
                                        <div className="mt-6">
                                            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/10 mb-3"></div>
                                            <div className="flex flex-wrap gap-2">
                                                {[16, 20, 14, 12, 16, 22].map((w, i) => (
                                                    <div key={i} className="h-7 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10" style={{ width: `${w * 4}px` }}></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features Skeleton */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 space-y-3">
                                    <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-white/10"></div>
                                    <div className="h-5 w-28 rounded bg-gray-200 dark:bg-white/10"></div>
                                    <div className="h-4 w-full rounded bg-gray-100 dark:bg-white/10"></div>
                                    <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-white/5"></div>
                                </div>
                            ))}
                        </div>

                        {/* Skills Section Skeleton */}
                        <div className="mb-16">
                            <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-white/10 mx-auto mb-6"></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-200/50 to-orange-300/30 dark:from-orange-500/20 dark:to-orange-400/10"></div>
                                            <div className="h-5 w-24 rounded bg-gray-200 dark:bg-white/10"></div>
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            <div className="h-8 flex-1 rounded-lg bg-gray-200 dark:bg-white/10"></div>
                                            <div className="h-8 flex-1 rounded-lg bg-gray-200 dark:bg-white/10"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tracks Section Skeleton */}
                        <div className="mb-16">
                            <div className="h-8 w-56 rounded-lg bg-gray-200 dark:bg-white/10 mx-auto mb-6"></div>
                            <div className="flex gap-6 overflow-hidden">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex-shrink-0 w-72 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-200/50 to-blue-300/30 dark:from-blue-500/20 dark:to-blue-400/10"></div>
                                            <div className="h-5 w-32 rounded bg-gray-200 dark:bg-white/10"></div>
                                        </div>
                                        <div className="h-4 w-full rounded bg-gray-100 dark:bg-white/10"></div>
                                        <div className="h-9 w-24 rounded-lg bg-gray-200 dark:bg-white/10"></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Courses Section Skeleton */}
                        <div className="mb-12">
                            <div className="h-8 w-52 rounded-lg bg-gray-200 dark:bg-white/10 mx-auto mb-6"></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
                                        <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-100 dark:from-white/10 dark:to-white/5"></div>
                                        <div className="p-5 space-y-3">
                                            <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-white/10"></div>
                                            <div className="h-4 w-full rounded bg-gray-100 dark:bg-white/10"></div>
                                            <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-white/5"></div>
                                            <div className="flex justify-between items-center pt-2">
                                                <div className="h-6 w-16 rounded bg-gray-200 dark:bg-white/10"></div>
                                                <div className="h-9 w-24 rounded-lg bg-gray-200 dark:bg-white/10"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pricing Section Skeleton */}
                        <div className="mt-12">
                            <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-white/10 mx-auto mb-6"></div>
                            <div className="flex justify-center mb-6">
                                <div className="h-10 w-52 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10"></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="h-5 w-20 rounded bg-gray-200 dark:bg-white/10"></div>
                                            {i === 2 && <div className="h-5 w-14 rounded bg-teal-200/50 dark:bg-teal-500/20"></div>}
                                        </div>
                                        <div className="h-4 w-full rounded bg-gray-100 dark:bg-white/10"></div>
                                        <div className="h-8 w-24 rounded bg-gray-200 dark:bg-white/10"></div>
                                        <div className="space-y-2">
                                            {[1, 2, 3].map(j => (
                                                <div key={j} className="flex items-center gap-2">
                                                    <div className="h-4 w-4 rounded-full bg-green-200 dark:bg-green-500/20"></div>
                                                    <div className="h-4 flex-1 rounded bg-gray-100 dark:bg-white/10"></div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="h-10 w-full rounded-2xl bg-gradient-to-r from-purple-300/30 to-teal-300/30 dark:from-purple-500/15 dark:to-teal-500/15"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen relative bg-transparent text-gray-900 dark:text-white">
                <AnimatedBackground />
                <div className="pt-24 flex items-center justify-center">
                    <p className="text-xl text-red-300">Error: {error}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen relative bg-transparent text-gray-900 dark:text-white">
            <AnimatedBackground />

            {/* Hero (no image) */}
            <section className="relative pt-10 md:pt-12 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        <div className="lg:col-span-7">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="space-y-6"
                            >
                                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    Learn faster with real projects
                                </div>

                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                                    Master the Art of{' '}
                                    <span className="bg-gradient-to-r from-purple-400 to-[#167468] bg-clip-text text-transparent">
                                        Coding
                                    </span>
                                </h1>

                                <p className="text-lg sm:text-xl text-gray-650 dark:text-gray-300 max-w-2xl leading-relaxed">
                                    Transform your career with hands-on programming courses. Learn from industry experts,
                                    build real projects, and join a community of developers.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <motion.button
                                        type="button"
                                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-[#167468] text-white px-8 py-3.5 rounded-2xl font-semibold border border-white/10 hover:shadow-lg hover:shadow-[#167468]/40 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleGetStarted}
                                    >
                                        Start Learning
                                        <ArrowRight className="w-5 h-5" />
                                    </motion.button>

                                    <motion.button
                                        type="button"
                                        className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg border border-gray-200 dark:border-white/15 bg-white/40 dark:bg-white/5 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => document.querySelector('#courses')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        <Play className="w-5 h-5" />
                                        Browse Courses
                                    </motion.button>
                                </div>
                            </motion.div>
                        </div>

                        <div className="lg:col-span-5">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 backdrop-blur shadow-md dark:shadow-none"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
                                        <div className="text-2xl font-bold">15+</div>
                                        <div className="text-sm text-gray-550 dark:text-gray-300">Languages</div>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
                                        <div className="text-2xl font-bold">5K+</div>
                                        <div className="text-sm text-gray-550 dark:text-gray-300">Developers</div>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
                                        <div className="text-2xl font-bold">50+</div>
                                        <div className="text-sm text-gray-550 dark:text-gray-300">Projects</div>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4">
                                        <div className="text-2xl font-bold">24/7</div>
                                        <div className="text-sm text-gray-550 dark:text-gray-300">Community</div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <p className="text-gray-505 dark:text-gray-355 text-sm mb-3">In-demand tech</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['HTML/CSS', 'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'AI/ML', 'Gen AI', 'Deep Learning', 'Agentic AI', 'RAG', 'SQL', 'MongoDB', 'React Native', 'Flutter', 'CI/CD Pipelines', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Next.js', 'GraphQL', 'Redis', 'PostgreSQL', 'Go', 'Rust', 'Java', 'Spring Boot', 'Django', 'FastAPI', 'Terraform', 'Kafka', 'Blockchain', 'Cybersecurity', 'Data Science', 'LangChain', 'Computer Vision']
                                            .slice(0, showAllTech ? undefined : 8)
                                            .map((tech) => (
                                                <span
                                                    key={tech}
                                                    className="px-3 py-1 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm"
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                        <button
                                            onClick={() => setShowAllTech(!showAllTech)}
                                            className="px-3 py-1 rounded-full text-sm font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/25 hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors cursor-pointer"
                                        >
                                            {showAllTech ? 'Show less' : '+30 more'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <Features />

                {/* Skills Section */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 mb-6 mt-16">
                    <div className="flex items-center gap-2">
                        <Sparkles size={20} className="text-orange-550 dark:text-orange-400" />
                        <h3 className="text-lg sm:text-xl font-extrabold text-gray-800 dark:text-white">Enhance Your Skills</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-bold">
                            {skills.length} total
                        </span>
                    </div>
                    <button 
                        onClick={() => navigate("/user/dashboard/courses")}
                        className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
                    >
                        View All <ChevronRight size={14} />
                    </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
                    {skills.length > 0 ? (
                        skills.map(skill => (
                            <SkillCard
                                key={skill._id}
                                imageUrl={
                                    skill.icon && (skill.icon.startsWith('http') || skill.icon.startsWith('data:image/')) ? skill.icon : null
                                }
                                icon={
                                    skill.icon && !(skill.icon.startsWith('http') || skill.icon.startsWith('data:image/')) ?
                                    <i className={`${skill.icon} text-3xl text-orange-500`}></i> : null
                                }
                                title={skill.title}
                                onLearn={() => handleAction(`learning module for ${skill.title}`, 'Free', false, skill._id)}
                                onQuiz={() => handleAction(`quiz for ${skill.title}`, 'Free', false, skill._id)}
                            />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-muted-foreground">No skills available.</p>
                    )}
                </div>

                {/* Tracks Section */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 mb-6">
                    <div className="flex items-center gap-2">
                        <Compass size={20} className="text-teal-550 dark:text-teal-400" />
                        <h3 className="text-lg sm:text-xl font-extrabold text-gray-800 dark:text-white">Web Development Tracks</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-bold">
                            {tracks.length} total
                        </span>
                    </div>
                    <button 
                        onClick={() => navigate("/user/dashboard/courses")}
                        className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
                    >
                        View All <ChevronRight size={14} />
                    </button>
                </div>

                <div className="mb-16">
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {tracks.length > 0 ? (
                            tracks.map(track => (
                                <TrackCard
                                    key={track._id}
                                    imageUrl={
                                        track.icon && (track.icon.startsWith('http') || track.icon.startsWith('data:image/')) ? track.icon : null
                                    }
                                    icon={
                                        track.icon && !(track.icon.startsWith('http') || track.icon.startsWith('data:image/')) ?
                                        <i className={`${track.icon} text-3xl text-blue-500`}></i> : null
                                    }
                                    title={track.title}
                                    onExplore={() => handleAction(`exploring ${track.title} track`, 'Free', false, track._id)}
                                />
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground w-full">No tracks available.</p>
                        )}
                    </div>
                </div>

                {/* Courses Section */}
                <div id="courses" className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 mb-6 scroll-mt-28">
                    <div className="flex items-center gap-2">
                        <BookOpen size={20} className="text-purple-550 dark:text-purple-400" />
                        <h3 className="text-lg sm:text-xl font-extrabold text-gray-800 dark:text-white">Explore More Courses</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-bold">
                            {courses.length} total
                        </span>
                    </div>
                    <button 
                        onClick={() => navigate("/user/dashboard/courses")}
                        className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
                    >
                        View All <ChevronRight size={14} />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.length > 0 ? (
                        courses.map(course => (
                            <CourseCard
                                key={course._id}
                                course={course}
                                onClick={(selectedCourse) => handleAction(
                                    selectedCourse.title,
                                    selectedCourse.price,
                                    selectedCourse.type === 'paid',
                                    selectedCourse._id
                                )}
                            />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-muted-foreground">No courses available.</p>
                    )}
                </div>

                <div className="mt-24 scroll-mt-28 border-t border-gray-200 dark:border-white/10 pt-12">
                    <SectionTitle>Trending Learning Resources</SectionTitle>
                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm -mt-6 mb-4 max-w-lg mx-auto">
                        Quick access to our latest professional roadmaps, interview prep Q&As, placement blueprints, and utility software lists.
                    </p>
                </div>

                {renderDashboardSection("Developer Roadmaps", roadmaps, roadmapPage, setRoadmapPage, "/user/dashboard/roadmaps", "bg-sky-500/80", "Roadmap", Compass)}
                {renderDashboardSection("Interview Q&A Sets", interviews, interviewPage, setInterviewPage, "/user/dashboard/interviews", "bg-purple-500/80", "Interview Prep", Terminal)}
                {renderDashboardSection("Placement & Career Blueprints", placements, placementPage, setPlacementPage, "/user/dashboard/placement", "bg-emerald-500/80", "Placement", Briefcase)}
                {renderDashboardSection("Essential Software & Tools", softwareTools, toolPage, setToolPage, "/user/dashboard/software-tools", "bg-indigo-500/80", "Software & Tools", Cpu)}
                {renderMiscNotesSection("Miscellaneous Learning Topics", miscellaneousNotes, miscPage, setMiscPage, Layers)}

                <div className="mb-16"></div>

                {/* Subscription Plans moved below courses */}
                <div className="mt-12">
                    <SectionTitle>Subscription Plans</SectionTitle>

                    {pricingError ? (
                        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur p-6 rounded-2xl text-center shadow-md dark:shadow-none">
                            <p className="mb-4 text-gray-600 dark:text-gray-300">Subscription plans are currently unavailable.</p>
                            <button
                                onClick={() => fetchPricingPlans()}
                                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-[#167468] text-white font-semibold border border-white/10 hover:shadow-lg hover:shadow-[#167468]/30 transition-all"
                            >
                                Retry
                            </button>
                        </div>
                    ) : pricingPlans.length > 0 ? (
                        <>
                            <div className="flex justify-center mb-6">
                                <div className="inline-flex items-center bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur rounded-lg p-1 shadow-sm">
                                    <button 
                                        onClick={() => setBillingPeriod('monthly')} 
                                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
                                            billingPeriod === 'monthly' 
                                                ? 'bg-gradient-to-r from-purple-500 to-[#167468] text-white shadow-sm' 
                                                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Monthly
                                    </button>
                                    <button 
                                        onClick={() => setBillingPeriod('yearly')} 
                                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
                                            billingPeriod === 'yearly' 
                                                ? 'bg-gradient-to-r from-purple-500 to-[#167468] text-white shadow-sm' 
                                                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Yearly
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {pricingPlans.map((plan, idx) => (
                                    <div key={idx} className={`rounded-2xl p-6 shadow-sm border bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 backdrop-blur shadow-md dark:shadow-none ${plan.isPopular || plan.isForumPremium ? 'ring-2 ring-[#167468]/30' : ''}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                                                {plan.isForumPremium ? '💎 ' : ''}{plan.name}
                                            </h4>
                                            {(plan.isPopular || plan.isForumPremium) && (
                                                <span className="text-xs bg-teal-600/20 border border-teal-500/30 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded">
                                                    Popular
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-650 dark:text-gray-300 mb-4">{plan.description}</p>
                                        <div className="mb-4">
                                            <span className="text-3xl font-bold text-gray-900 dark:text-white">₹{billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-300 ml-2">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                                        </div>
                                        <ul className="mb-6 space-y-2">
                                            {plan.features.map((f, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-gray-750 dark:text-gray-200"><Check className="w-4 h-4 text-green-500" />{f}</li>
                                            ))}
                                        </ul>
                                        {subscriptionStatus && subscriptionStatus.plan === plan.planType && subscriptionStatus.status === 'active' ? (
                                            <div className="w-full py-2.5 rounded-2xl bg-green-600/20 border border-green-500/50 flex items-center justify-center gap-2 font-semibold text-green-400">
                                                <Check className="w-5 h-5" /> Subscribed
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleSubscribe(plan)}
                                                disabled={subLoading}
                                                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-[#167468] text-white font-semibold border border-white/10 hover:shadow-lg hover:shadow-[#167468]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {subLoading ? 'Processing...' : (plan.name === 'Enterprise' ? 'Contact Sales' : 'Subscribe')}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-center text-muted-foreground">No plans available.</p>
                    )}
                </div>
            </div>
        </main>
    );
};

export default HomePage;


// function App() {
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [modalTitle, setModalTitle] = useState('');
//     const [modalContent, setModalContent] = useState('');

//     const openModal = (title, content) => {
//         setModalTitle(title);
//         setModalContent(content);
//         setIsModalOpen(true);
//     };

//     const closeModal = () => {
//         setIsModalOpen(false);
//         setModalTitle('');
//         setModalContent('');
//     };

//     return (
//         <div className="min-h-screen bg-background">
//             <HomePage openModal={openModal} />
            
//             {/* Simple Modal */}
//             {isModalOpen && (
//                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//                     <div className="bg-card p-6 rounded-lg max-w-md w-full">
//                         <h3 className="text-xl font-semibold mb-4 text-foreground">{modalTitle}</h3>
//                         <p className="text-muted-foreground mb-4">{modalContent}</p>
//                         <button 
//                             onClick={closeModal}
//                             className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded transition-colors"
//                         >
//                             Close
//                         </button>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }