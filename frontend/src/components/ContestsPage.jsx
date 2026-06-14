import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Skeleton from './Skeleton';
import { Award, Zap, Calendar, Users, Clock, ChevronRight, Search, BarChart2, Moon, Sun } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';
import './ContestsPage.css'; // Import the CSS for styling
// Base URL for your backend API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// --- Helper Components (Copied from your original ContestsPage.jsx for self-containment) ---

/**
 * CountdownTimer component: Displays a live countdown to a target date.
 * @param {object} props - Component props.
 * @param {Date} props.targetDate - The date to count down to.
 */
const CountdownTimer = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        // Ensure targetDate is a valid Date object
        const target = new Date(targetDate);
        if (isNaN(target.getTime())) {
            return {}; // Return empty if targetDate is invalid
        }
        const difference = +target - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    const timerComponents = [];
    Object.keys(timeLeft).forEach((interval) => {
        if (timeLeft[interval] !== undefined) { // Only render if value exists
            timerComponents.push(
                <div key={interval} className="countdown-item">
                    <span className="countdown-value">
                        {String(timeLeft[interval]).padStart(2, '0')}
                    </span>
                    <span className="countdown-label">
                        {interval}
                    </span>
                </div>
            );
        }
    });

    return (
        <div className="countdown-timer-container">
            {timerComponents.length ? timerComponents : <span className="countdown-ended-message">Time's up!</span>}
        </div>
    );
};

/**
 * DifficultyPill component: Displays a styled pill indicating contest difficulty.
 * @param {object} props - Component props.
 * @param {string} props.difficulty - The difficulty level (e.g., 'Easy', 'Medium', 'Hard').
 */
const DifficultyPill = ({ difficulty }) => {
    let difficultyClass = '';
    switch (difficulty) {
        case 'Easy':
            difficultyClass = 'difficulty-easy';
            break;
        case 'Medium':
            difficultyClass = 'difficulty-medium';
            break;
        case 'Hard':
            difficultyClass = 'difficulty-hard';
            break;
        default:
            difficultyClass = '';
    }

    return (
        <span className={`difficulty-pill ${difficultyClass}`}>
            {difficulty}
        </span>
    );
};

/**
 * ContestCard component: Displays a single contest's details.
 * @param {object} props - Component props.
 * @param {object} props.contest - The contest object to display.
 * @param {function} props.openModal - Function to open the global modal.
 */
const ContestCard = ({ contest, openModal, onRegister }) => {
    // Determine the contest status for conditional rendering and styling.
    const now = new Date();
    const startTime = new Date(contest.startTime);
    const endTime = new Date(contest.endTime);

    let status = 'Upcoming';
    if (now >= startTime && now <= endTime) {
        status = 'Live';
    } else if (now > endTime) {
        status = 'Past';
    }
    // Update contest object with determined status for consistent rendering
    const currentContest = { ...contest, status: status };

    let buttonClass = '';
    let buttonContent;

    if (currentContest.status === 'Live') {
        buttonClass = 'live-button';
        buttonContent = (
            <>
                <Zap size={18} />
                <span>Enter Contest</span>
            </>
        );
    } else if (currentContest.status === 'Upcoming') {
        buttonClass = 'upcoming-button';
        buttonContent = (
            <>
                <Calendar size={18} />
                <span>Register Now</span>
            </>
        );
    } else if (currentContest.status === 'Past') {
        buttonClass = 'past-button';
        buttonContent = (
            <>
                <BarChart2 size={18} />
                <span>View Results</span>
            </>
        );
    }

    const handleButtonClick = () => {
        if (currentContest.status === 'Live' || currentContest.status === 'Upcoming') {
            onRegister(currentContest);
        } else if (currentContest.status === 'Past') {
            openModal('Contest Results', `Viewing results for "${currentContest.title}". Winner: ${currentContest.winner || 'N/A'}.`);
        }
    };

    return (
        <div className="contest-card-container" data-id={contest._id}> {/* Use _id from MongoDB */}
            <div className="contest-card-content">
                <div className="contest-card-header">
                    <span className="contest-category-pill">
                        {currentContest.category}
                    </span>
                    <DifficultyPill difficulty={currentContest.difficulty} />
                </div>
                <h3 className="contest-title">
                    {currentContest.title}
                </h3>
                <p className="contest-description">
                    {currentContest.description}
                </p>

                <div className="contest-details-row">
                    <div className="contest-detail-item">
                        <Users size={16} />
                        <span>{currentContest.participants.toLocaleString()} Participants</span>
                    </div>
                    <div className="contest-detail-item">
                        <Award size={16} />
                        <span className="contest-prize">{currentContest.prize} Prize Pool</span>
                    </div>
                </div>

                {/* Conditional rendering for timer/past info based on contest status */}
                {currentContest.status === 'Live' && (
                    <div className="contest-timer-section">
                        <p className="contest-timer-label live-label">Ends In</p>
                        <CountdownTimer targetDate={currentContest.endTime} />
                    </div>
                )}
                {currentContest.status === 'Upcoming' && (
                    <div className="contest-timer-section">
                        <p className="contest-timer-label upcoming-label">Starts In</p>
                        <CountdownTimer targetDate={currentContest.startTime} />
                    </div>
                )}
                {currentContest.status === 'Past' && (
                    <div className="contest-past-info">
                        <p className="contest-past-status">Contest Ended</p>
                        {currentContest.winner && <p className="contest-winner">Winner: <span className="winner-name">{currentContest.winner}</span></p>}
                    </div>
                )}

                <button onClick={handleButtonClick} className={`contest-action-button ${buttonClass}`}>
                    {buttonContent}
                    <span className="contest-button-icon">
                        <ChevronRight size={18} />
                    </span>
                </button>
            </div>
        </div>
    );
};

