
// src/components/ForumPage.jsx
import React, { useState, useEffect, useCallback, Fragment } from 'react';
import './ForumPage.css'; // Keep this for custom styles that are not in Tailwind
import { useTheme } from '../contexts/ThemeContext';
import Skeleton from './Skeleton';
import UserCarousel from './UserCarousel';
// Lucide React Icons
import {
    Heart,
    Reply,
    Search,
    MessageSquare,
    HelpCircle,
    Bug,
    Lightbulb,
    PlusCircle,
    Send,
    Award,
    ChevronDown,
    ChevronUp,
    X,
    Filter
} from 'lucide-react';

// Import hooks from contexts (assuming these contexts are provided)
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { ForumProvider, useForumContext } from '../contexts/ForumContext';


// Import ReactMarkdown and related components via window object (assuming CDN load)
const ReactMarkdown = window.ReactMarkdown;
const RemarkGfm = window.remarkGfm;
const SyntaxHighlighter = window.SyntaxHighlighter ? window.SyntaxHighlighter.Prism : null;
const dracula = window.SyntaxHighlighter && window.SyntaxHighlighter.styles ? window.SyntaxHighlighter.styles.prism.dracula : null;

// Base URL for your backend API
// const API_BASE_URL = 'http://localhost:3001/api';
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;
// --- Helper Functions ---
/**
 * A simple hashing function to generate a color from a string.
 * Used for user avatars.
 * @param {string} str The string to hash.
 * @returns {string} A hex color code.
 */
const stringToColor = (str) => {
    if (!str) return '#cccccc';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
};

/**
 * Formats a Date object into a readable string.
 * @param {Date} date The Date object.
 * @returns {string} A formatted date and time string.
 */
