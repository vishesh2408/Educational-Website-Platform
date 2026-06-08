

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Play,
    Check,
    Shield,
    Sparkles,
    MessageCircle,
    Clock,
    BookOpen,
    Award,
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
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />
        </div>
    );
}

const HomePage = () => {
    const [skills, setSkills] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [courses, setCourses] = useState([]);
    const [pricingPlans, setPricingPlans] = useState([]);
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

    const fetchPricingPlans = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/public/pricing-plans`);
            const data = await res.json();
            if (res.ok) {
                setPricingPlans(data);
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
        setForumSubLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/user/subscription/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ planType: 'professional', billingPeriod: forumBillingPeriod }),
            });
            const data = await res.json();
            if (res.ok) {
                // Update forum subscription status and show inline success
                await fetchForumSubscriptionStatus();
                setForumSuccessMessage(data.msg || `Subscribed to Forum Premium`);
                // clear success after a while
                setTimeout(() => setForumSuccessMessage(null), 3000);
            } else {
                showToast(data.msg || 'Subscription failed', 'error');
            }
        } catch (err) {
            console.error('Forum subscription error:', err);
            showToast('Network error', 'error');
        } finally {
            setForumSubLoading(false);
        }
    }, [currentUser, forumBillingPeriod, openModal, fetchForumSubscriptionStatus, showToast]);

    const handleSubscribe = useCallback(async (plan) => {
        if (!currentUser) {
            showToast('Please log in to subscribe.', 'info');
            return { ok: false, msg: 'login required' };
        }
        try {
            const res = await fetch(`${API_BASE_URL}/user/subscription/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ planType: plan.planType, billingPeriod }),
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.msg || `Subscribed to ${plan.name}`, 'success');
                await fetchSubscriptionStatus();
            } else {
                showToast(data.msg || 'Subscription failed', 'error');
            }
            return { ok: res.ok, data };
        } catch (err) {
            console.error('Subscription error:', err);
            showToast('Network error', 'error');
            return { ok: false, msg: 'network error' };
        }
    }, [currentUser, billingPeriod, openModal, showToast, fetchSubscriptionStatus]);

    useEffect(() => {
        const loadAllData = async () => {
            setIsLoading(true);
            setError(null);
            await Promise.all([
                fetchSkills(),
                fetchTracks(),
                fetchCourses(),
                fetchPricingPlans(),
            ]).catch(err => {
                console.error("Overall homepage data fetch error:", err);
            });
            setIsLoading(false);
        };

        loadAllData();
    }, [fetchSkills, fetchTracks, fetchCourses, fetchPricingPlans]);

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

    if (isLoading) {
        return (
            <main className="min-h-screen relative bg-slate-950">
                <AnimatedBackground />
                <div className="pt-24 flex items-center justify-center">
                    <div className="max-w-4xl w-full px-4">
                        <Skeleton variant="grid" count={3} />
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen relative bg-slate-950 text-white">
                <AnimatedBackground />
                <div className="pt-24 flex items-center justify-center">
                    <p className="text-xl text-red-300">Error: {error}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen relative bg-slate-950 text-white">
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
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                    Learn faster with real projects
                                </div>

                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                                    Master the Art of{' '}
                                    <span className="bg-gradient-to-r from-purple-400 to-[#167468] bg-clip-text text-transparent">
                                        Coding
                                    </span>
                                </h1>

                                <p className="text-lg sm:text-xl text-gray-300 max-w-2xl leading-relaxed">
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
                                        className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/10 transition-colors"
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
                                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                        <div className="text-2xl font-bold">15+</div>
                                        <div className="text-sm text-gray-300">Languages</div>
                                    </div>
                                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                        <div className="text-2xl font-bold">5K+</div>
                                        <div className="text-sm text-gray-300">Developers</div>
                                    </div>
                                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                        <div className="text-2xl font-bold">50+</div>
                                        <div className="text-sm text-gray-300">Projects</div>
                                    </div>
                                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                        <div className="text-2xl font-bold">24/7</div>
                                        <div className="text-sm text-gray-300">Community</div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <p className="text-gray-300 text-sm mb-3">In-demand tech</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['HTML/CSS', 'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript'].map((tech) => (
                                            <span
                                                key={tech}
                                                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm"
                                            >
                                                {tech}
                                            </span>
                                        ))}
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

                <SectionTitle className="text-white">Enhance Your Skills</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
                    {skills.length > 0 ? (
                        skills.map(skill => (
                            <SkillCard
                                key={skill._id}
                                icon={
                                    skill.icon.startsWith('http') ?
                                    <img src={skill.icon} alt={skill.title} className="w-10 h-10" onError={(e) => {e.target.onerror = null; e.target.src='https://placehold.co/40x40/ccc/000?text=Err'}}/> :
                                    <i className={`${skill.icon} text-3xl text-orange-500`}></i>
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

                <SectionTitle className="text-white">Web Development Tracks</SectionTitle>
                <div className="mb-16">
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {tracks.length > 0 ? (
                            tracks.map(track => (
                                <TrackCard
                                    key={track._id}
                                    icon={
                                        track.icon.startsWith('http') ?
                                        <img src={track.icon} alt={track.title} className="w-10 h-10" onError={(e) => {e.target.onerror = null; e.target.src='https://placehold.co/40x40/ccc/000?text=Err'}}/> :
                                        <i className={`${track.icon} text-3xl text-blue-500`}></i>
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

                <div id="courses" className="scroll-mt-28">
                    <SectionTitle className="text-white">Explore More Courses</SectionTitle>
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

                {/* Forum Premium - interactive card with detailed features */}
                <div id="forum-premium" className="mt-16 scroll-mt-20">
                    <SectionTitle className="text-white">Forum Premium</SectionTitle>
                    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-lg mb-6 transform transition-transform hover:scale-[1.01]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">💎 Forum Premium <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[#167468]/10 border border-[#167468]/20 text-[#167468]">Popular</span></h3>
                                <p className="text-sm text-gray-300 mt-2 max-w-xl">Post questions and replies without limits, enjoy priority visibility, access premium previews, and receive priority support from mentors.</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-200 text-xs">{forumBillingPeriod === 'monthly' ? 'Best for monthly users' : 'Best value yearly'}</span>
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-200 text-xs">Includes course previews</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-white">{forumBillingPeriod === 'monthly' ? '₹99' : '₹999'}</div>
                                <div className="text-xs text-gray-300">{forumBillingPeriod === 'monthly' ? '/ month' : '/ year'}</div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                            <button onClick={() => setForumBillingPeriod('monthly')} className={`px-3 py-2 rounded-md text-sm font-medium ${forumBillingPeriod === 'monthly' ? 'bg-teal-600 text-white' : 'bg-white/5 border border-white/10 text-gray-200'}`}>Monthly</button>
                            <button onClick={() => setForumBillingPeriod('yearly')} className={`px-3 py-2 rounded-md text-sm font-medium ${forumBillingPeriod === 'yearly' ? 'bg-teal-600 text-white' : 'bg-white/5 border border-white/10 text-gray-200'}`}>Yearly</button>
                            <button onClick={() => setForumDetailsOpen(v => !v)} className="ml-auto text-sm text-gray-200 underline">{forumDetailsOpen ? 'Hide details' : 'Show all features'}</button>
                        </div>

                        {/* compact preview of top features */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {forumFeaturesList.slice(0,3).map(f => (
                                <div key={f.key} className="flex items-start gap-3 p-3 bg-white/5 rounded-md border border-white/10">
                                    <div className="mt-1">{f.icon}</div>
                                    <div>
                                        <div className="text-sm font-medium text-white">{f.title}</div>
                                        <div className="text-xs text-gray-300">{f.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* expanded full features */}
                        {forumDetailsOpen && (
                            <div className="mt-4 border-t pt-4 space-y-3">
                                {forumFeaturesList.map(f => (
                                    <div key={f.key} className="flex items-start gap-3">
                                        <div className="mt-1">{f.icon}</div>
                                        <div>
                                            <div className="text-sm font-semibold text-white">{f.title}</div>
                                            <div className="text-xs text-gray-300">{f.desc}</div>
                                        </div>
                                    </div>
                                ))}

                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-3 rounded-md bg-white/5 border border-white/10">
                                        <div className="text-sm font-semibold text-white">What free users get</div>
                                        <ul className="text-xs mt-2 space-y-1 text-gray-300">
                                            <li>• Limited posts per day</li>
                                            <li>• Community visibility (no prioritization)</li>
                                            <li>• Access to free course content</li>
                                        </ul>
                                    </div>
                                    <div className="p-3 rounded-md bg-white/5 border border-white/10">
                                        <div className="text-sm font-semibold text-white">What Premium adds</div>
                                        <ul className="text-xs mt-2 space-y-1">
                                            {forumFeaturesList.map(f => (
                                                <li key={f.key} className="flex items-center gap-2 text-gray-200"><Check className="w-4 h-4 text-green-500" />{f.title}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-5 flex items-center gap-3">
                            {forumSubscriptionStatus && forumSubscriptionStatus.plan === 'professional' && forumSubscriptionStatus.status === 'active' ? (
                                <>
                                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-green-700 bg-green-50">✔ You have active premium access</div>
                                    <button onClick={() => navigate('/user/account/subscriptions')} className="px-4 py-2 rounded-md bg-white/5 text-white border border-white/10">Manage</button>
                                </>
                            ) : (
                                <button
                                    onClick={() => handleForumSubscribe('premium')}
                                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-[#167468] text-white font-semibold flex items-center gap-2 border border-white/10 hover:shadow-lg hover:shadow-[#167468]/30 transition-all"
                                    disabled={forumSubLoading}
                                >
                                    {forumSubLoading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                                            Processing...
                                        </>
                                    ) : (
                                        `Subscribe • ${forumBillingPeriod === 'monthly' ? '₹99 / month' : '₹999 / year'}`
                                    )}
                                </button>
                            )}
                        </div>

                        {forumSuccessMessage && (
                            <div className="mt-3 text-sm text-green-200 bg-white/5 border border-white/10 p-2 rounded-md">{forumSuccessMessage}</div>
                        )}
                    </div>
                </div>

                {/* Subscription Plans moved below courses */}
                <div className="mt-12">
                    <SectionTitle className="text-white">Subscription Plans</SectionTitle>

                    {pricingError ? (
                        <div className="bg-white/5 border border-white/10 backdrop-blur p-6 rounded-2xl text-center">
                            <p className="mb-4 text-gray-300">Subscription plans are currently unavailable.</p>
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
                                <div className="inline-flex items-center bg-white/5 border border-white/10 backdrop-blur rounded-lg p-1 shadow-sm">
                                    <button onClick={() => setBillingPeriod('monthly')} className={`px-4 py-2 rounded-md ${billingPeriod === 'monthly' ? 'bg-teal-600 text-white' : 'text-gray-200'}`}>Monthly</button>
                                    <button onClick={() => setBillingPeriod('yearly')} className={`px-4 py-2 rounded-md ${billingPeriod === 'yearly' ? 'bg-teal-600 text-white' : 'text-gray-200'}`}>Yearly</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pricingPlans.map((plan, idx) => (
                                    <div key={idx} className={`rounded-2xl p-6 shadow-sm border bg-white/5 backdrop-blur ${plan.isPopular ? 'ring-2 ring-[#167468]/30 border-white/10' : 'border-white/10'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-semibold text-white">{plan.name}</h4>
                                            {plan.isPopular && <span className="text-sm bg-teal-600 text-white px-2 py-1 rounded">Popular</span>}
                                        </div>
                                        <p className="text-sm text-gray-300 mb-4">{plan.description}</p>
                                        <div className="mb-4">
                                            <span className="text-3xl font-bold text-white">₹{billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}</span>
                                            <span className="text-sm text-gray-300 ml-2">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                                        </div>
                                        <ul className="mb-6 space-y-2">
                                            {plan.features.map((f, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-gray-200"><Check className="w-4 h-4 text-green-500" />{f}</li>
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