/**
 * FeaturedContest component: Displays a prominent featured contest.
 * Uses useModal() hook to handle modal interactions.
 * @param {object} props - Component props.
 * @param {object} props.contest - The featured contest object.
 */
const FeaturedContest = ({ contest, onRegister }) => {
    const { openModal } = useModal();
    return (
    <div className="featured-contest-card">
        <div className="featured-contest-main-content">
            <div className="featured-contest-meta">
                <span className="featured-tag">Featured</span>
                <span className="featured-category">{contest.category}</span>
            </div>
            <h2 className="featured-title">{contest.title}</h2>
            <p className="featured-description">{contest.description}</p>
            <div className="featured-details-row">
                <div className="featured-detail-item">
                    <Users size={20} />
                    <span>{contest.participants.toLocaleString()} Participants</span>
                </div>
                <div className="featured-detail-item">
                    <Award size={20} />
                    <span className="featured-prize">{contest.prize} Prize Pool</span>
                </div>
                <div className="featured-detail-item">
                    <BarChart2 size={20} />
                    <span className="featured-difficulty">{contest.difficulty}</span>
                </div>
            </div>
            <button onClick={() => onRegister(contest)} className="featured-action-button">
                Join Challenge
            </button>
        </div>
        <div className="featured-contest-timer-container">
            <div className="featured-contest-timer-box">
                <p className="featured-timer-label">Time Remaining</p>
                <CountdownTimer targetDate={contest.endTime} />
            </div>
        </div>
    </div>
    );
};


// --- Main Contests Page Component ---

/**
 * ContestsPage component: The main component rendering the entire contests page.
 * Handles state for search, filters, and theme.
 * @param {function} openModal - Function to open the global modal.
 */