const formatDate = (date) => {
    if (!date) return 'Just now';
    const d = date instanceof Date ? date : (date && typeof date.toDate === 'function' ? date.toDate() : new Date(date));
    const now = new Date();
    const diffMinutes = Math.floor((now - d) / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// --- Custom Modal Component (for confirmations/alerts) ---
const CustomModal = ({ show, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out opacity-100">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform scale-100 transition-transform duration-300 ease-in-out">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    {onConfirm && (
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Custom renderer for code blocks in ReactMarkdown to apply syntax highlighting.
 */
const CodeBlock = ({ inline, className, children }) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    if (inline) {
        return <code className="bg-gray-200 rounded px-1 py-0.5 text-red-600">{children}</code>;
    }

    return (
        // Only render SyntaxHighlighter if it's available
        SyntaxHighlighter && dracula ? (
            <SyntaxHighlighter
                style={dracula} // Using the dracula theme
                language={language}
                PreTag="div" // Render as a div instead of pre
                className="rounded-lg p-4 overflow-x-auto my-4"
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        ) : (
            <pre className="bg-gray-800 text-white rounded-lg p-4 overflow-x-auto my-4"><code>{children}</code></pre> // Fallback
        )
    );
};


/**
 * Displays a single forum post or reply.
 * No props drilling - uses ForumContext for handlers and currentUser
 */
const Post = ({ post, onToggleReplies, numReplies, isRepliesVisible, isAuthorOfParent, parentSolutionId }) => {
    const { openModal } = useModal();
    const { currentUser, showToast, onReply, onLike, onMarkAsSolution } = useForumContext();
    // `post.userId` may be populated (object) or a string id. Prefer populated info when available.
    const author = post.userId && typeof post.userId === 'object' ? post.userId : null;
    const displayUserId = author ? (author.username || author._id) : post.userId;
    const authorRole = author ? author.role : null;
    const userColor = stringToColor(displayUserId);
    const avatarInitial = displayUserId ? String(displayUserId).substring(0, 2).toUpperCase() : 'AN';
    const likedByCurrentUser = post.likedBy && currentUser && post.likedBy.includes(currentUser.id);

    const isSolution = parentSolutionId && parentSolutionId === post._id;

    const categoryIcons = {
        discussion: <MessageSquare size={14} className="mr-1" />,
        question: <HelpCircle size={14} className="mr-1" />,
        bug: <Bug size={14} className="mr-1" />,
        feature: <Lightbulb size={14} className="mr-1" />,
    };

    const handleLikeClick = () => {
        if (!currentUser) {
            showToast('You must be logged in to like posts.', 'info');
            return;
        }
        onLike(post._id, likedByCurrentUser);
    };

    const handleMarkAsSolutionClick = () => {
        if (!currentUser) {
            showToast('You must be the post author to mark a solution.', 'error');
            return;
        }
        onMarkAsSolution(post.parentId, post._id);
    };

    const handleReplyClick = () => {
        if (!currentUser) {
            showToast('You must be logged in to reply to posts.', 'info');
            return;
        }
        onReply(post._id);
    };

    const staffHighlightClass = authorRole === 'staff' ? 'bg-yellow-50 border-l-4 border-yellow-300' : '';

    return (
        <div className={`flex items-start space-x-4 p-6 rounded-xl transition-all duration-300 ${isSolution ? 'post-card-solution-border' : 'bg-gray-50'} ${staffHighlightClass}`}>
            <div
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: userColor }}
                title={`User ID: ${displayUserId}`}
            >
                {avatarInitial}
            </div>
            <div className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-lg font-semibold text-gray-900 flex items-center flex-wrap gap-2">
                        {post.title || <span className="text-base font-medium">Reply by {String(displayUserId).substring(0, 8)}...</span>}
                        {post.category && !post.parentId && (
                            <span className="flex items-center text-xs font-medium bg-gray-200 text-gray-600 rounded-full px-2 py-1">
                                {categoryIcons[post.category]} {post.category}
                            </span>
                        )}
                        {/* Staff badge */}
                        {authorRole === 'staff' && (
                            <span className="ml-2 inline-flex items-center text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 0 0-.364 1.118l1.286 3.95c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.37 2.448c-.784.57-1.84-.197-1.54-1.118l1.286-3.95a1 1 0 0 0-.364-1.118L2.642 9.377c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.95z"/></svg>
                                Staff
                            </span>
                        )}
                        {isSolution && (
                            <span className="flex items-center text-xs font-medium bg-teal-100 text-teal-600 rounded-full px-2 py-1">
                                <Award size={14} className="mr-1" /> Solution
                            </span>
                        )}
                    </p>
                    <div className="flex flex-col items-end">
                        <span className="text-sm text-gray-500 whitespace-nowrap">{formatDate(post.createdAt)}</span>
                        <span className="text-xs text-gray-500">By: {author && (author.username || (author._id ? String(author._id).slice(0,8) : 'Unknown')) || (post.userId || 'Unknown')}</span>
                    </div>
                </div>
                <div className="markdown-content text-gray-700">
                    {ReactMarkdown && RemarkGfm && SyntaxHighlighter && dracula ? (
                        <ReactMarkdown
                            remarkPlugins={[RemarkGfm]}
                            components={{
                                code: CodeBlock,
                                p: ({node, ...props}) => <p {...props} className="text-gray-700 my-2" />,
                                li: ({node, ...props}) => <li {...props} className="text-gray-700 ml-5 list-disc" />,
                                ul: ({node, ...props}) => <ul {...props} className="mb-2" />,
                                ol: ({node, ...props}) => <ol {...props} className="mb-2 list-decimal" />,
                                a: ({node, ...props}) => <a {...props} className="text-teal-600 hover:underline" />,
                                h1: ({node, ...props}) => <h1 {...props} className="text-2xl font-bold mb-2 mt-4" />,
                                h2: ({node, ...props}) => <h2 {...props} className="text-xl font-semibold mb-2 mt-3" />,
                                h3: ({node, ...props}) => <h3 {...props} className="text-lg font-medium mb-1 mt-2" />,
                            }}
                        >
                            {post.content}
                        </ReactMarkdown>
                    ) : (
                        <p className="text-gray-700">{post.content}</p>
                    )}
                </div>
                {post.imageUrl && (
                    <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
                        <img
                            src={post.imageUrl}
                            alt="Attached"
                            className="w-full h-auto object-cover max-h-96"
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x200/cccccc/000000?text=Image+Load+Error'; }}
                        />
                    </div>
                )}
                {post.tags && post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {post.tags.map((tag, index) => (
                            <span key={index} className="bg-teal-100 text-teal-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                {/* Conditionally render actions for top-level posts */}
                {!post.parentId && (
                    <div className="mt-4 flex items-center space-x-4">
                        <button
                            onClick={handleLikeClick}
                            className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${likedByCurrentUser ? 'bg-teal-500 text-white hover:bg-teal-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            title={likedByCurrentUser ? "Unlike" : "Like"}
                            disabled={!currentUser}
                        >
                            <Heart size={16} className="mr-2" fill={likedByCurrentUser ? 'currentColor' : 'none'} stroke={likedByCurrentUser ? 'currentColor' : 'currentColor'} />
                            <span>{post.likes || 0}</span>
                        </button>
                        <button
                            onClick={handleReplyClick}
                            className="flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                            disabled={!currentUser}
                        >
                            <Reply size={16} className="mr-2" /> Reply
                        </button>
                        {numReplies > 0 && (
                            <button
                                onClick={() => onToggleReplies(post._id)}
                                className="flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                            >
                                {isRepliesVisible ? `Hide ${numReplies} Replies` : `View ${numReplies} Replies`}
                                {isRepliesVisible ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
                            </button>
                        )}
                    </div>
                )}
                {/* Conditionally render actions for replies */}
                {post.parentId && (
                    <div className="mt-4 flex items-center space-x-4">
                        <button
                            onClick={handleLikeClick}
                            className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${likedByCurrentUser ? 'bg-teal-500 text-white hover:bg-teal-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            title={likedByCurrentUser ? "Unlike" : "Like"}
                            disabled={!currentUser}
                        >
                            <Heart size={16} className="mr-2" fill={likedByCurrentUser ? 'currentColor' : 'none'} stroke={likedByCurrentUser ? 'currentColor' : 'currentColor'} />
                            <span>{post.likes || 0}</span>
                        </button>
                        {isAuthorOfParent && !parentSolutionId && (
                            <button
                                onClick={handleMarkAsSolutionClick}
                                className="flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white bg-green-500 hover:bg-green-600 transition-colors"
                                title="Mark as solution"
                                disabled={!currentUser}
                            >
                                <Award size={16} className="mr-2" /> Mark as Solution
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * The main Forum Page component.
 */
const ForumPage = () => {
    // Use hooks to access context values
    
    const { currentUser } = useAuth();
    const { openModal } = useModal();
    const showToast = useToast();
    const { theme, toggleTheme } = useTheme();

    const [message, setMessage] = useState({ type: '', text: '' });
    const currentUserId = currentUser?.id;
    const isLoggedIn = !!currentUser;
    const userToken = currentUser?.token;

    const [allPosts, setAllPosts] = useState([]);
    const [posts, setPosts] = useState([]);

    const [newPostContent, setNewPostContent] = useState('');
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostImage, setNewPostImage] = useState('');
    const [newPostCategory, setNewPostCategory] = useState('discussion');
    const [newPostTags, setNewPostTags] = useState('');

    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [replyImage, setReplyImage] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const [showCancelReplyModal, setShowCancelReplyModal] = useState(false);
    const [visibleReplies, setVisibleReplies] = useState({});

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterTag, setFilterTag] = useState('');
    const [isAdvancedFilterExpanded, setIsAdvancedFilterExpanded] = useState(false);
    const [isNewPostFormVisible, setIsNewPostFormVisible] = useState(false);
    const [staffSolutionsOnly, setStaffSolutionsOnly] = useState(false);
    const [paidCourses, setPaidCourses] = useState([]);

    // (Forum Premium subscription UI moved to HomePage) — CTA below

    // Fetch paid courses for subscription section
    const fetchPaidCourses = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/public/courses`);
            const data = await response.json();
            if (response.ok) {
                // Filter only paid courses with running status
                const paid = data.filter(course => course.type === 'paid' && course.status === 'running');
                setPaidCourses(paid.slice(0, 6)); // Show top 6 paid courses
            }
        } catch (err) {
            console.error('Error fetching paid courses:', err);
        }
    }, []);

    // Fetch forum posts from backend
    const fetchForumPosts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/public/forum-posts`);
            const data = await response.json();
            if (response.ok) {
                setAllPosts(data);
            } else {
                throw new Error(data.msg || 'Failed to fetch forum posts.');
            }
        } catch (err) {
            console.error('Error fetching forum posts:', err);
            setError('Failed to load forum posts. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchForumPosts();
        fetchPaidCourses();
    }, [fetchForumPosts, fetchPaidCourses]);

    // Apply filtering logic whenever dependencies change
    useEffect(() => {
        let filtered = allPosts;

        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(post => {
                // Derive author name (post.userId may be populated object or a raw id string)
                const authorName = post.userId && typeof post.userId === 'object' ? (post.userId.username || '') : (post.userId || '');
                return (
                    (post.title && post.title.toLowerCase().includes(lowerCaseSearchTerm)) ||
                    (post.content && post.content.toLowerCase().includes(lowerCaseSearchTerm)) ||
                    (authorName && authorName.toLowerCase().includes(lowerCaseSearchTerm)) ||
                    (post.tags && post.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm)))
                );
            });
        }

        if (filterCategory !== 'all') {
            filtered = filtered.filter(post => !post.parentId && post.category === filterCategory);
        } else {
            filtered = filtered.filter(post => !post.parentId);
        }

        if (filterTag) {
            const lowerCaseFilterTag = filterTag.toLowerCase();
            filtered = filtered.filter(post =>
                post.tags && post.tags.some(tag => tag.toLowerCase().includes(lowerCaseFilterTag))
            );
        }

        // If the Staff Solutions filter is enabled, only include top-level posts
        // that have a solution reply authored by a user with role 'staff'.
        if (staffSolutionsOnly) {
            filtered = filtered.filter(post => {
                const solutionId = post.solutionId;
                if (!solutionId) return false;
                const solutionReply = allPosts.find(p => p._id === solutionId);
                // Support multiple shapes: populated `author` object or legacy `userId`/`user` fields
                return !!(solutionReply && (
                    (solutionReply.author && solutionReply.author.role === 'staff') ||
                    (solutionReply.user && solutionReply.user.role === 'staff') ||
                    (solutionReply.userRole === 'staff')
                ));
            });
        }

        const sortedTopLevelPosts = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const finalDisplayPosts = [];
        sortedTopLevelPosts.forEach(post => {
            finalDisplayPosts.push(post);
            const replies = allPosts.filter(p => p.parentId === post._id).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            if (visibleReplies[post._id]) {
                replies.forEach(reply => finalDisplayPosts.push(reply));
            }
        });

        setPosts(finalDisplayPosts);
    }, [searchTerm, filterCategory, filterTag, allPosts, visibleReplies]);

    // Effect to clear success messages after a delay
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Simulate image upload for demo
    const simulateImageUpload = async (imageFile) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTimeout(() => {
                    resolve(reader.result);
                }, 500);
            };
            reader.onerror = () => {
                showToast('Failed to read image file.', 'error');
                resolve(null);
            };
            reader.readAsDataURL(imageFile);
        });
    };

    // --- Event Handlers ---
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);

    // Fetch subscription status
    const fetchSubscriptionStatus = useCallback(async () => {
        if (!isLoggedIn) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/user/subscription/status`, {
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                setSubscriptionStatus(data.subscription);
            }
        } catch (err) {
            console.error('Error fetching subscription status:', err);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        fetchSubscriptionStatus();
    }, [fetchSubscriptionStatus]);

    // NOTE: Forum Premium subscription is now managed on the HomePage. The UI here shows a small CTA
    // directing users to the Home page where they can subscribe.

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setIsSubmitting(true);

        if (!isLoggedIn) {
            showToast('You must be logged in to create a post.', 'info');
            setIsSubmitting(false);
            return;
        }

        // Check subscription status for posting access
        if (subscriptionStatus && subscriptionStatus.plan === 'free' && subscriptionStatus.status === 'active') {
            openModal(
                'Subscription Required', 
                'To post in the forum, please subscribe to one of our plans. Visit the Dashboard to see available plans.',
                () => {
                    // Optionally redirect to dashboard or pricing section
                    window.location.href = '/admin-dashboard';
                }
            );
            setIsSubmitting(false);
            return;
        }

        // Also check if subscription is expired
        if (subscriptionStatus && subscriptionStatus.status === 'expired') {
            openModal(
                'Subscription Expired', 
                'Your subscription has expired. Please renew your subscription to continue posting in the forum.',
                () => {
                    window.location.href = '/admin-dashboard';
                }
            );
            setIsSubmitting(false);
            return;
        }

        if (!newPostTitle.trim() || !newPostContent.trim()) {
            setMessage({ type: 'error', text: "Please fill in both title and content for your post." });
            setIsSubmitting(false);
            return;
        }

        let uploadedImageUrl = null;
        if (newPostImage) {
            uploadedImageUrl = newPostImage; // Use the URL directly for simplicity
        }

        const tagsArray = newPostTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

        const postData = {
            title: newPostTitle.trim(),
            content: newPostContent.trim(),
            imageUrl: uploadedImageUrl,
            category: newPostCategory,
            tags: tagsArray,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/forum-posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(postData),
            });
            const data = await response.json();

            if (response.ok) {
                setSuccessMessage("Post created successfully!");
                setNewPostTitle('');
                setNewPostContent('');
                setNewPostImage('');
                setNewPostCategory('discussion');
                setNewPostTags('');
                fetchForumPosts();
                setIsNewPostFormVisible(false);
            } else {
                setMessage({ type: 'error', text: data.msg || 'Failed to create post.' });
            }
        } catch (error) {
            console.error('Post creation API error:', error);
            setMessage({ type: 'error', text: 'Network error or server unavailable. Failed to create post.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReplySubmit = async (e, parentPostId) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setIsSubmitting(true);

        if (!isLoggedIn) {
            showToast('You must be logged in to reply.', 'info');
            setIsSubmitting(false);
            return;
        }

        if (!replyContent.trim()) {
            setMessage({ type: 'error', text: "Please provide content for your reply." });
            setIsSubmitting(false);
            return;
        }

        let uploadedImageUrl = null;
        if (replyImage) {
            uploadedImageUrl = replyImage;
        }

        const replyData = {
            content: replyContent.trim(),
            imageUrl: uploadedImageUrl,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/forum-posts/${parentPostId}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(replyData),
            });
            const data = await response.json();

            if (response.ok) {
                setSuccessMessage("Reply sent successfully!");
                setReplyContent('');
                setReplyImage('');
                setReplyingTo(null);
                fetchForumPosts();
                setVisibleReplies(prev => ({ ...prev, [parentPostId]: true }));
            } else {
                setMessage({ type: 'error', text: data.msg || 'Failed to send reply.' });
            }
        } catch (error) {
            console.error('Reply API error:', error);
            setMessage({ type: 'error', text: 'Network error or server unavailable. Failed to send reply.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLike = async (postId, currentlyLiked) => {
        setMessage({ type: '', text: '' });
        if (!isLoggedIn) {
            showToast('You must be logged in to like posts.', 'info');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/forum-posts/like/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(data.msg);
                setAllPosts(prevPosts => prevPosts.map(post => {
                    if (post._id === data.postId) {
                        return { ...post, likes: data.likes, likedBy: data.likedBy };
                    }
                    return post;
                }));
            } else {
                setMessage({ type: 'error', text: data.msg || 'Failed to update like status.' });
            }
        } catch (error) {
            console.error('Like API error:', error);
            setMessage({ type: 'error', text: 'Network error or server unavailable.' });
        }
    };

    const handleMarkAsSolution = async (parentPostId, solutionReplyId) => {
        setMessage({ type: '', text: '' });
        if (!isLoggedIn) {
            showToast('You must be logged in to mark solutions.', 'info');
            return;
        }
        const parentPost = allPosts.find(p => p._id === parentPostId);
        if (!parentPost) {
            showToast('You can only mark a solution for your own top-level posts.', 'error');
            return;
        }
        // post.userId may be populated object or an id string — normalize for comparison
        const parentAuthorId = parentPost.userId && typeof parentPost.userId === 'object' ? String(parentPost.userId._id) : String(parentPost.userId);
        if (parentAuthorId !== String(currentUserId)) {
            showToast('You can only mark a solution for your own top-level posts.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/forum-posts/mark-solution/${parentPostId}/${solutionReplyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(data.msg);
                setAllPosts(prevPosts => prevPosts.map(post => {
                    if (post._id === data.postId) {
                        return { ...post, solutionId: data.solutionId };
                    }
                    return post;
                }));
            } else {
                setMessage({ type: 'error', text: data.msg || 'Failed to mark solution.' });
            }
        } catch (error) {
            console.error('Mark solution API error:', error);
            setMessage({ type: 'error', text: 'Network error or server unavailable.' });
        }
    };

    const startReply = (postId) => {
        setReplyingTo(postId);
        setReplyContent('');
        setReplyImage('');
        setVisibleReplies(prev => ({ ...prev, [postId]: true }));
    };

    const confirmCancelReply = () => {
        if (replyContent.trim() !== '' || replyImage) {
            setShowCancelReplyModal(true);
        } else {
            setReplyingTo(null);
        }
    };

    const cancelReplyAction = () => {
        setShowCancelReplyModal(false);
        setReplyingTo(null);
        setReplyContent('');
        setReplyImage('');
    };

    const handleToggleReplies = (postId) => {
        setVisibleReplies(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    const toggleAdvancedFilterExpanded = () => {
        setIsAdvancedFilterExpanded(prev => !prev);
    };

    const toggleNewPostFormVisibility = () => {
        setIsNewPostFormVisible(prev => !prev);
        if (isNewPostFormVisible) {
            setNewPostTitle('');
            setNewPostContent('');
            setNewPostImage('');
            setNewPostCategory('discussion');
            setNewPostTags('');
        }
    };

    const getReplies = (postId) => allPosts.filter(p => p.parentId === postId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const [topContributors, setTopContributors] = useState([]);
    const [showTopContributorsMobile, setShowTopContributorsMobile] = useState(false);
    const [showPaidCoursesMobile, setShowPaidCoursesMobile] = useState(false);
    const [showPremiumMobile, setShowPremiumMobile] = useState(false);

    // Fetch top contributors from backend
    const fetchTopContributors = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/public/forum-posts/top-contributors?limit=6`);
            const data = await response.json();
            if (response.ok) {
                setTopContributors(data);
            } else {
                console.error('Failed to fetch top contributors:', data.msg);
                // Fallback to empty array if fetch fails
                setTopContributors([]);
            }
        } catch (err) {
            console.error('Error fetching top contributors:', err);
            setTopContributors([]);
        }
    }, []);

    useEffect(() => {
        fetchTopContributors();
    }, [fetchTopContributors]);
    
    const forumHandlers = {
        onReply: startReply,
        onLike: handleLike,
        onMarkAsSolution: handleMarkAsSolution,
        onToggleReplies: handleToggleReplies,
    };

    return (
        <ForumProvider forumHandlers={forumHandlers}>
            <div className="min-h-screen bg-transparent text-gray-900 font-sans antialiased dark:bg-transparent dark:text-gray-100">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Forum Header Section */}
                <div className="lg:col-span-3">
                    <header className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-teal-500 w-12 h-12"
                            >
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <circle cx="8" cy="8" r="2" fill="currentColor" />
                                <circle cx="16" cy="8" r="2" fill="currentColor" />
                                <circle cx="8" cy="16" r="2" fill="currentColor" />
                                <circle cx="16" cy="16" r="2" fill="currentColor" />
                                <path d="M8 8L16 16M16 8L8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Forum</h1>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button 
                                onClick={toggleNewPostFormVisibility} 
                                className="flex items-center justify-center px-4 py-2 text-white bg-teal-500 hover:bg-teal-600 rounded-lg shadow-md transition-colors font-medium disabled:bg-gray-400" 
                                disabled={!isLoggedIn || (subscriptionStatus && subscriptionStatus.plan === 'free' && subscriptionStatus.status === 'active')}
                                title={!isLoggedIn ? 'Please login' : (subscriptionStatus && subscriptionStatus.plan === 'free' && subscriptionStatus.status === 'active') ? 'Subscription required to post' : 'Create a post'}
                            >
                                <PlusCircle size={20} className="mr-2" /> 
                                {!isLoggedIn 
                                    ? 'Login to Post' 
                                    : (subscriptionStatus && subscriptionStatus.plan === 'free' && subscriptionStatus.status === 'active')
                                        ? 'Subscribe to Post'
                                        : 'Ask a Question'
                                }
                            </button>
                            {isLoggedIn ? (
                                <p className="text-sm text-gray-500 hidden lg:block"> <span className="font-semibold text-teal-600">{currentUser.username}</span></p>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-100 hidden lg:block">Log in to interact.</p>
                            )}
                        </div>
                    </header>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-100 my-4 space-x-1">
                        <a href="#home" onClick={(e) => e.preventDefault()} className="hover:underline">Home</a>
                        <span>/</span>
                        <a href="#forum" onClick={(e) => e.preventDefault()} className="hover:underline">Forum</a>
                        <span>/</span>
                        <span className="font-medium">Discussion</span>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2">
                    {error && (
                        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg" role="status">
                            {successMessage}
                        </div>
                    )}
                    
                    {/* New Post Form */}
                    {isNewPostFormVisible && (
                        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                            <div className="flex items-center justify-between mb-4 border-b pb-4 border-gray-200">
                                <h2 className="text-xl font-semibold">Create a New Post</h2>
                                <button onClick={toggleNewPostFormVisibility} className="flex items-center text-gray-500 hover:text-gray-700 transition-colors">
                                    <X size={18} className="mr-1" /> Close
                                </button>
                            </div>
                            <form onSubmit={handlePostSubmit} className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        value={newPostTitle}
                                        onChange={(e) => setNewPostTitle(e.target.value)}
                                        placeholder="Post Title"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <textarea
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        placeholder="What's on your mind? (Markdown supported for code blocks: ```js\nconsole.log('hello');\n```)"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                                        rows="6"
                                        required
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="newPostCategory" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select
                                            id="newPostCategory"
                                            value={newPostCategory}
                                            onChange={(e) => setNewPostCategory(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                                        >
                                            <option value="discussion">Discussion</option>
                                            <option value="question">Question</option>
                                            <option value="bug">Bug Report</option>
                                            <option value="feature">Feature Request</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="newPostTags" className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                                        <input
                                            id="newPostTags"
                                            type="text"
                                            value={newPostTags}
                                            onChange={(e) => setNewPostTags(e.target.value)}
                                            placeholder="e.g., react, firebase, ui"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="newPostImageInput" className="block text-sm font-medium text-gray-700 mb-1">Attach Image URL (Optional)</label>
                                    <input
                                        id="newPostImageInput"
                                        type="text"
                                        value={newPostImage}
                                        onChange={(e) => setNewPostImage(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center px-4 py-2 text-white bg-teal-500 hover:bg-teal-600 rounded-lg shadow-md transition-colors font-medium disabled:bg-gray-400"
                                    disabled={isSubmitting || !isLoggedIn}
                                >
                                    {isSubmitting ? (
                                        <><Send size={20} className="mr-2 animate-pulse" /> Posting...</>
                                    ) : (
                                        <><PlusCircle size={20} className="mr-2" /> Post Discussion</>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Search and Filter Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search discussions..."
                                    className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 dark:bg-gray-100 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                                />
                                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                            <button onClick={toggleAdvancedFilterExpanded} className="flex items-center justify-center p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
                                <Filter size={20} />
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                            <span className="truncate text-gray-400 dark:text-gray-100">DISPLAYING {posts.length} OUT OF {allPosts.filter(p => !p.parentId).length} DISCUSSIONS</span>
                            <div className="flex items-center space-x-2">
                                <label htmlFor="filter-category" className="sr-only">Filter by Category</label>
                                <select
                                    id="filter-category"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 text-sm"
                                >
                                    <option value="all">All Topics</option>
                                    <option value="discussion">Discussion</option>
                                    <option value="question">Question</option>
                                    <option value="bug">Bug Report</option>
                                    <option value="feature">Feature Request</option>
                                </select>
                            </div>
                        </div>

                        {isAdvancedFilterExpanded && (
                            <div className="mt-4 border-t pt-4 border-gray-200">
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="filter-tag" className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">Filter by Tag</label>
                                        <input
                                            id="filter-tag"
                                            type="text"
                                            value={filterTag}
                                            onChange={(e) => setFilterTag(e.target.value)}
                                            placeholder="e.g., react"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Discussion Feed */}
                    <div className="space-y-6">
                        {isLoading ? (
                            <div className="p-4">
                                <Skeleton variant="list" count={4} />
                            </div>
                        ) : (
                            posts.length > 0 ? (
                                posts.map(post => (
                                    <Fragment key={post._id}>
                                        <div className={!post.parentId ? "bg-white rounded-xl shadow-lg" : "relative ml-8 sm:ml-16 before:content-[''] before:absolute before:top-0 before:left-[-24px] before:w-[2px] before:h-full before:bg-gray-300"}>
                                            <Post
                                                post={post}
                                                onToggleReplies={handleToggleReplies}
                                                numReplies={getReplies(post._id).length}
                                                isRepliesVisible={visibleReplies[post._id]}
                                                isAuthorOfParent={!!post.parentId ? (allPosts.find(p => p._id === post.parentId)?.userId === currentUserId) : false}
                                                parentSolutionId={!!post.parentId ? (allPosts.find(p => p._id === post.parentId)?.solutionId) : null}
                                            />
                                        </div>
                                        {replyingTo === post._id && (
                                            <div className="mt-4 p-4 ml-8 sm:ml-16 bg-gray-50 rounded-lg shadow-inner">
                                                <form onSubmit={(e) => handleReplySubmit(e, post._id)} className="space-y-4">
                                                    <textarea
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        placeholder="Write a reply... (Markdown supported)"
                                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                                                        rows="2"
                                                        required
                                                        autoFocus
                                                    ></textarea>
                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={replyImage}
                                                            onChange={(e) => setReplyImage(e.target.value)}
                                                            placeholder="Attach an image URL (optional)"
                                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end space-x-2">
                                                        <button type="button" onClick={confirmCancelReply} className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors">
                                                            <X size={16} className="mr-2" /> Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-teal-500 hover:bg-teal-600 transition-colors disabled:bg-gray-400"
                                                            disabled={isSubmitting || !isLoggedIn}
                                                        >
                                                            {isSubmitting ? (
                                                                <><Send size={16} className="mr-2 animate-pulse" /> Sending...</>
                                                            ) : (
                                                                <><Send size={16} className="mr-2" /> Submit Reply</>
                                                            )}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                        {/* This is the key change to conditionally render replies */}
                                        {visibleReplies[post._id] && getReplies(post._id).length > 0 && (
                                            <div className="space-y-6 ml-8 sm:ml-16">
                                                {getReplies(post._id).map(reply => (
                                                    <div key={reply._id} className="relative before:content-[''] before:absolute before:top-0 before:left-[-24px] before:w-[2px] before:h-full before:bg-gray-300">
                                                        <Post
                                                            post={reply}
                                                            onReply={startReply}
                                                            onLike={handleLike}
                                                            currentUser={currentUser}
                                                            onMarkAsSolution={handleMarkAsSolution}
                                                            isAuthorOfParent={post.userId === currentUserId}
                                                            parentSolutionId={post.solutionId}
                                                            onToggleReplies={handleToggleReplies}
                                                            numReplies={0} // Replies don't have nested replies
                                                            isRepliesVisible={false}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Fragment>
                                ))
                            ) : (
                                <div className="text-center p-8 text-gray-500">
                                    <p>No discussions found. Be the first to start one!</p>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Paid Courses Section */}
                        {/* Mobile toggle for Forum Premium (collapse on small screens) */}
                        <button
                            className="sidebar-toggle-button lg:hidden w-full text-left mb-2 p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                            onClick={() => setShowPremiumMobile(prev => !prev)}
                            aria-expanded={showPremiumMobile}
                        >
                            {showPremiumMobile ? 'Hide Forum Premium' : 'Show Forum Premium'}
                        </button>

                        <div className={`${showPremiumMobile ? 'block' : 'hidden'} lg:block bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6 border border-gray-100 dark:border-gray-700 text-center`}>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Forum Premium</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">Want to post questions and replies without limits? Visit our Home page to subscribe to Forum Premium.</p>
                                <div className="mt-3">
                                    <a href="/" className="inline-block px-4 py-2 rounded-md bg-teal-600 text-white font-medium">View plans on Home</a>
                                </div>
                            </div>

                            {/* Mobile toggle for Paid Courses (collapse on small screens) */}
                            <button
                                className="sidebar-toggle-button lg:hidden w-full text-left mb-2 p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                                onClick={() => setShowPaidCoursesMobile(prev => !prev)}
                                aria-expanded={showPaidCoursesMobile}
                            >
                                {showPaidCoursesMobile ? 'Hide Premium Courses' : 'Show Premium Courses'}
                            </button>

                            {paidCourses.length > 0 && (
                                <div className={`${showPaidCoursesMobile ? 'block' : 'hidden'} lg:block bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg`}>
                                <h2 className="text-xl font-semibold mb-2 border-b pb-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                                    💎 Premium Courses
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                    Explore our paid content and join discussions
                                </p>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {paidCourses.map(course => (
                                        <div 
                                            key={course._id} 
                                            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-500 transition-colors cursor-pointer group"
                                            onClick={() => setSearchTerm(course.title)}
                                        >
                                            <div className="flex items-start space-x-3">
                                                {course.imageUrl ? (
                                                    <img 
                                                        src={course.imageUrl} 
                                                        alt={course.title}
                                                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white font-bold text-lg">📚</span>
                                                    </div>
                                                )}
                                                <div className="flex-grow min-w-0">
                                                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 truncate">
                                                        {course.title}
                                                    </h3>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                                                            {course.price}
                                                        </span>
                                                        {course.rating && (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                                                ⭐ {course.rating.toFixed(1)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    {/* Top Contributors Sidebar */}
                    {/* Mobile toggle to show/hide top contributors on small screens */}
                    <button
                        className="lg:hidden w-full text-left mb-2 p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                        onClick={() => setShowTopContributorsMobile(prev => !prev)}
                        aria-expanded={showTopContributorsMobile}
                    >
                        {showTopContributorsMobile ? 'Hide Top Contributors' : 'Show Top Contributors'}
                    </button>

                    <div className={`${showTopContributorsMobile ? 'block' : 'hidden'} lg:block bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg`}>
                        <h2 className="text-xl font-semibold mb-2 border-b pb-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">Top Contributors</h2>
                        <p className="text-gray-600 text-sm mb-4">
                            People who started the most discussions on LearnBent.
                        </p>
                        <ul className="space-y-4">
                            {topContributors.length > 0 ? (
                                topContributors.map(contributor => (
                                    <li key={contributor.id} className="flex items-center space-x-3">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                            style={{ backgroundColor: stringToColor(contributor.id || contributor.name) }}
                                        >
                                            {contributor.profilePicture ? (
                                                <img src={normalizeImageSrc(contributor.profilePicture)} alt={contributor.name} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                contributor.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2)
                                            )}
                                        </div>
                                        <div className="flex-grow flex items-center justify-between">
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{contributor.name}</span>
                                            <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                {contributor.discussions} <MessageSquare size={16} className="ml-1" />
                                            </span>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No contributors yet</li>
                            )}
                        </ul>
                    </div>
                    {/* User Carousel: list of all users & staff with follow buttons */}
                    <div>
                        {/* Lazy load the UserCarousel to avoid large initial bundle if desired */}
                        {/* We import dynamically to keep bundle small */}
                        {/* eslint-disable-next-line react/jsx-no-undef */}
                        <React.Suspense fallback={<div className="p-4 text-center text-sm text-gray-500">Loading people...</div>}>
                            <UserCarousel />
                        </React.Suspense>
                    </div>
                </div>
            </div>
            <CustomModal
                show={showCancelReplyModal}
                title="Discard Reply?"
                message="You have unsaved changes in your reply. Do you want to discard them?"
                onConfirm={cancelReplyAction}
                onCancel={() => setShowCancelReplyModal(false)}
                confirmText="Discard"
            />
            </div>
        </ForumProvider>
    );
};

export default ForumPage;




