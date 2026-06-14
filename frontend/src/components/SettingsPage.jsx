import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  Sun, Moon, Lock, Bell, Globe, MapPin, HelpCircle,
  Shield, KeyRound, CheckCircle2, AlertTriangle, ChevronDown, Loader2,
  Mail, Send, Sparkles
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const showToast = useToast();
  const { currentUser } = useAuth();

  // Settings states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [language, setLanguage] = useState('English');
  const [location, setLocation] = useState('');
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  // Password reset states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPasswordCollapsed, setIsPasswordCollapsed] = useState(true);

  // Support/Help states
  const [supportMessage, setSupportMessage] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  // Active Tab: 'security', 'preferences', 'help', 'blog'
  const [activeTab, setActiveTab] = useState('preferences');

  // FAQ Accordion state
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Search parameters and Refs
  const [searchParams] = useSearchParams();
  const faqRef = useRef(null);
  const supportRef = useRef(null);

  // Blog Posts list
  const blogPosts = [
    {
      id: 1,
      title: "Mastering React 19: The New Compiler and Server Actions",
      excerpt: "Explore the major shifts in React 19, including automatic memoization with React Compiler and simplified backend operations.",
      date: "June 10, 2026",
      readTime: "5 min read",
      author: "Alex Rivers",
      tags: ["React", "JavaScript", "Web Dev"]
    },
    {
      id: 2,
      title: "Building Secure Payments with Razorpay API",
      excerpt: "A complete developer's guide to verifying transaction signatures and validating order prices on the backend safely.",
      date: "June 05, 2026",
      readTime: "8 min read",
      author: "Sarah Connor",
      tags: ["Payments", "Security", "Node.js"]
    },
    {
      id: 3,
      title: "Modern Styling: Tailwind CSS vs Vanilla CSS Custom Properties",
      excerpt: "Which styling approach is best for scalable, premium SaaS applications? We compare developer velocity with ultimate control.",
      date: "May 28, 2026",
      readTime: "6 min read",
      author: "Vishesh Yadav",
      tags: ["CSS", "Tailwind", "Aesthetics"]
    }
  ];

  // Sync active tab and scroll targets from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['preferences', 'security', 'help', 'blog'].includes(tab)) {
      setActiveTab(tab);
      
      const scrollTarget = searchParams.get('scroll');
      if (tab === 'help' && scrollTarget) {
        setTimeout(() => {
          const el = scrollTarget === 'faqs' ? faqRef.current : supportRef.current;
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    }
  }, [searchParams]);

  // Fetch Settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        setIsLoadingSettings(true);
        const res = await fetch(`${API_BASE_URL}/profile/settings`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setEmailNotifications(data.emailNotifications ?? true);
          setPushNotifications(data.pushNotifications ?? true);
          setLanguage(data.language ?? 'English');
          setLocation(data.location ?? '');
        }
      } catch (err) {
        console.error('Failed to load user settings', err);
      } finally {
        setIsLoadingSettings(false);
      }
    }
    if (currentUser) {
      fetchSettings();
    }
  }, [currentUser]);

  // Handle Preferences Save
  const handleSavePreferences = async (updatedFields = {}) => {
    try {
      setIsLoadingSettings(true);
      const payload = {
        emailNotifications: updatedFields.emailNotifications ?? emailNotifications,
        pushNotifications: updatedFields.pushNotifications ?? pushNotifications,
        language: updatedFields.language ?? language,
        location: updatedFields.location ?? location,
        theme
      };

      const res = await fetch(`${API_BASE_URL}/profile/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Preferences updated successfully!', 'success');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.msg || 'Failed to save preferences.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error. Please try again.', 'error');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('All password fields are required.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'error');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await fetch(`${API_BASE_URL}/profile/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast('Password changed successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(data.msg || 'Failed to update password.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error changing password. Try again.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Support Ticket Submit
  const handleSendSupport = async (e) => {
    e.preventDefault();
    if (!supportMessage.trim()) {
      showToast('Please enter a message.', 'error');
      return;
    }

    try {
      setIsSendingSupport(true);
      const res = await fetch(`${API_BASE_URL}/profile/support-tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: supportMessage.trim() })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSupportSubmitted(true);
        setSupportMessage('');
        showToast('Support request sent! We will reach out shortly.', 'success');
      } else {
        showToast(data.msg || 'Failed to submit support request.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error. Please try again.', 'error');
    } finally {
      setIsSendingSupport(false);
    }
  };

  const faqs = [
    {
      q: 'How do I upgrade to Forum Premium?',
      a: 'Navigate to the dashboard or homepage, click on the Forum Premium tier card in the subscription plans list, view the detailed features and pricing, and proceed to checkout securely.'
    },
    {
      q: 'Can I change my registered email address?',
      a: 'For security reasons, changing your email requires reaching out directly to our admin team with verification. Submit a support ticket under the Help tab to request an email update.'
    },
    {
      q: 'Why did my account get locked?',
      a: 'We automatically lock accounts temporarily for 4 minutes after 5 consecutive failed login attempts to safeguard your profile against brute-force attacks.'
    }
  ];

  return (
    <div className="min-h-screen bg-transparent text-gray-900 dark:text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-2">
            <Shield className="w-8 h-8 text-[#167468]" />
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
              Account Settings
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            Manage your credentials, theme options, language, notifications, and support tickets.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="md:col-span-1 flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none border-b md:border-b-0 border-gray-200 dark:border-white/10">
            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === 'preferences'
                  ? 'bg-gradient-to-r from-[#167468]/15 to-purple-500/10 dark:from-[#167468]/30 dark:to-purple-500/20 text-gray-900 dark:text-white border border-[#167468]/30 dark:border-[#167468]/40 shadow-inner shadow-[#167468]/10 dark:shadow-[#167468]/20'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'
              }`}
            >
              <Globe size={18} />
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === 'security'
                  ? 'bg-gradient-to-r from-[#167468]/15 to-purple-500/10 dark:from-[#167468]/30 dark:to-purple-500/20 text-gray-900 dark:text-white border border-[#167468]/30 dark:border-[#167468]/40 shadow-inner shadow-[#167468]/10 dark:shadow-[#167468]/20'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'
              }`}
            >
              <KeyRound size={18} />
              Security
            </button>
            <button
              onClick={() => setActiveTab('help')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === 'help'
                  ? 'bg-gradient-to-r from-[#167468]/15 to-purple-500/10 dark:from-[#167468]/30 dark:to-purple-500/20 text-gray-900 dark:text-white border border-[#167468]/30 dark:border-[#167468]/40 shadow-inner shadow-[#167468]/10 dark:shadow-[#167468]/20'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'
              }`}
            >
              <HelpCircle size={18} />
              Help & FAQs
            </button>
            <button
              onClick={() => setActiveTab('blog')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === 'blog'
                  ? 'bg-gradient-to-r from-[#167468]/15 to-purple-500/10 dark:from-[#167468]/30 dark:to-purple-500/20 text-gray-900 dark:text-white border border-[#167468]/30 dark:border-[#167468]/40 shadow-inner shadow-[#167468]/10 dark:shadow-[#167468]/20'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'
              }`}
            >
              <Sparkles size={18} />
              Blog
            </button>
          </div>

          {/* Settings Panels */}
          <div className="md:col-span-3">
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#167468]/10 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />

              {isLoadingSettings && (
                <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Syncing...</span>
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* 1. Preferences Tab */}
                {activeTab === 'preferences' && (
                  <motion.div
                    key="preferences"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">General Preferences</h2>
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Configure theme, language, location and notification systems.</p>
                    </div>

                    <div className="space-y-6">
                      {/* Day/Night Theme Toggle */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl">
                        <div className="flex items-center gap-3.5">
                          <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-650 dark:text-teal-400 border border-teal-500/20 dark:border-teal-500/20">
                            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">App Interface Theme</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">Switch between dark mode and light mode instantly.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            toggleTheme();
                            showToast(`Switched to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, 'info');
                          }}
                          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-white border border-gray-200 dark:border-white/10 transition-all"
                        >
                          {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                        </button>
                      </div>

                      {/* Language Selection */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 dark:border-indigo-500/20">
                            <Globe size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Interface Language</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">Choose the primary language for dashboard options.</p>
                          </div>
                        </div>
                        <select
                          value={language}
                          onChange={(e) => {
                            setLanguage(e.target.value);
                            handleSavePreferences({ language: e.target.value });
                          }}
                          className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/15 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#167468]/50"
                        >
                          <option value="English">English</option>
                          <option value="Hindi">Hindi (हिंदी)</option>
                          <option value="Spanish">Spanish (Español)</option>
                          <option value="French">French (Français)</option>
                          <option value="Chinese">Chinese (中文)</option>
                        </select>
                      </div>

                      {/* Location Input */}
                      <div className="flex flex-col p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl gap-3">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3.5">
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/20">
                              <MapPin size={20} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Your Location</h3>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">Display location metrics on community pages.</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Noida, UP, India"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="flex-1 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/15 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#167468]/50 transition-all"
                          />
                          <button
                            onClick={() => handleSavePreferences({ location })}
                            className="bg-gradient-to-r from-purple-500 to-[#167468] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:opacity-90 transition-all"
                          >
                            Save
                          </button>
                        </div>
                      </div>

                      {/* Notifications Toggles */}
                      <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl space-y-4">
                        <div className="flex items-center gap-3.5 mb-2">
                          <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-650 dark:text-pink-400 border border-pink-500/20 dark:border-pink-500/20">
                            <Bell size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Notification Feeds</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">Select how you want to receive alerts and notifications.</p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-white/5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Email Notifications</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={emailNotifications}
                                onChange={(e) => {
                                  setEmailNotifications(e.target.checked);
                                  handleSavePreferences({ emailNotifications: e.target.checked });
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#167468]/40 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                            </label>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Push Notifications</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={pushNotifications}
                                onChange={(e) => {
                                  setPushNotifications(e.target.checked);
                                  handleSavePreferences({ pushNotifications: e.target.checked });
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#167468]/40 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. Security Tab */}
                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Security & Authentication</h2>
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Manage password updates and track login sessions.</p>
                    </div>

                    {/* Change Password Form */}
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl space-y-4">
                        <div
                          className="flex items-center justify-between cursor-pointer select-none"
                          onClick={() => setIsPasswordCollapsed(!isPasswordCollapsed)}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 dark:border-orange-500/20">
                              <KeyRound size={20} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Reset Account Password</h3>
                              <p className="text-gray-500 dark:text-gray-400 text-xs font-normal">Choose a secure, strong password to protect your account.</p>
                            </div>
                          </div>
                          <ChevronDown
                            size={20}
                            className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                              !isPasswordCollapsed ? 'rotate-180 text-gray-800 dark:text-white' : ''
                            }`}
                          />
                        </div>

                        <AnimatePresence>
                          {!isPasswordCollapsed && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-white/5 mt-4">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Current Password</label>
                                  <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/15 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#167468]/50"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">New Password</label>
                                    <input
                                      type="password"
                                      value={newPassword}
                                      onChange={(e) => setNewPassword(e.target.value)}
                                      placeholder="••••••••"
                                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/15 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#167468]/50"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Confirm New Password</label>
                                    <input
                                      type="password"
                                      value={confirmPassword}
                                      onChange={(e) => setConfirmPassword(e.target.value)}
                                      placeholder="••••••••"
                                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/15 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#167468]/50"
                                    />
                                  </div>
                                </div>

                                <button
                                  type="submit"
                                  disabled={isChangingPassword}
                                  className="mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-[#167468] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                                >
                                  {isChangingPassword ? (
                                    <>
                                      <Loader2 className="animate-spin w-4 h-4" />
                                      <span>Updating Password...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock size={15} />
                                      <span>Update Password</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </form>

                    {/* Active Sessions & Brute force info */}
                    <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl space-y-4">
                      <div className="flex items-center gap-3.5 mb-2">
                        <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-650 dark:text-teal-400 border border-teal-500/20 dark:border-teal-500/20">
                          <Shield size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Security Metadata</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Verify your login details and account protection status.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-white/5 text-xs sm:text-sm">
                        <div className="p-3 bg-gray-100/80 dark:bg-slate-900/60 rounded-lg space-y-1">
                          <span className="text-gray-500 dark:text-gray-400">Brute Force Lockout Status</span>
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                            <CheckCircle2 size={14} />
                            <span>Protected (4 min lock)</span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-100/80 dark:bg-slate-900/60 rounded-lg space-y-1">
                          <span className="text-gray-500 dark:text-gray-400">Account Last Active Session</span>
                          <div className="text-gray-950 dark:text-white font-medium">
                            {currentUser?.activity?.lastActive || new Date().toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. Help & Support Tab */}
                {activeTab === 'help' && (
                  <motion.div
                    key="help"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Help & Customer Support</h2>
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Review common questions or submit support requests directly.</p>
                    </div>

                    {/* FAQ Accordion */}
                    <div className="space-y-3" ref={faqRef}>
                      <h3 className="font-bold text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">Frequently Asked Questions</h3>
                      {faqs.map((faq, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl overflow-hidden transition-all duration-200"
                        >
                          <button
                            onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                            className="flex items-center justify-between w-full p-4 text-left font-semibold text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                          >
                            <span>{faq.q}</span>
                            <ChevronDown
                              size={16}
                              className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                                expandedFaq === index ? 'rotate-180 text-gray-800 dark:text-white' : ''
                              }`}
                            />
                          </button>
                          <AnimatePresence>
                            {expandedFaq === index && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <p className="px-4 pb-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-200 dark:border-white/5 pt-2 bg-gray-100/40 dark:bg-slate-900/40">
                                  {faq.a}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    {/* Contact Support Form */}
                    <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl space-y-4" ref={supportRef}>
                      <div className="flex items-center gap-3.5 mb-2">
                        <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-650 dark:text-purple-400 border border-purple-500/20 dark:border-purple-500/20">
                          <Mail size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Submit a Support Request</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-xs font-normal">Contact our help team. We respond within 24 hours.</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200 dark:border-white/5">
                        {supportSubmitted ? (
                          <div className="p-4 bg-emerald-50/80 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/35 rounded-xl text-center space-y-2">
                            <Sparkles className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto animate-bounce" />
                            <h4 className="font-bold text-gray-900 dark:text-white">Ticket Submitted Successfully!</h4>
                            <p className="text-xs text-gray-505 dark:text-gray-400">Our customer success team will contact you at {currentUser?.email || 'your email'}.</p>
                            <button
                              onClick={() => setSupportSubmitted(false)}
                              className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 underline hover:text-[#167468]"
                            >
                              Send another message
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={handleSendSupport} className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Your Message / Problem Description</label>
                              <textarea
                                value={supportMessage}
                                onChange={(e) => setSupportMessage(e.target.value)}
                                placeholder="Describe the issue you are encountering or questions you have..."
                                rows={3}
                                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/15 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#167468]/50"
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={isSendingSupport}
                              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-[#167468] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                            >
                              {isSendingSupport ? (
                                <>
                                  <Loader2 className="animate-spin w-4 h-4" />
                                  <span>Sending...</span>
                                </>
                              ) : (
                                <>
                                  <Send size={14} />
                                  <span>Send Support Request</span>
                                </>
                              )}
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. Blog Tab */}
                {activeTab === 'blog' && (
                  <motion.div
                    key="blog"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Educational Blog & News</h2>
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Stay updated with study tips, programming guides, and product changes.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {blogPosts.map((post) => (
                        <div
                          key={post.id}
                          className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-5 hover:shadow-md dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/10 transition-all duration-300 flex flex-col justify-between gap-4 group"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              {post.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] font-bold text-[#167468] bg-[#167468]/15 border border-[#167468]/20 px-2 py-0.5 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <h3 className="text-lg font-bold text-gray-955 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-tight mb-2">
                              {post.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              {post.excerpt}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-white/5 text-xs text-gray-500">
                            <span className="font-semibold text-gray-600 dark:text-gray-400">By {post.author}</span>
                            <div className="flex items-center gap-3">
                              <span>{post.date}</span>
                              <span>•</span>
                              <span>{post.readTime}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