const ContestsPage = ({ openModal }) => {
    const { currentUser } = useAuth();
    const { openModal: modalContextOpenModal } = useModal();
    const [searchParams, setSearchParams] = useSearchParams();
    const querySearchTerm = searchParams.get('q') || '';

    const [allContests, setAllContests] = useState([]); // Stores all contests fetched from backend
    const [searchTerm, setSearchTerm] = useState(querySearchTerm);
    const [difficultyFilter, setDifficultyFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sync searchTerm with URL query parameter changes
    useEffect(() => {
        setSearchTerm(querySearchTerm);
    }, [querySearchTerm]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value) {
            setSearchParams({ q: value });
        } else {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('q');
            setSearchParams(newParams);
        }
    };

    const effectiveOpenModal = openModal || modalContextOpenModal || (() => console.warn('openModal not available'));

    const handleRegister = async (contest) => {
        if (!currentUser) {
            effectiveOpenModal('Authentication Required', 'Please log in to register or enter contests.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/contests/register/${contest._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                effectiveOpenModal(
                    contest.status === 'Live' ? 'Entered Contest' : 'Registered Successfully',
                    contest.status === 'Live'
                        ? `You have entered the contest "${contest.title}". Good luck!`
                        : `You have successfully registered for the upcoming contest "${contest.title}".`,
                    { isSuccess: true }
                );
                // Increment UI participant count locally
                setAllContests(prev => prev.map(c => c._id === contest._id ? { ...c, participants: c.participants + 1 } : c));
            } else {
                effectiveOpenModal('Registration Failed', data.msg || 'Could not complete registration.');
            }
        } catch (err) {
            console.error(err);
            effectiveOpenModal('Error', 'A network error occurred. Please try again.');
        }
    };

    // Fetch contests from backend
    const fetchContests = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/public/contests`);
            const data = await response.json();
            if (response.ok) {
                // Parse date strings to Date objects immediately after fetching
                const parsedContests = data.map(contest => ({
                    ...contest,
                    startTime: new Date(contest.startTime),
                    endTime: new Date(contest.endTime),
                }));
                setAllContests(parsedContests);
            } else {
                throw new Error(data.msg || 'Failed to fetch contests.');
            }
        } catch (err) {
            console.error('Error fetching contests:', err);
            setError('Failed to load contests. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContests();
    }, [fetchContests]);

    // Filter contests based on search term, difficulty, and category.
    const filteredContests = allContests.filter(contest =>
        contest.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (difficultyFilter === 'All' || contest.difficulty.trim() === difficultyFilter.trim()) &&
        (categoryFilter === 'All' || contest.category === categoryFilter)
    );

    // Separate filtered contests into live, upcoming, and past categories.
    // Featured contest is handled separately.
    const liveContests = filteredContests.filter(c => {
        const now = new Date();
        return now >= c.startTime && now <= c.endTime && !c.isFeatured;
    });
    const upcomingContests = filteredContests.filter(c => {
        const now = new Date();
        return now < c.startTime;
    });
    const pastContests = filteredContests.filter(c => {
        const now = new Date();
        return now > c.endTime;
    });

    // Find the single featured live contest.
    const featuredContest = filteredContests.find(c => {
        const now = new Date();
        return c.isFeatured && now >= c.startTime && now <= c.endTime;
    });

    // Generate unique categories and difficulties for filter dropdowns.
    const categories = ['All', ...new Set(allContests.map(c => c.category))];
    const difficulties = ['All', 'Easy', 'Medium', 'Hard'];



    if (isLoading) {
        return (
            <div className="contests-page-container">
                <main className="contests-main-content animate-pulse">
                    {/* Header Skeleton */}
                    <header className="contests-page-header">
                        <div className="h-10 bg-gray-200 dark:bg-white/10 rounded-xl w-64 sm:w-80 mx-auto mb-3" />
                        <div className="h-4 bg-gray-150 dark:bg-white/5 rounded-lg w-80 sm:w-96 md:w-[480px] mx-auto" />
                    </header>

                    {/* Featured Section Skeleton */}
                    <div className="mb-8 p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="h-6 bg-gray-250 dark:bg-white/15 rounded-full w-24" />
                            <div className="h-6 bg-gray-250 dark:bg-white/15 rounded-full w-16" />
                        </div>
                        <div className="h-8 bg-gray-200 dark:bg-white/10 rounded-lg w-1/2" />
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-150 dark:bg-white/5 rounded-lg w-3/4" />
                            <div className="h-4 bg-gray-150 dark:bg-white/5 rounded-lg w-1/2" />
                        </div>
                        <div className="flex gap-4 pt-2">
                            <div className="h-5 bg-gray-150 dark:bg-white/5 rounded-lg w-32" />
                            <div className="h-5 bg-gray-150 dark:bg-white/5 rounded-lg w-32" />
                        </div>
                    </div>

                    {/* Filters Section Skeleton */}
                    <div className="contests-filters-section flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                        <div className="w-full max-w-md h-12 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl" />
                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="w-full md:w-40 h-11 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl" />
                            <div className="w-full md:w-40 h-11 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl" />
                        </div>
                    </div>

                    {/* Contests Grid Skeleton */}
                    <div className="contest-sections-wrapper space-y-8">
                        <div>
                            <div className="h-6 bg-gray-200 dark:bg-white/10 rounded-lg w-36 mb-4" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map((idx) => (
                                    <div key={idx} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-none flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <div className="h-5 bg-gray-150 dark:bg-white/5 rounded-full w-16" />
                                                <div className="h-5 bg-gray-150 dark:bg-white/5 rounded-full w-16" />
                                            </div>
                                            <div className="h-6 bg-gray-200 dark:bg-white/10 rounded-lg w-3/4" />
                                            <div className="h-4 bg-gray-150 dark:bg-white/5 rounded-lg w-full" />
                                        </div>
                                        <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/5">
                                            <div className="flex justify-between items-center">
                                                <div className="h-4 bg-gray-150 dark:bg-white/5 rounded-lg w-20" />
                                                <div className="h-4 bg-gray-150 dark:bg-white/5 rounded-lg w-20" />
                                            </div>
                                            <div className="h-10 bg-gray-200 dark:bg-white/10 rounded-xl w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="contests-page-container flex items-center justify-center min-h-[calc(100vh-7rem)]">
                <p className="text-xl text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="contests-page-container">
            
            <div className="contests-main-content">
                <header className="contests-page-header">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-teal-600 via-emerald-500 to-indigo-600 dark:from-teal-400 dark:via-emerald-300 dark:to-indigo-400 bg-clip-text text-transparent mb-3">
                        Compete & Conquer
                    </h1>
                    <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Sharpen your skills, challenge your peers, and win amazing prizes in our exciting lineup of contests.
                    </p>
                </header>

                {/* Featured Contest Section: Renders if a featured contest is found. */}
                {featuredContest && (
                    <section className="featured-section">
                        <FeaturedContest contest={featuredContest} onRegister={handleRegister} />
                    </section>
                )}

                {/* Filters Section: Search bar and dropdowns. */}
                <div className="contests-filters-section">
                    <div className="contests-search-bar">
                        <Search size={20} className="contests-search-icon" />
                        <input
                            type="text"
                            placeholder="Search for a contest..."
                            className="contests-search-input"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="contests-filter-dropdowns">
                        <select
                            className="contests-filter-select"
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                        >
                            {/* Map through difficulties for dropdown options */}
                            {difficulties.map(d => <option key={d} value={d}>{d} Difficulty</option>)}
                        </select>
                        <select
                            className="contests-filter-select"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            {/* Map through categories for dropdown options */}
                            {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Contest Sections Wrapper: Contains Live, Upcoming, and Past contest grids. */}
                <div className="contest-sections-wrapper">
                    {/* Live Contests Section */}
                    {liveContests.length > 0 && (
                        <section>
                            <h2 className="contest-section-title">
                                <span className="live-indicator"></span>
                                Live Contests
                            </h2>
                            <div className="contests-grid">
                                {liveContests.map(contest => <ContestCard key={contest._id} contest={contest} openModal={effectiveOpenModal} onRegister={handleRegister} />)}
                            </div>
                        </section>
                    )}

                    {/* Upcoming Contests Section */}
                    {upcomingContests.length > 0 && (
                        <section>
                            <h2 className="contest-section-title">
                                <span className="section-icon text-blue"><Clock /></span>
                                Upcoming Contests
                            </h2>
                            <div className="contests-grid">
                                {upcomingContests.map(contest => <ContestCard key={contest._id} contest={contest} openModal={effectiveOpenModal} onRegister={handleRegister} />)}
                            </div>
                        </section>
                    )}

                    {/* Past Contests Section */}
                    {pastContests.length > 0 && (
                        <section>
                            <h2 className="contest-section-title">
                                <span className="section-icon text-gray"><Award /></span>
                                Past Contests
                            </h2>
                            <div className="contests-grid">
                                {pastContests.map(contest => <ContestCard key={contest._id} contest={contest} openModal={effectiveOpenModal} onRegister={handleRegister} />)}
                            </div>
                        </section>
                    )}

                    {/* Message displayed when no contests match the current filters. */}
                    {filteredContests.length === 0 && (
                        <div className="no-contests-message">
                            <h3 className="no-contests-title">No Contests Found</h3>
                            <p className="no-contests-text">Try adjusting your filters or check back later for new contests!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ContestsPage;
