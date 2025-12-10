

import React, { useState, useEffect, useCallback } from 'react';
import SectionTitle from './SectionTitle';
import SkillCard from './SkillCard';
import TrackCard from './TrackCard';
import CourseCard from './CourseCard';
import Features from './Features';
import Statistics from './Statistics';
import { Home, User, BookOpen, Award, Code, Check, Shield, Sparkles, MessageCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import Skeleton from './Skeleton';

// const API_BASE_URL = 'http://localhost:3001/api';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

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
    const [forumBillingPeriod, setForumBillingPeriod] = useState('monthly');
    const [forumSubscriptionStatus, setForumSubscriptionStatus] = useState(null);
    const [forumSubLoading, setForumSubLoading] = useState(false);
    const [forumSuccessMessage, setForumSuccessMessage] = useState(null);
    const [forumDetailsOpen, setForumDetailsOpen] = useState(false);

    const forumFeaturesList = [
        { key: 'posts', title: 'Unlimited posts & replies', desc: 'Create and reply without limits so you can iterate fast.', icon: <MessageCircle className="w-4 h-4 text-teal-500" /> },
        { key: 'priority', title: 'Priority visibility', desc: 'Your posts are highlighted and more likely to get answers quickly.', icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
        { key: 'previews', title: 'Premium course previews', desc: 'Early access to selected lesson previews and sneak peeks.', icon: <BookOpen className="w-4 h-4 text-purple-500" /> },
        { key: 'adfree', title: 'Ad-free browsing', desc: 'Cleaner forum experience without third-party distractions.', icon: <Shield className="w-4 h-4 text-blue-500" /> },
        { key: 'support', title: 'Badge & priority support', desc: 'A special badge and faster replies from mentors and staff.', icon: <Award className="w-4 h-4 text-yellow-500" /> },
        { key: 'analytics', title: 'Post analytics', desc: 'See engagement stats for your posts to improve clarity and answers.', icon: <Clock className="w-4 h-4 text-slate-500" /> },
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

    useEffect(() => {
        fetchForumSubscriptionStatus();
    }, [fetchForumSubscriptionStatus]);

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
                body: JSON.stringify({ planType, billingPeriod: forumBillingPeriod }),
            });
            const data = await res.json();
            if (res.ok) {
                // Update forum subscription status and show inline success
                await fetchForumSubscriptionStatus();
                setForumSuccessMessage(data.msg || `Subscribed to ${planType}`);
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
            } else {
                showToast(data.msg || 'Subscription failed', 'error');
            }
            return { ok: res.ok, data };
        } catch (err) {
            console.error('Subscription error:', err);
            showToast('Network error', 'error');
            return { ok: false, msg: 'network error' };
        }
    }, [currentUser, billingPeriod, openModal, showToast]);

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


    if (isLoading) {
        return (
            <main className="flex items-center justify-center min-h-screen bg-transparent">
                <div className="max-w-4xl w-full px-4">
                    <Skeleton variant="grid" count={3} />
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex items-center justify-center min-h-screen bg-transparent">
                <p className="text-xl text-destructive">Error: {error}</p>
            </main>
        );
    }

    return (
        <main className="bg-transparent">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                        alt="Developers coding"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60"></div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-4 text-center ">
                    <div className="flex flex-col gap-8">
                        {/* Text Container */}
                        <div className="flex flex-col gap-4">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mt-16">
                                Master the Art of
                                <span className="block text-teal-400">Coding</span>
                            </h1>
                            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                                Transform your career with hands-on programming courses. Learn from industry experts,
                                build real projects, and join a community of developers ready to shape the future of technology.
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-24 items-center justify-center">
                            <button className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 text-lg min-w-[200px] rounded-full transition-colors">
                                Start Learning Now
                            </button>
                            <button className="border border-white text-white hover:bg-white/10 px-8 py-4 text-lg min-w-[200px] rounded-full transition-colors">
                                Browse Courses
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/20">
                            <div className="text-center">
                                <div className="text-2xl sm:text-3xl font-bold text-white mb-2">15+</div>
                                <div className="text-gray-300 text-sm sm:text-base">Programming Languages</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl sm:text-3xl font-bold text-white mb-2">5K+</div>
                                <div className="text-gray-300 text-sm sm:text-base">Developers Trained</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl sm:text-3xl font-bold text-white mb-2">50+</div>
                                <div className="text-gray-300 text-sm sm:text-base">Coding Projects</div>
                            </div>
                        </div>

                        {/* Tech Tags */}
                        <div className="mt-12 pt-8">
                            <p className="text-gray-300 mb-6">Master the most in-demand technologies</p>
                            <div className="flex flex-wrap justify-center gap-4">
                                {['HTML/CSS', 'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript'].map((tech) => (
                                    <span 
                                        key={tech}
                                        className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white border border-white/20 mb-12"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 ">
                <Features />
                <Statistics />

                <SectionTitle>Enhance Your Skills</SectionTitle>
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

                <SectionTitle>Web Development Tracks</SectionTitle>
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

                <SectionTitle>Explore More Courses</SectionTitle>
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
                <div className="mt-16">
                    <SectionTitle>Forum Premium</SectionTitle>
                    <div className="bg-card p-6 rounded-2xl shadow-lg mb-6 border border-border transform transition-transform hover:scale-[1.01]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2">💎 Forum Premium <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Popular</span></h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-xl">Post questions and replies without limits, enjoy priority visibility, access premium previews, and receive priority support from mentors.</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-teal-700 text-xs">{forumBillingPeriod === 'monthly' ? 'Best for monthly users' : 'Best value yearly'}</span>
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">Includes course previews</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold">{forumBillingPeriod === 'monthly' ? '₹99' : '₹999'}</div>
                                <div className="text-xs text-muted-foreground">{forumBillingPeriod === 'monthly' ? '/ month' : '/ year'}</div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                            <button onClick={() => setForumBillingPeriod('monthly')} className={`px-3 py-2 rounded-md text-sm font-medium ${forumBillingPeriod === 'monthly' ? 'bg-teal-600 text-white' : 'bg-transparent border border-border'}`}>Monthly</button>
                            <button onClick={() => setForumBillingPeriod('yearly')} className={`px-3 py-2 rounded-md text-sm font-medium ${forumBillingPeriod === 'yearly' ? 'bg-teal-600 text-white' : 'bg-transparent border border-border'}`}>Yearly</button>
                            <button onClick={() => setForumDetailsOpen(v => !v)} className="ml-auto text-sm text-foreground/80 underline">{forumDetailsOpen ? 'Hide details' : 'Show all features'}</button>
                        </div>

                        {/* compact preview of top features */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {forumFeaturesList.slice(0,3).map(f => (
                                <div key={f.key} className="flex items-start gap-3 p-3 bg-background/50 rounded-md border border-border">
                                    <div className="mt-1">{f.icon}</div>
                                    <div>
                                        <div className="text-sm font-medium">{f.title}</div>
                                        <div className="text-xs text-muted-foreground">{f.desc}</div>
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
                                            <div className="text-sm font-semibold">{f.title}</div>
                                            <div className="text-xs text-muted-foreground">{f.desc}</div>
                                        </div>
                                    </div>
                                ))}

                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-3 rounded-md bg-background/40 border border-border">
                                        <div className="text-sm font-semibold">What free users get</div>
                                        <ul className="text-xs mt-2 space-y-1 text-muted-foreground">
                                            <li>• Limited posts per day</li>
                                            <li>• Community visibility (no prioritization)</li>
                                            <li>• Access to free course content</li>
                                        </ul>
                                    </div>
                                    <div className="p-3 rounded-md bg-background/40 border border-border">
                                        <div className="text-sm font-semibold">What Premium adds</div>
                                        <ul className="text-xs mt-2 space-y-1">
                                            {forumFeaturesList.map(f => (
                                                <li key={f.key} className="flex items-center gap-2 text-foreground/90"><Check className="w-4 h-4 text-green-500" />{f.title}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-5 flex items-center gap-3">
                            {forumSubscriptionStatus && forumSubscriptionStatus.plan === 'premium' && forumSubscriptionStatus.status === 'active' ? (
                                <>
                                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-green-700 bg-green-50">✔ You have active premium access</div>
                                    <button onClick={() => navigate('/user/account/subscriptions')} className="px-4 py-2 rounded-md bg-white/5 text-white border border-white/10">Manage</button>
                                </>
                            ) : (
                                <button
                                    onClick={() => handleForumSubscribe('premium')}
                                    className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-2"
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
                            <div className="mt-3 text-sm text-green-700 bg-green-50 p-2 rounded-md">{forumSuccessMessage}</div>
                        )}
                    </div>
                </div>

                {/* Subscription Plans moved below courses */}
                <div className="mt-12">
                    <SectionTitle>Subscription Plans</SectionTitle>

                    {pricingError ? (
                        <div className="bg-card p-6 rounded-md text-center">
                            <p className="mb-4 text-muted-foreground">Subscription plans are currently unavailable.</p>
                            <button
                                onClick={() => fetchPricingPlans()}
                                className="px-4 py-2 bg-teal-600 text-white rounded-md"
                            >
                                Retry
                            </button>
                        </div>
                    ) : pricingPlans.length > 0 ? (
                        <>
                            <div className="flex justify-center mb-6">
                                <div className="inline-flex items-center bg-card rounded-lg p-1 shadow-sm border border-border">
                                    <button onClick={() => setBillingPeriod('monthly')} className={`px-4 py-2 rounded-md ${billingPeriod === 'monthly' ? 'bg-teal-600 text-white' : 'text-foreground/80'}`}>Monthly</button>
                                    <button onClick={() => setBillingPeriod('yearly')} className={`px-4 py-2 rounded-md ${billingPeriod === 'yearly' ? 'bg-teal-600 text-white' : 'text-foreground/80'}`}>Yearly</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pricingPlans.map((plan, idx) => (
                                    <div key={idx} className={`bg-card rounded-xl p-6 shadow-sm border ${plan.isPopular ? 'ring-2 ring-teal-200' : 'border-border'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-semibold">{plan.name}</h4>
                                            {plan.isPopular && <span className="text-sm bg-teal-600 text-white px-2 py-1 rounded">Popular</span>}
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                                        <div className="mb-4">
                                            <span className="text-3xl font-bold">${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}</span>
                                            <span className="text-sm text-muted-foreground ml-2">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                                        </div>
                                        <ul className="mb-6 space-y-2">
                                            {plan.features.map((f, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-foreground/90"><Check className="w-4 h-4 text-green-500" />{f}</li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => handleSubscribe(plan)}
                                            className="w-full py-2 rounded-md bg-teal-600 text-white font-semibold"
                                        >
                                            {plan.name === 'Enterprise' ? 'Contact Sales' : 'Subscribe'}
                                        </button>
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