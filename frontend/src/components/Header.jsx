




import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sun, Moon, Search, User, LogIn, LogOut,
  Menu, X, Home, BookOpen, Award, Code, Settings, ChevronDown, GraduationCap,
  Bell, Users, Compass
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMenu } from '../contexts/MenuContext';
import LearnBentIcon from '../contexts/LearnBentIcon';
import { normalizeImageSrc } from '../utils/image';
// Assuming Header.css is now empty or renamed since we're using Tailwind
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const [tutorials, setTutorials] = useState([]);
  const { theme, toggleTheme } = useTheme();
  const { isMenuOpen, setIsMenuOpen } = useMenu();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isExploreMenuOpen, setIsExploreMenuOpen] = useState(false);
  const [isMobileExploreOpen, setIsMobileExploreOpen] = useState(false);
  const [isTutorialsOpen, setIsTutorialsOpen] = useState(false);
  const [isTopTutorialsOpen, setIsTopTutorialsOpen] = useState(false);
  const [isMobileTutorialsOpen, setIsMobileTutorialsOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const accountRef = useRef(null);
  const exploreRef = useRef(null);
  const tutorialsRef = useRef(null);

  // Sync search input with URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get('q') || '');
  }, [location.search]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
      if (exploreRef.current && !exploreRef.current.contains(event.target)) {
        setIsExploreMenuOpen(false);
      }
      if (tutorialsRef.current && !tutorialsRef.current.contains(event.target)) {
        setIsTopTutorialsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [accountRef, exploreRef, tutorialsRef]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchTutorials = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/public/tutorials`);
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setTutorials(data);
          }
        }
      } catch (err) {
        console.error('Error fetching tutorials in header:', err);
      }
    };
    fetchTutorials();
    return () => { mounted = false; };
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const path = location.pathname;
      if (path.includes('/forum')) {
        navigate(`/user/dashboard/forum?q=${encodeURIComponent(searchQuery)}`);
      } else if (path.includes('/contests')) {
        navigate(`/user/dashboard/contests?q=${encodeURIComponent(searchQuery)}`);
      } else {
        navigate(`/user/dashboard/courses?q=${encodeURIComponent(searchQuery)}`);
      }
      if (typeof setIsMenuOpen === 'function') setIsMenuOpen(false);
    }
  };

  const handleMobileClick = () => {
    if (typeof setIsMenuOpen === 'function') {
      setIsMenuOpen(false);
    }
    // Also close the desktop dropdown if it was open
    setIsAccountMenuOpen(false);
    setIsExploreMenuOpen(false);
    setIsTopTutorialsOpen(false);
    setIsTutorialsOpen(false);
    setIsMobileTutorialsOpen(false);
    setMobileSearchOpen(false);
  };

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-gray-600 hover:text-gray-905 dark:text-gray-300 dark:hover:text-white transition-colors relative group"
      onClick={handleMobileClick}
    >
      {children}
      <span className="absolute -bottom-1 left-3 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-[#167468] group-hover:w-[calc(100%-1.5rem)] transition-all duration-300" />
    </Link>
  );

  const MobileNavLink = ({ to, children }) => (
    <Link
      to={to}
      className="flex items-center gap-3 w-full py-2 px-4 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition duration-200"
      onClick={handleMobileClick}
    >
      {children}
    </Link>
  );

  const handleGetStarted = () => {
    if (currentUser) {
      navigate('/user/dashboard/courses');
      return;
    }
    navigate('/auth');
  };

  return (
    <motion.header
      initial={false}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg ${isScrolled ? 'shadow-md border-b border-gray-200/50 dark:border-white/5' : ''
        }`}
    >
      <nav className="flex h-16 items-center justify-between w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-4">

        {/* Logo and Desktop Nav */}
        <div className="flex items-center gap-6">
          <Link to="/user/dashboard" className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <LearnBentIcon size={32} />
            <span className="text-gray-905 dark:text-white font-bold text-xl whitespace-nowrap">LearnBent</span>
          </Link>

          {/* Desktop Navigation Links (Visible on medium screens and up) */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-2">
              <NavLink to="/user/dashboard/forum"><Home size={18} />Forum</NavLink>
              <NavLink to="/user/dashboard/courses"><BookOpen size={18} />Courses</NavLink>
              
              {/* Desktop dropdown for Tutorials */}
              <div className="relative" ref={tutorialsRef}>
                <button
                  onClick={() => setIsTopTutorialsOpen(!isTopTutorialsOpen)}
                  className="flex items-center gap-1.5 py-2 px-3 text-sm font-medium text-gray-600 hover:text-gray-955 dark:text-gray-300 dark:hover:text-white transition-colors relative group bg-transparent border-none cursor-pointer outline-none"
                >
                  <BookOpen size={18} />
                  <span>Tutorials</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isTopTutorialsOpen ? 'rotate-180' : 'rotate-0'}`} />
                  <span className="absolute -bottom-1 left-3 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-[#167468] group-hover:w-[calc(100%-1.5rem)] transition-all duration-300" />
                </button>
                
                <AnimatePresence>
                  {isTopTutorialsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-950/95 rounded-xl shadow-2xl p-2 z-50 border border-gray-200 dark:border-white/10 backdrop-blur max-h-64 overflow-y-auto"
                    >
                      {tutorials.length > 0 ? (
                        tutorials.map((tutorial) => (
                          <Link
                            key={tutorial._id}
                            to={`/user/dashboard/tutorials/${tutorial._id}`}
                            onClick={() => {
                              setIsTopTutorialsOpen(false);
                              handleMobileClick();
                            }}
                            className="flex items-center justify-between py-2 px-3 rounded-lg text-sm font-semibold text-gray-750 dark:text-gray-300 hover:text-[#167468] dark:hover:text-teal-400 hover:bg-gray-105 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <span>{tutorial.title}</span>
                          </Link>
                        ))
                      ) : (
                        <div className="py-2 px-3 text-xs text-gray-500 italic">No tutorials available</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <NavLink to="/user/dashboard/quizzes"><Award size={18} />Quizzes</NavLink>
              
              {/* Desktop dropdown for Contests, Roadmaps, etc. */}
              <div className="relative" ref={exploreRef}>
                <button
                  onClick={() => setIsExploreMenuOpen(!isExploreMenuOpen)}
                  className="flex items-center gap-1.5 py-2 px-3 text-sm font-medium text-gray-600 hover:text-gray-955 dark:text-gray-300 dark:hover:text-white transition-colors relative group bg-transparent border-none cursor-pointer outline-none"
                >
                  <Code size={18} />
                  <span>Compete & Learn</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isExploreMenuOpen ? 'rotate-180' : 'rotate-0'}`} />
                  <span className="absolute -bottom-1 left-3 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-[#167468] group-hover:w-[calc(100%-1.5rem)] transition-all duration-300" />
                </button>
                
                <AnimatePresence>
                  {isExploreMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 w-[460px] sm:w-[480px] bg-white dark:bg-slate-950/95 rounded-xl shadow-2xl p-4 z-50 border border-gray-200 dark:border-white/10 backdrop-blur"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        {/* Group 1: Practice & Compete */}
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-[#167468] dark:text-teal-400 uppercase tracking-wider pl-2.5 mb-2">Practice & Compete</h4>
                          
                          <Link 
                            to="/user/dashboard/contests" 
                            onClick={() => setIsExploreMenuOpen(false)} 
                            className="flex items-start gap-3 w-full py-2 px-2.5 rounded-lg text-sm font-medium text-gray-750 dark:text-gray-200 hover:bg-gray-105 dark:hover:bg-white/10 transition duration-150"
                          >
                            <Code size={16} className="text-[#167468] dark:text-teal-400 mt-0.5 shrink-0" />
                            <div className="flex flex-col text-left">
                              <span className="font-semibold text-gray-900 dark:text-white">Contests</span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">Compete with peer coders</span>
                            </div>
                          </Link>

                          <div className="flex items-start justify-between w-full py-2 px-2.5 rounded-lg text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-75">
                            <div className="flex items-start gap-3">
                              <Award size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                              <div className="flex flex-col text-left">
                                <span className="font-semibold">Interview</span>
                                <span className="text-[10px]">Mock tests & QAs</span>
                              </div>
                            </div>
                            <span className="text-[8px] font-bold bg-[#167468]/15 text-[#167468] dark:text-teal-300 border border-[#167468]/20 px-1 py-0.5 rounded-full uppercase tracking-wider shrink-0 mt-0.5">Soon</span>
                          </div>

                          <div className="flex items-start justify-between w-full py-2 px-2.5 rounded-lg text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-75">
                            <div className="flex items-start gap-3">
                              <Compass size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                              <div className="flex flex-col text-left">
                                <span className="font-semibold">Roadmaps</span>
                                <span className="text-[10px]">Guided learning paths</span>
                              </div>
                            </div>
                            <span className="text-[8px] font-bold bg-[#167468]/15 text-[#167468] dark:text-teal-300 border border-[#167468]/20 px-1 py-0.5 rounded-full uppercase tracking-wider shrink-0 mt-0.5">Soon</span>
                          </div>
                        </div>

                        {/* Group 2: Resources & Tools */}
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-purple-650 dark:text-purple-400 uppercase tracking-wider pl-2.5 mb-2">Resources</h4>
                          
                          <div className="flex items-start justify-between w-full py-2 px-2.5 rounded-lg text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-75">
                            <div className="flex items-start gap-3">
                              <GraduationCap size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                              <div className="flex flex-col text-left">
                                <span className="font-semibold">Placement</span>
                                <span className="text-[10px]">Job prep & referrals</span>
                              </div>
                            </div>
                            <span className="text-[8px] font-bold bg-[#167468]/15 text-[#167468] dark:text-teal-300 border border-[#167468]/20 px-1 py-0.5 rounded-full uppercase tracking-wider shrink-0 mt-0.5">Soon</span>
                          </div>

                          <div className="flex items-start justify-between w-full py-2 px-2.5 rounded-lg text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-75">
                            <div className="flex items-start gap-3">
                              <Settings size={16} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                              <div className="flex flex-col text-left">
                                <span className="font-semibold">Software/Tools</span>
                                <span className="text-[10px]">Essential tools list</span>
                              </div>
                            </div>
                            <span className="text-[8px] font-bold bg-[#167468]/15 text-[#167468] dark:text-teal-300 border border-[#167468]/20 px-1 py-0.5 rounded-full uppercase tracking-wider shrink-0 mt-0.5">Soon</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {currentUser?.role === 'admin' && (
                <NavLink to="/admin"><Settings size={18} />Admin</NavLink>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Actions (Search, Theme, Account/Auth) */}
        <div className="hidden items-center gap-3 lg:flex">

          {/* Search Bar (More rounded, cleaner focus state) */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearch}
              className="w-40 xl:w-56 bg-gray-100 dark:bg-white/10 text-gray-950 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/60 rounded-full py-2 pl-4 pr-10 text-sm outline-none border border-gray-200 dark:border-white/10 transition duration-200 ease-in-out focus:ring-2 focus:ring-[#167468]/50 focus:border-[#167468]/50"
            />
            <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-white/70 pointer-events-none" />
          </div>

          {/* Theme Toggle Button (Modernized hover) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-700 dark:text-white transition duration-200 hover:bg-gray-105 dark:hover:bg-white/10"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Account/Auth Section */}
          {currentUser ? (
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full text-gray-750 dark:text-white transition duration-200 hover:bg-gray-105 dark:hover:bg-white/10"
              >
                {currentUser.profilePicture ? (
                  <img
                    src={normalizeImageSrc(currentUser.profilePicture)}
                    alt={currentUser.username}
                    className="h-8 w-8 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.username)}&background=0D8ABC&color=fff&size=128`}
                    alt={currentUser.username}
                    className="h-8 w-8 rounded-full object-cover border border-white/20"
                  />
                )}
                <span className="text-sm font-semibold whitespace-nowrap">{currentUser.username.split(' ')[0]}</span>
                <ChevronDown size={16} className={`ml-1 transition-transform ${isAccountMenuOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>

              {/* Account Dropdown Menu (Improved shadow, cleaner item styles) */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-950/95 rounded-xl shadow-2xl py-1 z-50 border border-gray-200 dark:border-white/10 backdrop-blur">
                  <Link to="/user/dashboard/profile" onClick={handleMobileClick} className="flex items-center w-full py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-105 dark:hover:bg-white/10 transition duration-150">
                    <User size={16} className="mr-3" /> Profile
                  </Link>
                  <Link to="/user/dashboard/notifications" onClick={handleMobileClick} className="flex items-center w-full py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-105 dark:hover:bg-white/10 transition duration-150">
                    <Bell size={16} className="mr-3" /> Notifications
                  </Link>
                  <Link to="/user/dashboard/community" onClick={handleMobileClick} className="flex items-center w-full py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-105 dark:hover:bg-white/10 transition duration-150">
                    <Users size={16} className="mr-3" /> Community
                  </Link>
                  <Link to="/user/dashboard/settings" onClick={handleMobileClick} className="flex items-center w-full py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-105 dark:hover:bg-white/10 transition duration-150">
                    <Settings size={16} className="mr-3" /> Settings
                  </Link>
                  <button onClick={() => { logout(); handleMobileClick(); }} className="flex items-center w-full py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-105 dark:hover:bg-white/10 transition duration-150">
                    <LogOut size={16} className="mr-3" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="flex items-center gap-2 py-2 px-4 text-sm font-semibold rounded-lg bg-gray-105 dark:bg-white/10 text-gray-800 dark:text-white transition duration-200 hover:bg-gray-200 dark:hover:bg-white/15 border border-gray-250 dark:border-white/10">
              <LogIn size={16} /> Login
            </Link>
          )}

          {!currentUser && (
            <motion.button
              type="button"
              className="bg-gradient-to-r from-purple-500 to-[#167468] text-white px-5 py-2 rounded-lg hover:shadow-lg hover:shadow-[#167468]/40 transition-all font-medium whitespace-nowrap shrink-0"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGetStarted}
            >
              Get Started
            </motion.button>
          )}
        </div>

        {/* Mobile Menu Toggle (Visible on large screens and down) */}
        <div className="flex items-center lg:hidden gap-2">
          {/* Mobile search toggle */}
          <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)} aria-label="Toggle search" className="text-gray-700 dark:text-white p-3 rounded-lg transition hover:bg-gray-100 dark:hover:bg-white/10">
            <Search size={20} />
          </button>

          <button aria-controls="mobile-menu" aria-expanded={isMenuOpen} aria-label="Toggle menu" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700 dark:text-white p-3 transition hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Panel (Hidden by default on desktop) */}
      {/* Added dynamic height and better background for a professional slide-down effect */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden shadow-xl bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-white/10"
          >
            {mobileSearchOpen && (
              <div className="p-3 border-b border-gray-200 dark:border-white/10">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (typeof setIsMenuOpen === 'function') setIsMenuOpen(false);
                    }
                  }}
                  placeholder="Search..."
                  className="w-full bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/60 rounded-full py-2 px-4 text-sm outline-none border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-[#167468]/50"
                />
              </div>
            )}

            <div className="flex flex-col gap-1 p-2 border-b border-gray-200 dark:border-white/10">
              <MobileNavLink to="/user/dashboard/forum"><Home size={18} /> Forum</MobileNavLink>
              <MobileNavLink to="/user/dashboard/courses"><BookOpen size={18} /> Courses</MobileNavLink>
              
              {/* Tutorials Collapsible Mobile Accordion */}
              <div className="w-full">
                <button
                  onClick={() => setIsMobileTutorialsOpen(!isMobileTutorialsOpen)}
                  className="flex items-center justify-between w-full py-2 px-4 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-105 dark:hover:bg-white/10 transition duration-200 bg-transparent border-none cursor-pointer text-left outline-none"
                >
                  <span className="flex items-center gap-3">
                    <BookOpen size={18} className="text-gray-600 dark:text-gray-300" /> Tutorials
                  </span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${isMobileTutorialsOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>
                
                <AnimatePresence>
                  {isMobileTutorialsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-6 flex flex-col gap-1.5 mt-1 border-l border-gray-200 dark:border-white/10 ml-6 max-h-60 overflow-y-auto"
                    >
                      {tutorials.length > 0 ? (
                        tutorials.map((tutorial) => (
                          <Link
                            key={tutorial._id}
                            to={`/user/dashboard/tutorials/${tutorial._id}`}
                            onClick={handleMobileClick}
                            className="flex items-center justify-between py-2 px-4 text-base font-medium rounded-md text-gray-700 dark:text-gray-205 hover:bg-gray-105 dark:hover:bg-white/10 transition duration-200"
                          >
                            <span>{tutorial.title}</span>
                          </Link>
                        ))
                      ) : (
                        <div className="py-2 px-4 text-sm text-gray-500 italic">No tutorials available</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <MobileNavLink to="/user/dashboard/quizzes"><Award size={18} /> Quizzes</MobileNavLink>
              
              {/* Collapsible Mobile Dropdown */}
              <div className="w-full">
                <button
                  onClick={() => setIsMobileExploreOpen(!isMobileExploreOpen)}
                  className="flex items-center justify-between w-full py-2 px-4 text-base font-medium rounded-md text-gray-750 dark:text-gray-200 hover:bg-gray-105 dark:hover:bg-white/10 transition duration-200 bg-transparent border-none cursor-pointer text-left outline-none"
                >
                  <span className="flex items-center gap-3">
                    <Code size={18} /> Compete & Learn
                  </span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${isMobileExploreOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>
                
                <AnimatePresence>
                  {isMobileExploreOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-6 overflow-hidden flex flex-col gap-1 mt-1 border-l-2 border-gray-250 dark:border-white/10 ml-6"
                    >
                      <MobileNavLink to="/user/dashboard/contests">
                        <Code size={16} className="text-[#167468] dark:text-teal-400" /> Contests
                      </MobileNavLink>

                      <div className="flex items-center justify-between w-full py-2 px-4 text-base font-medium text-gray-405 dark:text-gray-500 cursor-not-allowed opacity-80">
                        <span className="flex items-center gap-3">
                          <Award size={16} /> Interview
                        </span>
                        <span className="text-[8px] font-bold bg-[#167468]/15 text-[#167468] dark:text-teal-300 border border-[#167468]/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">Soon</span>
                      </div>

                      <div className="flex items-center justify-between w-full py-2 px-4 text-base font-medium text-gray-405 dark:text-gray-500 cursor-not-allowed opacity-80">
                        <span className="flex items-center gap-3">
                          <Compass size={16} /> Roadmaps
                        </span>
                        <span className="text-[8px] font-bold bg-[#167468]/15 text-[#167468] dark:text-teal-300 border border-[#167468]/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">Soon</span>
                      </div>

                      <div className="flex items-center justify-between w-full py-2 px-4 text-base font-medium text-gray-405 dark:text-gray-500 cursor-not-allowed opacity-80">
                        <span className="flex items-center gap-3">
                          <GraduationCap size={16} /> Placement
                        </span>
                        <span className="text-[8px] font-bold bg-[#167468]/15 text-[#167468] dark:text-teal-300 border border-[#167468]/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">Soon</span>
                      </div>

                      <div className="flex items-center justify-between w-full py-2 px-4 text-base font-medium text-gray-405 dark:text-gray-500 cursor-not-allowed opacity-80">
                        <span className="flex items-center gap-3">
                          <Settings size={16} /> Software/Tools
                        </span>
                        <span className="text-[8px] font-bold bg-[#167468]/15 text-[#167468] dark:text-teal-300 border border-[#167468]/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">Soon</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {currentUser?.role === 'admin' && (
                <MobileNavLink to="/admin"><Settings size={18} /> Admin</MobileNavLink>
              )}
            </div>

            <div className="py-4 px-4">
              {!currentUser && (
                <button
                  type="button"
                  onClick={() => { handleGetStarted(); handleMobileClick(); }}
                  className="w-full bg-gradient-to-r from-purple-500 to-[#167468] text-white px-6 py-3 rounded-lg font-medium mb-4"
                >
                  Get Started
                </button>
              )}

              {currentUser ? (
                <>
                  <div className="px-1 mt-4 mb-3">
                    <div className="text-base font-semibold text-gray-900 dark:text-white">{currentUser.username}</div>
                    <div className="text-sm font-normal text-gray-500 dark:text-gray-400">{currentUser.email}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <MobileNavLink to="/user/dashboard/profile"><User size={18} /> Profile</MobileNavLink>
                    <MobileNavLink to="/user/dashboard/notifications"><Bell size={18} /> Notifications</MobileNavLink>
                    <MobileNavLink to="/user/dashboard/community"><Users size={18} /> Community</MobileNavLink>
                    <MobileNavLink to="/user/dashboard/settings"><Settings size={18} /> Settings</MobileNavLink>
                    <a
                      href="#logout"
                      onClick={(e) => { e.preventDefault(); logout(); handleMobileClick(); }}
                      className="flex items-center gap-3 w-full py-2 px-4 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition duration-200"
                    >
                      <LogOut size={18} /> Logout
                    </a>
                  </div>
                </>
              ) : (
                <div className="mt-4">
                  <MobileNavLink to="/auth">
                    <LogIn size={18} /> Login / Sign Up
                  </MobileNavLink>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                <button
                  onClick={toggleTheme}
                  className="w-full flex justify-between items-center py-2 px-4 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-transparent border-none cursor-pointer transition duration-200 hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <span>Toggle Theme</span>
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;