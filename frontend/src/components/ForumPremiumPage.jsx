import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Check,
    MessageCircle,
    Sparkles,
    BookOpen,
    Shield,
    Award,
    Clock,
    Lock,
    Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const getBaseUrl = () => {
    let url = process.env.REACT_APP_API_BASE_URL;
    if (!url) {
        url = import.meta.env?.VITE_API_BASE_URL || import.meta.env?.REACT_APP_API_BASE_URL;
    }
    if (!url || url === '/' || url.includes('localhost:5173')) {
        return 'http://localhost:3001';
    }
    return url;
};

const BASE_URL = getBaseUrl();
const API_BASE_URL = `${BASE_URL}/api`;

export default function ForumPremiumPage() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const showToast = useToast();

    const [billingPeriod, setBillingPeriod] = useState('monthly');
    const [forumPremiumPlan, setForumPremiumPlan] = useState(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const forumFeaturesList = [
        {
            key: 'posts',
            title: 'Unlimited posts & replies',
            desc: 'Create and reply without limits so you can iterate fast.',
            icon: <MessageCircle className="w-5 h-5 text-teal-400 animate-pulse" />,
        },
        {
            key: 'priority',
            title: 'Priority visibility',
            desc: 'Your posts are highlighted and more likely to get answers quickly.',
            icon: <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />,
        },
        {
            key: 'previews',
            title: 'Premium course previews',
            desc: 'Early access to selected lesson previews and sneak peeks.',
            icon: <BookOpen className="w-5 h-5 text-purple-400 animate-pulse" />,
        },
        {
            key: 'adfree',
            title: 'Ad-free browsing',
            desc: 'Cleaner forum experience without third-party distractions.',
            icon: <Shield className="w-5 h-5 text-blue-400" />,
        },
        {
            key: 'support',
            title: 'Badge & priority support',
            desc: 'A special badge and faster replies from mentors and staff.',
            icon: <Award className="w-5 h-5 text-yellow-400" />,
        },
        {
            key: 'analytics',
            title: 'Post analytics',
            desc: 'See engagement stats for your posts to improve clarity and answers.',
            icon: <Clock className="w-5 h-5 text-slate-400" />,
        },
    ];

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Fetch live pricing plans
            const res = await fetch(`${API_BASE_URL}/public/pricing-plans`);
            const data = await res.json();
            if (res.ok) {
                const forumPlan = data.find(p => p.isForumPremium);
                if (forumPlan) {
                    setForumPremiumPlan(forumPlan);
                }
            }

            // 2. Fetch current subscription status if user logged in
            if (currentUser) {
                const subRes = await fetch(`${API_BASE_URL}/user/subscription/status`, { credentials: 'include' });
                const subData = await subRes.json();
                if (subRes.ok) {
                    setSubscriptionStatus(subData.subscription);
                }
            }
        } catch (err) {
            console.error('Error loading forum premium data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSubscribe = () => {
        if (!currentUser) {
            showToast('Please log in to subscribe to Forum Premium.', 'info');
            navigate('/auth');
            return;
        }

        const amt = forumPremiumPlan
            ? (billingPeriod === 'monthly' ? forumPremiumPlan.monthlyPrice : forumPremiumPlan.yearlyPrice)
            : (billingPeriod === 'monthly' ? 99 : 999);

        navigate('/user/dashboard/payment', {
            state: {
                planName: forumPremiumPlan?.name || 'Forum Premium',
                planType: forumPremiumPlan?.planType || 'professional',
                billingPeriod: billingPeriod,
                amount: amt,
                isForumPremium: true
            }
        });
    };

    const monthlyPrice = forumPremiumPlan ? forumPremiumPlan.monthlyPrice : 99;
    const yearlyPrice = forumPremiumPlan ? forumPremiumPlan.yearlyPrice : 999;
    const currentPrice = billingPeriod === 'monthly' ? monthlyPrice : yearlyPrice;

    return (
        <div className="min-h-screen bg-transparent text-gray-900 dark:text-white py-12 px-4 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#167468]/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/user/dashboard')}
                    className="inline-flex items-center gap-2 text-sm text-gray-550 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-8 focus:outline-none"
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </button>

                {/* Page Title */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight relative inline-block">
                        Forum Premium
                        <span className="block h-1 w-20 bg-teal-500 mx-auto mt-3 rounded-full" />
                    </h1>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-2xl space-y-8 shadow-sm dark:shadow-none"
                    >
                        {/* Plan Header Info */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-gray-200 dark:border-white/10 pb-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">💎</span>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forum Premium</h2>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400">
                                        Popular
                                    </span>
                                </div>
                                <p className="text-gray-655 dark:text-gray-300 text-sm md:text-base max-w-2xl leading-relaxed">
                                    Post questions and replies without limits, enjoy priority visibility, access premium previews, and receive priority support from mentors.
                                </p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <span className="px-3 py-1 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-605 dark:text-gray-300 text-xs font-medium">
                                        {billingPeriod === 'monthly' ? 'Best for monthly users' : 'Best value yearly'}
                                    </span>
                                    <span className="px-3 py-1 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-605 dark:text-gray-300 text-xs font-medium">
                                        Includes course previews
                                    </span>
                                </div>
                            </div>

                            <div className="text-left md:text-right shrink-0 bg-gray-50 dark:bg-white/5 md:bg-transparent p-4 md:p-0 rounded-xl border border-gray-200 dark:border-white/10 md:border-none">
                                <div className="text-4xl font-extrabold text-teal-600 dark:text-teal-400">₹{currentPrice}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">/ {billingPeriod === 'monthly' ? 'month' : 'year'}</div>
                                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Incl. all taxes</div>
                            </div>
                        </div>

                        {/* Billing Toggle */}
                        <div className="flex items-center gap-3 bg-gray-105 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1.5 w-fit">
                            <button
                                onClick={() => setBillingPeriod('monthly')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                    billingPeriod === 'monthly'
                                        ? 'bg-gradient-to-r from-purple-500 to-[#167468] text-white shadow-sm'
                                        : 'text-gray-655 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingPeriod('yearly')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                    billingPeriod === 'yearly'
                                        ? 'bg-gradient-to-r from-purple-500 to-[#167468] text-white shadow-sm'
                                        : 'text-gray-655 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                                }`}
                            >
                                Yearly
                            </button>
                        </div>

                        {/* Features Grid */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span>🚀</span> Premium Features Included
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {forumFeaturesList.map((feature, idx) => (
                                    <motion.div
                                        key={feature.key}
                                        whileHover={{ y: -4, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                                        className="p-5 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 flex gap-4 transition-all duration-200 shadow-sm dark:shadow-none"
                                    >
                                        <div className="shrink-0 p-2.5 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 h-fit">
                                            {feature.icon}
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{feature.title}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Compare Tier Box */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div className="p-5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3 shadow-sm dark:shadow-none">
                                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">What free users get</h4>
                                <ul className="space-y-2 text-xs text-gray-550 dark:text-gray-400">
                                    <li className="flex items-center gap-2">❌ Limited posts & replies per day</li>
                                    <li className="flex items-center gap-2">❌ Standard visibility (no highlights)</li>
                                    <li className="flex items-center gap-2">❌ Ad-supported experience</li>
                                    <li className="flex items-center gap-2">❌ Free course content access only</li>
                                </ul>
                            </div>
                            <div className="p-5 rounded-xl bg-teal-50/50 dark:bg-[#121c30] border border-teal-250 dark:border-teal-500/20 space-y-3">
                                <h4 className="font-bold text-sm text-teal-900 dark:text-teal-400 uppercase tracking-wider">What Forum Premium adds</h4>
                                <ul className="space-y-2 text-xs text-gray-750 dark:text-gray-200">
                                    {forumFeaturesList.map((f, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                                            <span>{f.title}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Payment Security Alert */}
                        <div className="bg-teal-50/50 dark:bg-[#121c30] rounded-xl p-4 border border-teal-250 dark:border-teal-500/20 text-xs text-gray-750 dark:text-gray-300 flex gap-3">
                            <Info size={18} className="text-teal-650 dark:text-teal-400 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold text-teal-900 dark:text-white block mb-0.5">Secure Razorpay Integration</span>
                                Payments are securely processed via standard 256-bit encryption. The subscription activates instantly upon successful verification.
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/10">
                            {subscriptionStatus && subscriptionStatus.plan === 'professional' && subscriptionStatus.status === 'active' ? (
                                <div className="flex flex-col sm:flex-row gap-4 items-center w-full justify-between">
                                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-700 dark:text-green-400 bg-emerald-50 dark:bg-green-950/30 border border-emerald-200 dark:border-green-500/35">
                                        <Check size={18} />
                                        <span>You have active premium access</span>
                                    </div>
                                    <button
                                        onClick={() => navigate('/user/account/subscriptions')}
                                        className="px-6 py-3 rounded-xl bg-gray-55 hover:bg-gray-105 dark:bg-white/5 border border-gray-200 dark:border-white/10 dark:hover:bg-white/10 text-gray-750 dark:text-white font-semibold text-sm transition-all focus:outline-none"
                                    >
                                        Manage Subscription
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleSubscribe}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-[#167468] hover:shadow-lg hover:shadow-[#167468]/30 border border-white/10 text-white font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2"
                                >
                                    <Lock size={16} />
                                    <span>Subscribe • ₹{currentPrice} / {billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
