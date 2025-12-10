




import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sun, Moon, Search, User, LogIn, LogOut,
  Menu, X, Home, BookOpen, Award, Code, Settings, ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMenu } from '../contexts/MenuContext';
// Assuming Header.css is now empty or renamed since we're using Tailwind
// import './Header.css'; 

const Header = () => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isMenuOpen, setIsMenuOpen } = useMenu();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
      className="flex items-center gap-2 py-2 px-3 text-base font-medium rounded-lg text-gray-100 hover:bg-color-primary-dark transition duration-200 dark:text-gray-200 dark:hover:bg-color-border-dark"
      onClick={handleMobileClick}
    >
      {children}
    </Link>
  );

  const MobileNavLink = ({ to, children }) => (
    <Link 
      to={to} 
      className="flex items-center gap-3 w-full py-2 px-4 text-base font-medium rounded-md text-gray-100 hover:bg-color-primary-dark transition duration-200 dark:text-gray-200 dark:hover:bg-color-border-dark"
      onClick={handleMobileClick}
    >
      {children}
    </Link>
  );

  return (
    // Base Header: fixed, shadow, primary color, dark mode toggle for BG
    <header className="fixed top-0 left-0 right-0 z-50 bg-color-primary shadow-lg transition duration-300 ease-in-out dark:bg-color-card-bg-dark">
      
      {/* Header Nav Container */}
      {/* Increased max-width for professional feel, removed unnecessary 'container' class usage */}
      <nav className="flex h-16 items-center justify-between w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-4">
        
        {/* Logo and Desktop Nav */}
        <div className="flex items-center gap-6">
          <Link to="/" className="text-white text-2xl font-extrabold tracking-tight whitespace-nowrap">
            LearnBent
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
              className="w-48 bg-color-search-bg-light text-color-text-light rounded-full py-2 pl-4 pr-10 text-sm outline-none border border-transparent transition duration-200 ease-in-out focus:ring-2 focus:ring-color-search-border focus:border-color-search-border dark:bg-color-search-bg-dark dark:text-color-text-dark"
            />
            <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500/70 pointer-events-none" />
          </div>

          {/* Theme Toggle Button (Modernized hover) */}
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full text-white transition duration-200 hover:bg-color-primary-dark/80 dark:hover:bg-color-border-dark"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Account/Auth Section */}
          {currentUser ? (
            <div className="relative" ref={accountRef}>
              <button 
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)} 
                className="flex items-center gap-2 p-2 rounded-full text-white transition duration-200 hover:bg-color-primary-dark/80 dark:hover:bg-color-border-dark"
              >
                <User size={20} />
                <span className="text-sm font-semibold whitespace-nowrap">{currentUser.username.split(' ')[0]}</span>
                <ChevronDown size={16} className={`ml-1 transition-transform ${isAccountMenuOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              
              {/* Account Dropdown Menu (Improved shadow, cleaner item styles) */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-color-card-bg-light rounded-xl shadow-2xl py-1 z-50 border border-gray-100 dark:bg-color-card-bg-dark dark:border-color-border-dark/50 transition duration-300">
                  <Link to="/user/dashboard/profile" onClick={handleMobileClick} className="flex items-center w-full py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 transition duration-150 dark:text-gray-200 dark:hover:bg-color-border-dark/70">
                    <User size={16} className="mr-3" /> Profile
                  </Link>
                  <button onClick={() => { logout(); handleMobileClick(); }} className="flex items-center w-full py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 transition duration-150 dark:text-gray-200 dark:hover:bg-color-border-dark/70">
                    <LogOut size={16} className="mr-3" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="flex items-center gap-2 py-2 px-4 text-sm font-semibold rounded-lg bg-color-primary-dark text-white transition duration-200 hover:bg-color-primary/90 dark:bg-color-border-dark dark:hover:bg-color-border-dark/70">
              <LogIn size={16} /> Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle (Visible on large screens and down) */}
        <div className="flex items-center lg:hidden gap-2">
          {/* Mobile search toggle */}
          <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)} aria-label="Toggle search" className="text-white p-3 rounded-lg transition hover:bg-color-primary-dark/50 dark:hover:bg-color-border-dark/50">
            <Search size={20} />
          </button>

          <button aria-controls="mobile-menu" aria-expanded={isMenuOpen} aria-label="Toggle menu" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white p-3 transition hover:bg-color-primary-dark/50 dark:hover:bg-color-border-dark/50 rounded-lg">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Panel (Hidden by default on desktop) */}
      {/* Added dynamic height and better background for a professional slide-down effect */}
      {isMenuOpen && (
        <div id="mobile-menu" className="lg:hidden shadow-xl bg-color-primary-dark border-t border-cyan-800 transition duration-300 ease-in-out dark:bg-color-card-bg-dark dark:border-color-border-dark">

          {/* Optional mobile search area */}
          {mobileSearchOpen && (
            <div className="p-3 border-b border-cyan-800/40 dark:border-color-border-dark/40">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter') { /* perform search nav */ if (typeof setIsMenuOpen === 'function') setIsMenuOpen(false); } }}
                placeholder="Search..."
                className="w-full rounded-full py-2 px-4 text-sm outline-none border border-transparent focus:ring-2 focus:ring-color-search-border"
              />
            </div>
          )}

          {/* Navigation Links (visible to all mobile users) */}
          <div className="flex flex-col gap-1 p-2 border-b border-cyan-800/50 dark:border-color-border-dark/50">
            <MobileNavLink to="/user/dashboard/forum"><Home size={18} /> Forum</MobileNavLink>
            <MobileNavLink to="/user/dashboard/courses"><BookOpen size={18} /> Courses</MobileNavLink>
            <MobileNavLink to="/user/dashboard/quizzes"><Award size={18} /> Quizzes</MobileNavLink>
            <MobileNavLink to="/user/dashboard/contests"><Code size={18} /> Contests</MobileNavLink>
            {currentUser?.role === 'admin' && (
              <MobileNavLink to="/admin"><Settings size={18} /> Admin</MobileNavLink>
            )}
          </div>

          {/* Account and Theme Section */}
          <div className="py-4 px-4">
            {currentUser ? (
              <>
                <div className="px-1 mb-3">
                  <div className="text-base font-semibold text-white">{currentUser.username}</div>
                  <div className="text-sm font-normal text-gray-400">{currentUser.email}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <MobileNavLink to="/user/dashboard/profile"><User size={18} /> Profile</MobileNavLink>
                  <a href="#logout" onClick={(e) => { e.preventDefault(); logout(); handleMobileClick(); }} className="flex items-center gap-3 w-full py-2 px-4 text-base font-medium rounded-md text-gray-100 hover:bg-color-primary-dark transition duration-200 dark:text-gray-200 dark:hover:bg-color-border-dark">
                    <LogOut size={18} /> Logout
                  </a>
                </div>
              </>
            ) : (
              <MobileNavLink to="/auth">
                <LogIn size={18} /> Login / Sign Up
              </MobileNavLink>
            )}

            {/* Mobile Theme Toggle */}
            <div className="mt-4 pt-4 border-t border-cyan-800/50 dark:border-color-border-dark/50">
              <button onClick={toggleTheme} className="w-full flex justify-between items-center py-2 px-4 text-base font-medium rounded-md text-gray-200 bg-transparent border-none cursor-pointer transition duration-200 hover:bg-color-primary-dark dark:hover:bg-color-border-dark">
                <span>Toggle Theme</span>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;