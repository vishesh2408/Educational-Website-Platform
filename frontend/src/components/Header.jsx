




import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sun, Moon, Search, User, LogIn, LogOut,
  Menu, X, Home, BookOpen, Award, Code, Settings, ChevronDown, GraduationCap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMenu } from '../contexts/MenuContext';
import LearnBentIcon from '../contexts/LearnBentIcon';
// Assuming Header.css is now empty or renamed since we're using Tailwind
// import './Header.css'; 

const Header = () => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isMenuOpen, setIsMenuOpen } = useMenu();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const accountRef = useRef(null);

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [accountRef]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      console.log('Search query:', searchQuery);
      // navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      // Optional: Close mobile menu after search
      if (typeof setIsMenuOpen === 'function') setIsMenuOpen(false);
    }
  };

  const handleMobileClick = () => {
    if (typeof setIsMenuOpen === 'function') {
      setIsMenuOpen(false);
    }
    // Also close the desktop dropdown if it was open
    setIsAccountMenuOpen(false);
    setMobileSearchOpen(false);
  };

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-gray-300 hover:text-white transition-colors relative group"
      onClick={handleMobileClick}
    >
      {children}
      <span className="absolute -bottom-1 left-3 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-[#167468] group-hover:w-[calc(100%-1.5rem)] transition-all duration-300" />
    </Link>
  );

  const MobileNavLink = ({ to, children }) => (
    <Link
      to={to}
      className="flex items-center gap-3 w-full py-2 px-4 text-base font-medium rounded-md text-gray-200 hover:bg-white/10 transition duration-200"
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-slate-950 backdrop-blur-lg ${isScrolled ? 'shadow-lg border-b border-white/5' : ''
        }`}
    >
      <nav className="flex h-16 items-center justify-between w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-4">

        {/* Logo and Desktop Nav */}
        <div className="flex items-center gap-6">
          <Link to="/user/dashboard" className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <LearnBentIcon size={32} />
            <span className="text-white font-bold text-xl whitespace-nowrap">LearnBent</span>
          </Link>

          {/* Desktop Navigation Links (Visible on medium screens and up) */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-2">
              <NavLink to="/user/dashboard/forum"><Home size={18} />Forum</NavLink>
              <NavLink to="/user/dashboard/courses"><BookOpen size={18} />Courses</NavLink>
              <NavLink to="/user/dashboard/quizzes"><Award size={18} />Quizzes</NavLink>
              <NavLink to="/user/dashboard/contests"><Code size={18} />Contests</NavLink>
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
              className="w-40 xl:w-56 bg-white/10 text-white placeholder:text-white/60 rounded-full py-2 pl-4 pr-10 text-sm outline-none border border-white/10 transition duration-200 ease-in-out focus:ring-2 focus:ring-[#167468]/50 focus:border-[#167468]/50"
            />
            <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 pointer-events-none" />
          </div>

          {/* Theme Toggle Button (Modernized hover) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-white transition duration-200 hover:bg-white/10"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Account/Auth Section */}
          {currentUser ? (
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-full text-white transition duration-200 hover:bg-white/10"
              >
                <User size={20} />
                <span className="text-sm font-semibold whitespace-nowrap">{currentUser.username.split(' ')[0]}</span>
                <ChevronDown size={16} className={`ml-1 transition-transform ${isAccountMenuOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>

              {/* Account Dropdown Menu (Improved shadow, cleaner item styles) */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-950/95 rounded-xl shadow-2xl py-1 z-50 border border-white/10 backdrop-blur">
                  <Link to="/user/dashboard/profile" onClick={handleMobileClick} className="flex items-center w-full py-2 px-4 text-sm font-medium text-gray-200 hover:bg-white/10 transition duration-150">
                    <User size={16} className="mr-3" /> Profile
                  </Link>
                  <button onClick={() => { logout(); handleMobileClick(); }} className="flex items-center w-full py-2 px-4 text-sm font-medium text-gray-200 hover:bg-white/10 transition duration-150">
                    <LogOut size={16} className="mr-3" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="flex items-center gap-2 py-2 px-4 text-sm font-semibold rounded-lg bg-white/10 text-white transition duration-200 hover:bg-white/15 border border-white/10">
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
          <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)} aria-label="Toggle search" className="text-white p-3 rounded-lg transition hover:bg-white/10">
            <Search size={20} />
          </button>

          <button aria-controls="mobile-menu" aria-expanded={isMenuOpen} aria-label="Toggle menu" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white p-3 transition hover:bg-white/10 rounded-lg">
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
            className="lg:hidden shadow-xl bg-slate-950 border-t border-white/10"
          >
            {mobileSearchOpen && (
              <div className="p-3 border-b border-white/10">
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
                  className="w-full bg-white/10 text-white placeholder:text-white/60 rounded-full py-2 px-4 text-sm outline-none border border-white/10 focus:ring-2 focus:ring-[#167468]/50"
                />
              </div>
            )}

            <div className="flex flex-col gap-1 p-2 border-b border-white/10">
              <MobileNavLink to="/user/dashboard/forum"><Home size={18} /> Forum</MobileNavLink>
              <MobileNavLink to="/user/dashboard/courses"><BookOpen size={18} /> Courses</MobileNavLink>
              <MobileNavLink to="/user/dashboard/quizzes"><Award size={18} /> Quizzes</MobileNavLink>
              <MobileNavLink to="/user/dashboard/contests"><Code size={18} /> Contests</MobileNavLink>
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
                    <div className="text-base font-semibold text-white">{currentUser.username}</div>
                    <div className="text-sm font-normal text-gray-400">{currentUser.email}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <MobileNavLink to="/user/dashboard/profile"><User size={18} /> Profile</MobileNavLink>
                    <a
                      href="#logout"
                      onClick={(e) => { e.preventDefault(); logout(); handleMobileClick(); }}
                      className="flex items-center gap-3 w-full py-2 px-4 text-base font-medium rounded-md text-gray-200 hover:bg-white/10 transition duration-200"
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

              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={toggleTheme}
                  className="w-full flex justify-between items-center py-2 px-4 text-base font-medium rounded-md text-gray-200 bg-transparent border-none cursor-pointer transition duration-200 hover:bg-white/10"
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