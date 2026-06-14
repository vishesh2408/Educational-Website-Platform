import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';
import Skeleton from './Skeleton';
import { useTheme } from '../contexts/ThemeContext';

// StarIcon component for displaying rating stars
const StarIcon = ({ filled, half }) => {
    return (
        <svg
            className={`w-4 h-4 transition-colors duration-200 ${filled || half ? 'text-yellow-400 dark:text-yellow-300' : 'text-gray-300 dark:text-gray-500'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
        >
            {half ? (
                <>
                    <defs>
                        <linearGradient id="half">
                            <stop offset="50%" stopColor="currentColor" />
                            <stop offset="50%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.785.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" fill="url(#half)" />
                </>
            ) : (
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.785.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
            )}
        </svg>
    );
};


// CourseCard component: Renders a single course card with its details.
const CourseCard = ({ course, onAction, isEnrolled, onLikeToggle, isLikedInitial }) => {
    const navigate = useNavigate();

    const safeOnAction = onAction || ((title, price, isPaid, id) => {
        // fallback: navigate to course detail page
        if (!id) return;
        const target = `/user/dashboard/courses/${id}`;
        try {
            // try react-router navigation first
            navigate(target);
            // as a robust fallback (in case the router isn't mounted), also set location after a short delay
            setTimeout(() => {
                if (window.location.pathname !== target) {
                    // fallback to full navigation
                    window.location.href = target;
                }
            }, 200);
        } catch (err) {
            console.error('navigate error, falling back to location.href', err);
            window.location.href = target;
        }
    });
    const safeOnLikeToggle = onLikeToggle || (() => {});



    const isPaid = course.type === 'paid';
    const isUpcoming = course.status === 'upcoming';
    const [isLiked, setIsLiked] = useState(isLikedInitial);

    useEffect(() => {
        setIsLiked(isLikedInitial);
    }, [isLikedInitial]);

    const handleLikeClick = (e) => {
        e.stopPropagation();
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        safeOnLikeToggle(course._id, newLikedState);
    };

    const renderStarRating = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        for (let i = 0; i < fullStars; i++) {
            stars.push(<StarIcon key={`full-${i}`} filled={true} />);
        }
        if (hasHalfStar) {
            stars.push(<StarIcon key="half" half={true} />);
        }
        for (let i = stars.length; i < 5; i++) {
            stars.push(<StarIcon key={`empty-${i}`} filled={false} />);
        }
        return <div className="flex items-center space-x-0.5">{stars}</div>;
    };

    const handleCardClick = () => {
        const target = `/user/dashboard/courses/${course._id}`;
        try {
            navigate(target);
            setTimeout(() => {
                if (window.location.pathname !== target) {
                    window.location.href = target;
                }
            }, 200);
        } catch (err) {
            console.error('navigate error, falling back to location.href', err);
            window.location.href = target;
        }
    };

    const handleActionButtonClick = (e) => {
        e.stopPropagation();
        // If course is paid and user is not enrolled -> trigger enrollment/access flow
        if (isPaid && !isEnrolled) {
            safeOnAction(course.title, course.price, isPaid, course._id);
            return;
        }
        // Otherwise (free course or already enrolled) navigate to course detail page
        const target = `/user/dashboard/courses/${course._id}`;
        try {
            navigate(target);
            setTimeout(() => {
                if (window.location.pathname !== target) {
                    window.location.href = target;
                }
            }, 200);
        } catch (err) {
            console.error('[CoursesPage] action button navigate error, falling back to location.href', err);
            window.location.href = target;
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 backdrop-blur shadow-lg hover:shadow-xl transition-transform duration-300 transform hover:-translate-y-1"
        >
            <div className="relative h-36 sm:h-40 overflow-hidden">
                <img
                    src={course.imageUrl || 'https://placehold.co/400x224/cccccc/000000?text=No+Image'}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/400x224/E5E7EB/4B5563?text=Image+Error`;
                    }}
                />
            </div>
            <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">{course.title}</h4>
                    <div className="flex items-center justify-between mb-2">
                        {renderStarRating(course.rating)}
                        <button
                            onClick={handleLikeClick}
                            className={`p-1.5 rounded-full transition-colors duration-200 ${isLiked ? 'text-red-500 hover:bg-gray-100 dark:hover:bg-white/10' : 'text-gray-400 dark:text-white/50 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                            aria-label={isLiked ? "Unlike course" : "Like course"}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d={isLiked ? 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5A5.5 5.5 0 017.5 3c1.74 0 3.41.81 4.5 2.09A5.5 5.5 0 0116.5 3c3.03 0 5.5 2.47 5.5 5.5 0 3.78-3.4 6.86-8.55 11.54L12 21.35z' : 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5A5.5 5.5 0 017.5 3c1.74 0 3.41.81 4.5 2.09A5.5 5.5 0 0116.5 3c3.03 0 5.5 2.47 5.5 5.5 0 3.78-3.4 6.86-8.55 11.54L12 21.35z'} />
                            </svg>
                        </button>
                    </div>
                    <p className="text-gray-655 dark:text-gray-300 text-xs mb-3 line-clamp-2">{course.description}</p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/80">
                        {isPaid ? 'Paid' : 'Free'}
                    </span>
                    <span className="text-lg font-extrabold text-teal-600 dark:text-teal-300">
                        {course.price && `₹${course.price}`}
                    </span>
                </div>
            </div>
            <div className="p-4 pt-0">
                {isUpcoming ? (
                    <button className="w-full py-2 px-3 text-sm rounded-xl font-bold bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/60 cursor-not-allowed transition-colors duration-200" disabled>
                        Coming Soon
                    </button>
                ) : (
                    <button
                        className={`w-full py-2 px-3 text-sm rounded-xl font-bold transition-all duration-300 ease-in-out transform ${isEnrolled ? 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/60 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-[#167468] text-white hover:opacity-95 active:scale-95'}`}
                        onClick={handleActionButtonClick}
                        disabled={isEnrolled}
                    >
                        {isEnrolled ? 'Enrolled' : (isPaid ? 'Enroll Now' : 'Access Now')}
                    </button>
                )}
            </div>
        </div>
    );
};

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// CoursesPage component
const CoursesPage = ({ currentUser, openModal = () => {} }) => {


    const { theme, toggleTheme } = useTheme();

    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
    const [likedCourseIds, setLikedCourseIds] = useState([]);
    const [userProgressMap, setUserProgressMap] = useState({});
    const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);
    const [showLikedOnly, setShowLikedOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAllCourses = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/public/courses`);
            const data = await response.json();
            if (response.ok) {
                setCourses(data);
            } else {
                throw new Error(data.msg || 'Failed to fetch courses.');
            }
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError('Failed to load courses. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchUserEnrollments = useCallback(async () => {
        if (!currentUser) {
            setEnrolledCourseIds([]);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/courses/enrolled`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // ✅ Use cookie-based authentication
            });
            const data = await response.json();
            if (response.ok) {
                setEnrolledCourseIds(data.map(course => course._id));
            } else {
                console.error('Failed to fetch enrolled courses:', data.msg);
                setEnrolledCourseIds([]);
            }
        } catch (err) {
            console.error('Network error fetching enrolled courses:', err);
            setEnrolledCourseIds([]);
        }
    }, [currentUser]);

    const fetchUserLikedCourses = useCallback(async () => {
        if (!currentUser) {
            setLikedCourseIds([]);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/courses/liked`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // ✅ Use cookie-based authentication
            });
            const data = await response.json();
            if (response.ok) {
                setLikedCourseIds(data.map(course => course._id));
            } else {
                console.error('Failed to fetch liked courses:', data.msg);
                setLikedCourseIds([]);
            }
        } catch (err) {
            console.error('Network error fetching liked courses:', err);
            setLikedCourseIds([]);
        }
    }, [currentUser]);



    // NEW: Function to fetch user progress for all enrolled courses
        const fetchUserProgress = useCallback(async (enrolledIds) => {
            if (!currentUser || enrolledIds.length === 0) {
                setUserProgressMap({});
                return;
            }
    
            const newProgressMap = {};
            for (const courseId of enrolledIds) {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/user/progress/${courseId}`, {
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include', // ✅ Use cookie-based authentication
                    });
                    const data = await response.json();
                    if (response.ok) {
                        newProgressMap[courseId] = data;
                    }
                } catch (err) {
                    console.error(`Error fetching progress for course ${courseId}:`, err);
                }
            }
            setUserProgressMap(newProgressMap);
        }, [currentUser]);





    useEffect(() => {
        fetchAllCourses();
    }, [fetchAllCourses]);

    useEffect(() => {
        if (currentUser) {
            fetchUserEnrollments();
            fetchUserLikedCourses();
        } else {
            setEnrolledCourseIds([]);
            setLikedCourseIds([]);
            setUserProgressMap({});// Clear progress map when no user
        }
    }, [currentUser, fetchUserEnrollments, fetchUserLikedCourses]);


        // Chain progress fetch after enrollments are loaded
        useEffect(() => {
            if (enrolledCourseIds.length > 0) {
                fetchUserProgress(enrolledCourseIds);
            }
        }, [enrolledCourseIds, fetchUserProgress]);
    


    const handleAction = async (courseTitle, price, isPaid, courseId) => {
        if (!currentUser) {
            openModal('Login Required', 'You need to log in to enroll in or access courses.');
            return;
        }

        if (isEnrolled(courseId)) {
            const progress = userProgressMap[courseId];
            const resumeTopicId = progress?.lastViewedTopicId;

            if (resumeTopicId) {
                openModal('Resume Course', `Resuming ${courseTitle} from your last accessed topic. Topic ID: ${resumeTopicId}`);
            } else {
                openModal('Start Course', `Starting ${courseTitle} from the beginning.`);
            }
            
            console.log(`User attempting to access already enrolled course: ${courseTitle}`);
            return;
        }

        openModal('Processing...', `Initiating ${isPaid ? 'enrollment' : 'access'} for ${courseTitle}...`);

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/courses/enroll/${courseId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // ✅ Use cookie-based authentication
            });
            const data = await response.json();

            if (response.ok) {
                openModal('Success!', data.msg);
                setEnrolledCourseIds(prevIds => [...prevIds, courseId]);
            } else {
                openModal('Action Failed', data.msg || 'An error occurred during enrollment/access.');
            }
        } catch (err) {
            console.error('Enrollment/Access API error:', err);
            openModal('Network Error', 'Could not connect to the server. Please try again.');
        }
    };

    const handleLikeToggle = async (courseId, newLikedState) => {
        if (!currentUser) {
            openModal('Login Required', 'You need to log in to like courses.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/user/courses/like/${courseId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // ✅ Use cookie-based authentication
            });
            const data = await response.json();

            if (response.ok) {
                if (data.liked) {
                    setLikedCourseIds(prevIds => [...prevIds, courseId]);
                    openModal('Liked!', `You liked "${courses.find(c => c._id === courseId)?.title || 'this course'}".`);
                } else {
                    setLikedCourseIds(prevIds => prevIds.filter(id => id !== courseId));
                    openModal('Unliked', `You unliked "${courses.find(c => c._id === courseId)?.title || 'this course'}".`);
                }
            } else {
                openModal('Action Failed', data.msg || 'Failed to update like status.');
                if (newLikedState) {
                    setLikedCourseIds(prevIds => prevIds.filter(id => id !== courseId));
                } else {
                    setLikedCourseIds(prevIds => [...prevIds, courseId]);
                }
            }
        } catch (err) {
            console.error('Like API error:', err);
            openModal('Network Error', 'Could not connect to the server to like/unlike.');
            if (newLikedState) {
                setLikedCourseIds(prevIds => prevIds.filter(id => id !== courseId));
            } else {
                setLikedCourseIds(prevIds => [...prevIds, courseId]);
            }
        }
    };

    const isEnrolled = (courseId) => enrolledCourseIds.includes(courseId);
    const isLiked = (courseId) => likedCourseIds.includes(courseId);

    const getFilteredAndSearchedCourses = (courseStatus, filterByEnrolled = false, filterByLiked = false) => {
        let filtered = courses.filter(course =>
            (course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
            course.status === courseStatus &&
            (filterType === 'all' || course.type === filterType)
        );

        if (filterByEnrolled) {
            filtered = filtered.filter(course => isEnrolled(course._id));
        }
        if (filterByLiked) {
            filtered = filtered.filter(course => isLiked(course._id));
        }

        return filtered;
    };

    const handleBackToAllCourses = () => {
        setShowEnrolledOnly(false);
        setShowLikedOnly(false);
        setFilterType('all');
        setSearchTerm('');
    };

    if (isLoading) {
        return (
            <main className="flex items-center justify-center min-h-[calc(100vh-7rem)] bg-transparent text-gray-900 dark:text-white">
                <div className="w-full max-w-6xl px-4">
                    <Skeleton variant="grid" count={6} />
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex items-center justify-center min-h-[calc(100vh-7rem)] bg-transparent text-gray-900 dark:text-white">
                <p className="text-xl text-red-655 dark:text-red-400">{error}</p>
            </main>
        );
    }

    return (
        // The main container for the entire page; allow body background to show.
        <div className="bg-transparent min-h-screen text-gray-900 dark:text-white transition-colors duration-500">
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
                
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-center bg-gradient-to-r from-teal-600 via-emerald-500 to-indigo-600 dark:from-teal-400 dark:via-emerald-300 dark:to-indigo-400 bg-clip-text text-transparent mb-6">
                     Our Computer Science Courses
                     <span className="block w-24 h-2 bg-gradient-to-r from-teal-600 to-indigo-600 mx-auto mt-4 rounded-full"></span>
                 </h1>

                <div className="flex flex-col md:flex-row items-center justify-center mb-4 gap-4">
                  <input
                    type="text"
                    placeholder="Search for courses..."
                    className="w-full max-w-lg p-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#167468] bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-955 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                    <div className="flex gap-2">
                        <button
                            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${filterType === 'all' ? 'bg-gradient-to-r from-purple-500 to-[#167468] text-white shadow-md' : 'bg-white dark:bg-white/10 text-gray-750 dark:text-white/80 hover:bg-gray-200 dark:hover:bg-white/15 border border-gray-300 dark:border-white/10'}`}
                            onClick={() => {setFilterType('all'); setShowEnrolledOnly(false); setShowLikedOnly(false);}}
                        >
                            All
                        </button>
                        <button
                            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${filterType === 'paid' ? 'bg-gradient-to-r from-purple-500 to-[#167468] text-white shadow-md' : 'bg-white dark:bg-white/10 text-gray-750 dark:text-white/80 hover:bg-gray-200 dark:hover:bg-white/15 border border-gray-300 dark:border-white/10'}`}
                            onClick={() => {setFilterType('paid'); setShowEnrolledOnly(false); setShowLikedOnly(false);}}
                        >
                            Paid
                        </button>
                        <button
                            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${filterType === 'free' ? 'bg-gradient-to-r from-purple-500 to-[#167468] text-white shadow-md' : 'bg-white dark:bg-white/10 text-gray-750 dark:text-white/80 hover:bg-gray-200 dark:hover:bg-white/15 border border-gray-300 dark:border-white/10'}`}
                            onClick={() => {setFilterType('free'); setShowEnrolledOnly(false); setShowLikedOnly(false);}}
                        >
                            Free
                        </button>
                    </div>
                </div>

                {currentUser && (
                    <div className="flex items-center justify-center gap-8 mb-4 text-lg font-semibold text-gray-900 dark:text-white/80">
                        <p>Enrolled: <span className="text-teal-600 dark:text-teal-300">{enrolledCourseIds.length}</span></p>
                        <p>Liked: <span className="text-indigo-600 dark:text-red-400">{likedCourseIds.length}</span></p>
                    </div>
                )}
                
                <div className="flex flex-wrap justify-center gap-4 mb-4">
                    {(showEnrolledOnly || showLikedOnly) && (
                        <button
                            className="px-6 py-3 rounded-xl font-bold text-lg bg-white dark:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-white/15 transition-colors duration-300 shadow-md dark:shadow-lg"
                            onClick={handleBackToAllCourses}
                        >
                            ← Back to All Courses
                        </button>
                    )}
                    {currentUser && (
                        <>
                            <button
                                className={`px-6 py-3 rounded-xl font-bold text-lg transition-all duration-300 transform ${showEnrolledOnly ? 'bg-white dark:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-855 dark:text-white scale-105 shadow-md dark:shadow-xl' : 'bg-gradient-to-r from-purple-500 to-[#167468] text-white hover:opacity-95 active:scale-95'}`}
                                onClick={() => {
                                    setShowEnrolledOnly(!showEnrolledOnly);
                                    setShowLikedOnly(false);
                                    setFilterType('all');
                                    setSearchTerm('');
                                }}
                            >
                                {showEnrolledOnly ? 'Show All Courses' : 'Show My Enrolled Courses'}
                            </button>
                            <button
                                className={`px-6 py-3 rounded-xl font-bold text-lg transition-all duration-300 transform ${showLikedOnly ? 'bg-white dark:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-855 dark:text-white scale-105 shadow-md dark:shadow-xl' : 'bg-gradient-to-r from-purple-500 to-[#167468] text-white hover:opacity-95 active:scale-95'}`}
                                onClick={() => {
                                    setShowLikedOnly(!showLikedOnly);
                                    setShowEnrolledOnly(false);
                                    setFilterType('all');
                                    setSearchTerm('');
                                }}
                            >
                                {showLikedOnly ? 'Show All Courses' : 'Show My Liked Courses'}
                            </button>
                        </>
                    )}
                </div>

                {showEnrolledOnly && (
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold text-gray-905 dark:text-white border-b-4 border-gray-200 dark:border-white/10 pb-3 mb-6">My Enrolled Courses</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {getFilteredAndSearchedCourses('running', true).length > 0 || getFilteredAndSearchedCourses('upcoming', true).length > 0 ? (
                                <>
                                    {getFilteredAndSearchedCourses('running', true).map(course => (
                                        <CourseCard
                                            key={course._id}
                                            course={course}
                                            onAction={handleAction}
                                            isEnrolled={isEnrolled(course._id)}
                                            onLikeToggle={handleLikeToggle}
                                            isLikedInitial={isLiked(course._id)}
                                        />
                                    ))}
                                    {getFilteredAndSearchedCourses('upcoming', true).map(course => (
                                        <CourseCard
                                            key={course._id}
                                            course={course}
                                            onAction={handleAction}
                                            isEnrolled={isEnrolled(course._id)}
                                            onLikeToggle={handleLikeToggle}
                                            isLikedInitial={isLiked(course._id)}
                                        />
                                    ))}
                                </>
                            ) : (
                                <p className="text-center text-gray-650 dark:text-gray-300 text-lg col-span-full">You have not enrolled in any courses yet.</p>
                            )}
                        </div>
                    </section>
                )}

                {showLikedOnly && (
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold text-gray-905 dark:text-white border-b-4 border-gray-200 dark:border-white/10 pb-3 mb-6">My Liked Courses</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {getFilteredAndSearchedCourses('running', false, true).length > 0 || getFilteredAndSearchedCourses('upcoming', false, true).length > 0 ? (
                                <>
                                    {getFilteredAndSearchedCourses('running', false, true).map(course => (
                                        <CourseCard
                                            key={course._id}
                                            course={course}
                                            onAction={handleAction}
                                            isEnrolled={isEnrolled(course._id)}
                                            onLikeToggle={handleLikeToggle}
                                            isLikedInitial={isLiked(course._id)}
                                        />
                                    ))}
                                    {getFilteredAndSearchedCourses('upcoming', false, true).map(course => (
                                        <CourseCard
                                            key={course._id}
                                            course={course}
                                            onAction={handleAction}
                                            isEnrolled={isEnrolled(course._id)}
                                            onLikeToggle={handleLikeToggle}
                                            isLikedInitial={isLiked(course._id)}
                                        />
                                    ))
                                }
                                </>
                            ) : (
                                <p className="text-center text-gray-655 dark:text-gray-300 text-lg col-span-full">You have not liked any courses yet.</p>
                            )}
                        </div>
                    </section>
                )}

                {!showEnrolledOnly && !showLikedOnly && (
                    <>
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold text-gray-905 dark:text-white border-b-4 border-gray-200 dark:border-white/10 pb-3 mb-6">Running Courses</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {getFilteredAndSearchedCourses('running').length > 0 ? (
                                    getFilteredAndSearchedCourses('running').map(course => (
                                        <CourseCard
                                            key={course._id}
                                            course={course}
                                            onAction={handleAction}
                                            isEnrolled={isEnrolled(course._id)}
                                            onLikeToggle={handleLikeToggle}
                                            isLikedInitial={isLiked(course._id)}
                                        />
                                    ))
                                ) : (
                                    <p className="text-center text-gray-655 dark:text-gray-300 text-lg col-span-full">No running courses found matching your search and filter criteria.</p>
                                )}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold text-gray-905 dark:text-white border-b-4 border-gray-200 dark:border-white/10 pb-3 mb-6">Upcoming Courses</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {getFilteredAndSearchedCourses('upcoming').length > 0 ? (
                                    getFilteredAndSearchedCourses('upcoming').map(course => (
                                        <CourseCard
                                            key={course._id}
                                            course={course}
                                            onAction={handleAction}
                                            isEnrolled={isEnrolled(course._id)}
                                            onLikeToggle={handleLikeToggle}
                                            isLikedInitial={isLiked(course._id)}
                                        />
                                    ))
                                ) : (
                                    <p className="text-center text-gray-655 dark:text-gray-300 text-lg col-span-full">No upcoming courses found matching your search and filter criteria.</p>
                                )}
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
};

export default CoursesPage;
