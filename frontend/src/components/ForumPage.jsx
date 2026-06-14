
// src/components/ForumPage.jsx
import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Skeleton from './Skeleton';
import UserCarousel from './UserCarousel';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    Filter,
    Share2,
    Link2,
    Twitter,
    Linkedin,
    Instagram,
    MessageCircle,
    Bookmark
} from 'lucide-react';

// Import hooks from contexts (assuming these contexts are provided)
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { ForumProvider, useForumContext } from '../contexts/ForumContext';
import { normalizeImageSrc } from '../utils/image';


// Import ReactMarkdown and related components via window object (assuming CDN load)
const ReactMarkdown = window.ReactMarkdown;
const RemarkGfm = window.remarkGfm;

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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out opacity-100">
            <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl shadow-2xl p-6 w-full max-w-sm transform scale-100 transition-transform duration-300 ease-in-out">
                <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium rounded-2xl text-gray-200 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    {onConfirm && (
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 text-sm font-medium rounded-2xl text-white bg-gradient-to-r from-purple-500 to-[#167468] border border-white/10 hover:shadow-lg hover:shadow-[#167468]/30 transition-all"
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
        return <code className="bg-white/10 rounded px-1 py-0.5 text-pink-200">{children}</code>;
    }

    return (
        // Fallback code block rendering
        <pre className="bg-black/60 border border-white/10 text-gray-100 rounded-2xl p-4 overflow-x-auto my-4"><code>{children}</code></pre>
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
    const currentPostUserId = currentUser?.id || currentUser?._id;
    const likedByCurrentUser = post.likedBy && currentPostUserId && post.likedBy.includes(String(currentPostUserId));

    const isSolution = parentSolutionId && parentSolutionId === post._id;
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showHeartPop, setShowHeartPop] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);

    const handleDoubleTap = (e) => {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('a') || e.target.closest('select')) {
            return;
        }
        if (!currentUser) {
            showToast('You must be logged in to like posts.', 'info');
            return;
        }
        if (!likedByCurrentUser) {
            onLike(post._id, false);
            setShowHeartPop(true);
            setTimeout(() => setShowHeartPop(false), 800);
        }
    };

    const categoryIcons = {
        discussion: <MessageSquare size={14} className="mr-1.5" />,
        question: <HelpCircle size={14} className="mr-1.5" />,
        bug: <Bug size={14} className="mr-1.5" />,
        feature: <Lightbulb size={14} className="mr-1.5" />,
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
        const replyUser = post.parentId ? (author ? author.username : (typeof displayUserId === 'string' ? displayUserId : '')) : '';
        onReply(post._id, replyUser);
    };

    const handleShareClick = (platform) => {
        const postLink = `${window.location.origin}/forum#post-${post._id}`;
        const postTitle = post.title || `Discussion by @${displayUserId}`;
        const postText = `Check out this discussion on LearnBent: "${postTitle}"`;

        if (platform === 'copy') {
            navigator.clipboard.writeText(postLink);
            showToast('Link copied to clipboard!', 'success');
        } else if (platform === 'twitter') {
            const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}&url=${encodeURIComponent(postLink)}`;
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
        } else if (platform === 'linkedin') {
            const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postLink)}`;
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
        } else if (platform === 'instagram') {
            navigator.clipboard.writeText(postLink);
            showToast('Link copied! Open Instagram and paste it in your story or bio.', 'info');
            window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer');
        } else if (platform === 'whatsapp') {
            const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(postText + " " + postLink)}`;
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
        } else if (platform === 'telegram') {
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(postLink)}&text=${encodeURIComponent(postText)}`;
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
        }
        setShowShareMenu(false);
    };

    const isStaff = authorRole === 'staff';
    const borderRingClass = isStaff 
        ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.35)]' 
        : 'ring-2 ring-teal-500/50 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 shadow-[0_0_10px_rgba(20,184,166,0.2)]';

    const cardBorderClass = isSolution 
        ? 'border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.12)] bg-emerald-50 dark:bg-emerald-950/15 animate-solution-glow' 
        : isStaff
            ? 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/10 shadow-[0_0_20px_rgba(245,158,11,0.05)] animate-pulse-glow'
            : 'border-gray-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/30 hover:border-gray-300 dark:hover:border-slate-700/60 hover:bg-gray-50 dark:hover:bg-slate-900/40';

    const categoryColors = {
        discussion: 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400',
        question: 'bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400',
        bug: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400',
        feature: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
    };

    if (post.parentId) {
        return (
            <div className="flex items-start justify-between py-3 px-4 rounded-xl hover:bg-gray-105/50 dark:hover:bg-slate-900/10 transition-colors w-full group relative">
                <div className="flex items-start space-x-3 min-w-0 flex-grow">
                    {/* Avatar */}
                    <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border ${borderRingClass}`}
                        style={{ backgroundColor: userColor }}
                        title={`User ID: ${displayUserId}`}
                    >
                        {avatarInitial}
                    </div>
                    
                    {/* Text Body */}
                    <div className="flex-grow min-w-0">
                        <div className="text-[13.5px] leading-relaxed break-words text-gray-750 dark:text-slate-200">
                            <span className="font-bold text-gray-900 dark:text-slate-100 mr-2 hover:underline cursor-pointer">
                                @{(author && author.username) || String(displayUserId).substring(0, 8)}
                            </span>
                            {/* Render comment content */}
                            {ReactMarkdown && RemarkGfm ? (
                                <span className="inline-markdown inline">
                                    <ReactMarkdown
                                        remarkPlugins={[RemarkGfm]}
                                        components={{
                                            code: ({inline, children}) => <code className="bg-gray-100 dark:bg-white/10 rounded px-1 text-teal-655 dark:text-teal-400 font-mono text-xs">{children}</code>,
                                            p: ({children}) => <span className="text-gray-750 dark:text-slate-200">{children}</span>,
                                            a: ({href, children}) => <a href={href} className="text-teal-650 dark:text-teal-400 hover:underline">{children}</a>,
                                            strong: ({children}) => <strong className="text-gray-900 dark:text-white font-semibold">{children}</strong>,
                                        }}
                                    >
                                        {post.content}
                                    </ReactMarkdown>
                                </span>
                            ) : (
                                <span>{post.content}</span>
                            )}
                        </div>
                        
                        {/* Attached Image if exists */}
                        {post.imageUrl && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800/80 max-w-xs shadow-md">
                                <img
                                    src={normalizeImageSrc(post.imageUrl)}
                                    alt="Attached"
                                    className="w-full h-auto object-cover max-h-48"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                        )}
                        
                        {/* Actions Row */}
                        <div className="flex items-center space-x-4 mt-1.5 text-[11px] text-gray-500 dark:text-slate-500 font-semibold select-none">
                            <span>{formatDate(post.createdAt)}</span>
                            {post.likes > 0 && (
                                <span className="font-bold text-gray-600 dark:text-slate-400">{post.likes} {post.likes === 1 ? 'like' : 'likes'}</span>
                            )}
                            <button 
                                onClick={handleReplyClick}
                                className="hover:text-gray-750 dark:hover:text-slate-355 transition-colors"
                            >
                                Reply
                            </button>
                            {isAuthorOfParent && !parentSolutionId && (
                                <button
                                    onClick={handleMarkAsSolutionClick}
                                    className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 flex items-center gap-0.5"
                                    title="Mark as solution"
                                    disabled={!currentUser}
                                >
                                    <Award size={11} /> Mark Solution
                                </button>
                            )}
                            {isSolution && (
                                <span className="text-emerald-605 dark:text-emerald-400 flex items-center gap-0.5 font-bold">
                                    <Award size={11} /> Solution
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Like Button on Right */}
                <div className="flex-shrink-0 flex items-center pl-2 self-start mt-1">
                    <button
                        onClick={handleLikeClick}
                        className={`transition-all duration-200 hover:scale-110 active:scale-95 ${likedByCurrentUser ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-500'}`}
                        title={likedByCurrentUser ? "Unlike" : "Like comment"}
                    >
                        <Heart size={14} fill={likedByCurrentUser ? 'currentColor' : 'none'} stroke="currentColor" className={likedByCurrentUser ? 'animate-[heart-pop_0.4s_ease-in-out]' : ''} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div 
            onDoubleClick={handleDoubleTap}
            className={`relative flex items-start space-x-4 p-6 rounded-2xl transition-all duration-300 border backdrop-blur-md ${cardBorderClass}`}
        >
            {showHeartPop && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 select-none">
                    <Heart className="text-rose-500 fill-rose-500 animate-heart-pop" size={80} />
                </div>
            )}
            <div
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold transition-transform duration-300 hover:scale-105 ${borderRingClass}`}
                style={{ backgroundColor: userColor }}
                title={`User ID: ${displayUserId}`}
            >
                {avatarInitial}
            </div>
            <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white flex items-center flex-wrap gap-2 min-w-0">
                        {post.title ? (
                            <span className="text-gray-900 dark:text-white font-bold truncate max-w-full md:max-w-md">{post.title}</span>
                        ) : (
                            <span className="text-gray-500 dark:text-slate-400 font-medium text-sm">Reply by {String(displayUserId).substring(0, 8)}...</span>
                        )}
                        {post.category && !post.parentId && (
                            <span className={`flex items-center text-[10px] uppercase tracking-wider font-bold border rounded-full px-2.5 py-0.5 shadow-sm transition-all duration-300 ${categoryColors[post.category] || 'bg-white/10 border-white/10 text-gray-200'}`}>
                                {categoryIcons[post.category]} {post.category}
                            </span>
                        )}
                        {/* Staff badge */}
                        {isStaff && (
                            <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-bold bg-amber-500/15 border border-amber-500/35 text-amber-700 dark:text-amber-300 rounded-full px-2.5 py-0.5 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                                <Award size={12} className="mr-1" />
                                Staff
                            </span>
                        )}
                        {isSolution && (
                            <span className="flex items-center text-[10px] uppercase tracking-wider font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-650 dark:text-emerald-400 rounded-full px-2.5 py-0.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                <Award size={12} className="mr-1" /> Solution
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0 pl-2">
                        <span className="text-[10px] text-gray-500 dark:text-slate-500 whitespace-nowrap">{formatDate(post.createdAt)}</span>
                        <span className="text-xs text-teal-650 dark:text-teal-400 font-semibold mt-0.5">@{(author && author.username) || String(displayUserId).substring(0, 8)}</span>
                    </div>
                </div>
                <div className="text-gray-700 dark:text-slate-300 mt-2 text-[15px] leading-relaxed break-words">
                    {ReactMarkdown && RemarkGfm ? (
                        <ReactMarkdown
                            remarkPlugins={[RemarkGfm]}
                            components={{
                                code: CodeBlock,
                                p: ({node, ...props}) => <p {...props} className="text-gray-750 dark:text-slate-300 my-2 leading-relaxed" />,
                                strong: ({node, ...props}) => <strong {...props} className="text-gray-950 dark:text-white font-semibold" />,
                                blockquote: ({node, ...props}) => (
                                    <blockquote {...props} className="border-l-4 border-teal-500 pl-4 italic text-gray-500 dark:text-slate-400 my-4 bg-gray-100 dark:bg-slate-900/20 rounded-r-lg py-2" />
                                ),
                                li: ({node, ...props}) => <li {...props} className="text-gray-750 dark:text-slate-300 ml-2" />,
                                ul: ({node, ...props}) => <ul {...props} className="mb-2 space-y-1 list-disc pl-5" />,
                                ol: ({node, ...props}) => <ol {...props} className="mb-2 list-decimal space-y-1 pl-5" />,
                                a: ({node, ...props}) => <a {...props} className="text-teal-650 dark:text-teal-400 hover:text-teal-555 dark:hover:text-teal-300 hover:underline transition-colors" />,
                                h1: ({node, ...props}) => <h1 {...props} className="text-2xl font-bold text-gray-900 dark:text-white mb-2 mt-4 border-b border-gray-200 dark:border-slate-800 pb-1" />,
                                h2: ({node, ...props}) => <h2 {...props} className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-3" />,
                                h3: ({node, ...props}) => <h3 {...props} className="text-lg font-medium text-gray-900 dark:text-white mb-1 mt-2" />,
                                table: ({node, ...props}) => <table {...props} className="w-full border-collapse my-6 text-sm bg-gray-100 dark:bg-slate-900/20 rounded-xl overflow-hidden shadow-md" />,
                                th: ({node, ...props}) => <th {...props} className="bg-gray-200 dark:bg-slate-800/80 text-gray-900 dark:text-white font-semibold px-4 py-2.5 text-left border-b border-gray-200 dark:border-slate-800" />,
                                td: ({node, ...props}) => <td {...props} className="border-b border-gray-200 dark:border-slate-800/50 px-4 py-2.5 text-gray-700 dark:text-slate-300" />,
                                tr: ({node, ...props}) => <tr {...props} className="hover:bg-gray-100 dark:hover:bg-slate-900/20 transition-colors" />,
                            }}
                        >
                            {post.content}
                        </ReactMarkdown>
                    ) : (
                        <p className="text-gray-700 dark:text-slate-300">{post.content}</p>
                    )}
                </div>
                {post.imageUrl && (
                    <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800/80 max-w-lg shadow-lg">
                        <img
                            src={normalizeImageSrc(post.imageUrl)}
                            alt="Attached"
                            className="w-full h-auto object-cover max-h-96"
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x200/cccccc/000000?text=Image+Load+Error'; }}
                        />
                    </div>
                )}
                {post.tags && post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {post.tags.map((tag, index) => (
                            <span key={index} className="bg-gray-100 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800/80 text-gray-600 dark:text-slate-400 text-xs font-semibold px-2.5 py-0.5 rounded-full transition-all hover:border-gray-300 dark:hover:border-slate-700 hover:text-gray-950 dark:hover:text-white">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
                {/* Conditionally render actions for top-level posts */}
                {!post.parentId && (
                    <div className="mt-5 border-t border-gray-200 dark:border-slate-800/40 pt-4">
                        {/* Action Bar (Icons Only) */}
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-5">
                                {/* Like */}
                                <button
                                    onClick={handleLikeClick}
                                    className={`transition-all duration-200 hover:scale-110 active:scale-90 ${likedByCurrentUser ? 'text-rose-500 animate-pulse' : 'text-gray-500 hover:text-rose-550 dark:text-slate-300 dark:hover:text-rose-500'}`}
                                    title={likedByCurrentUser ? "Unlike" : "Like"}
                                    disabled={!currentUser}
                                >
                                    <Heart size={22} fill={likedByCurrentUser ? 'currentColor' : 'none'} stroke="currentColor" className={likedByCurrentUser ? 'animate-[heart-pop_0.4s_ease-in-out]' : ''} />
                                </button>
                                
                                {/* Comment/Reply */}
                                <button
                                    onClick={handleReplyClick}
                                    className="text-gray-500 hover:text-teal-500 dark:text-slate-300 dark:hover:text-teal-400 transition-all duration-200 hover:scale-110 active:scale-90"
                                    title="Reply"
                                    disabled={!currentUser}
                                >
                                    <MessageCircle size={22} />
                                </button>
                                
                                {/* Share */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowShareMenu(!showShareMenu)}
                                        className={`transition-all duration-200 hover:scale-110 active:scale-90 ${showShareMenu ? 'text-sky-550' : 'text-gray-500 hover:text-sky-555 dark:text-slate-300 dark:hover:text-sky-400'}`}
                                        title="Share"
                                    >
                                        <Send size={21} className="rotate-[15deg]" />
                                    </button>
                                    {showShareMenu && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                                            <div className="absolute left-0 bottom-full mb-3 w-48 bg-white dark:bg-slate-950/95 border border-gray-200 dark:border-slate-800/60 backdrop-blur-md rounded-2xl shadow-2xl p-1.5 z-50 animate-slide-down origin-bottom-left">
                                                <button
                                                    type="button"
                                                    onClick={() => handleShareClick('copy')}
                                                    className="w-full flex items-center px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900/60 rounded-xl transition-all"
                                                >
                                                    <Link2 size={14} className="mr-2.5 text-teal-650 dark:text-teal-400" /> Copy Link
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleShareClick('twitter')}
                                                    className="w-full flex items-center px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900/60 rounded-xl transition-all"
                                                >
                                                    <Twitter size={14} className="mr-2.5 text-sky-555" /> Share on X
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleShareClick('linkedin')}
                                                    className="w-full flex items-center px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900/60 rounded-xl transition-all"
                                                >
                                                    <Linkedin size={14} className="mr-2.5 text-indigo-555" /> LinkedIn
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleShareClick('instagram')}
                                                    className="w-full flex items-center px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900/60 rounded-xl transition-all"
                                                >
                                                    <Instagram size={14} className="mr-2.5 text-pink-500 dark:text-pink-400" /> Instagram
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleShareClick('whatsapp')}
                                                    className="w-full flex items-center px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900/60 rounded-xl transition-all"
                                                >
                                                    <MessageCircle size={14} className="mr-2.5 text-emerald-500 dark:text-emerald-400" /> WhatsApp
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleShareClick('telegram')}
                                                    className="w-full flex items-center px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900/60 rounded-xl transition-all"
                                                >
                                                    <Send size={14} className="mr-2.5 text-sky-500 dark:text-sky-400" /> Telegram
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {/* Save/Bookmark (far right) */}
                            <button
                                onClick={() => setIsBookmarked(!isBookmarked)}
                                className={`transition-all duration-200 hover:scale-110 active:scale-90 ${isBookmarked ? 'text-yellow-600' : 'text-gray-500 hover:text-yellow-600 dark:text-slate-300 dark:hover:text-yellow-500'}`}
                                title={isBookmarked ? "Remove bookmark" : "Save post"}
                            >
                                <Bookmark size={22} fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" />
                            </button>
                        </div>
                        
                        {/* Meta Details beneath Action Bar */}
                        <div className="mt-2.5 flex flex-col space-y-1">
                            <span className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">{post.likes || 0} {post.likes === 1 ? 'like' : 'likes'}</span>
                            {numReplies > 0 && (
                                <button
                                    onClick={() => onToggleReplies(post._id)}
                                    className="text-left text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300 text-xs font-semibold transition-colors select-none w-max mt-0.5"
                                >
                                    {isRepliesVisible ? `Hide replies` : `View all ${numReplies} ${numReplies === 1 ? 'reply' : 'replies'}`}
                                </button>
                            )}
                        </div>
                    </div>
                )}
                {/* Conditionally render actions for replies */}
                {post.parentId && (
                    <div className="mt-4 border-t border-gray-200 dark:border-slate-800/40 pt-3 flex items-center justify-between w-full">
                        <div className="flex items-center space-x-4">
                            {/* Like reply */}
                            <button
                                onClick={handleLikeClick}
                                className={`transition-all duration-200 hover:scale-110 active:scale-90 ${likedByCurrentUser ? 'text-rose-500 animate-pulse' : 'text-gray-500 hover:text-rose-555 dark:text-slate-400 dark:hover:text-rose-500'}`}
                                title={likedByCurrentUser ? "Unlike" : "Like"}
                                disabled={!currentUser}
                            >
                                <Heart size={18} fill={likedByCurrentUser ? 'currentColor' : 'none'} stroke="currentColor" className={likedByCurrentUser ? 'animate-[heart-pop_0.4s_ease-in-out]' : ''} />
                            </button>
                            <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{post.likes || 0} {post.likes === 1 ? 'like' : 'likes'}</span>
                            
                            {/* Mark as Solution (only shown for parent author) */}
                            {isAuthorOfParent && !parentSolutionId && (
                                <button
                                    onClick={handleMarkAsSolutionClick}
                                    className="flex items-center px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 border border-purple-500/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ml-2"
                                    title="Mark as solution"
                                    disabled={!currentUser}
                                >
                                    <Award size={13} className="mr-1.5" /> Mark Solution
                                </button>
                            )}
                        </div>
                        
                        {/* Share reply */}
                        <div className="relative">
                            <button
                                onClick={() => setShowShareMenu(!showShareMenu)}
                                className={`transition-all duration-200 hover:scale-110 active:scale-90 ${showShareMenu ? 'text-sky-550' : 'text-gray-550 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-450'}`}
                                title="Share reply"
                            >
                                <Send size={17} className="rotate-[15deg]" />
                            </button>
                            {showShareMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                                    <div className="absolute right-0 bottom-full mb-3 w-48 bg-white dark:bg-slate-950/95 border border-gray-200 dark:border-slate-800/60 backdrop-blur-md rounded-2xl shadow-2xl p-1.5 z-50 animate-slide-down origin-bottom-right">
                                        <button
                                            type="button"
                                            onClick={() => handleShareClick('copy')}
                                            className="w-full flex items-center px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900/60 rounded-xl transition-all"
                                        >
                                            <Link2 size={14} className="mr-2.5 text-teal-650 dark:text-teal-400" /> Copy Link
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleShareClick('twitter')}
                                            className="w-full flex items-center px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900/60 rounded-xl transition-all"
                                        >
                                            <Twitter size={14} className="mr-2.5 text-sky-555" /> Share on X
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleShareClick('linkedin')}
                                            className="w-full flex items-center px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900/60 rounded-xl transition-all"
                                        >
                                            <Linkedin size={14} className="mr-2.5 text-indigo-555" /> LinkedIn
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleShareClick('instagram')}
                                            className="w-full flex items-center px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900/60 rounded-xl transition-all"
                                        >
                                            <Instagram size={14} className="mr-2.5 text-pink-500 dark:text-pink-400" /> Instagram
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleShareClick('whatsapp')}
                                            className="w-full flex items-center px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900/60 rounded-xl transition-all"
                                        >
                                            <MessageCircle size={14} className="mr-2.5 text-emerald-500 dark:text-emerald-400" /> WhatsApp
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleShareClick('telegram')}
                                            className="w-full flex items-center px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-900/60 rounded-xl transition-all"
                                        >
                                            <Send size={14} className="mr-2.5 text-sky-550 dark:text-sky-400" /> Telegram
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};



/**
 * Form component for creating a new post inside the modal
 */
const NewPostForm = ({ onSubmit, onCancel, isSubmitting }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('discussion');
    const [tags, setTags] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [error, setError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await onSubmit({ title, category, tags, content, imageUrl });
        } catch (err) {
            setError(err.message || 'Failed to create post. Please try again.');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('File is too large (maximum size is 5MB)');
            return;
        }

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${API_BASE_URL}/forum-posts/upload-image`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                setImageUrl(data.url);
            } else {
                setError(data.msg || 'Failed to upload image.');
            }
        } catch (err) {
            console.error('Image upload error:', err);
            setError('Network error uploading image.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {error && (
                <div className="p-3 mb-2 text-xs text-rose-650 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 rounded-xl animate-slide-down">
                    {error}
                </div>
            )}
            <div>
                <label htmlFor="newPostTitleInput" className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1 pl-1">Title</label>
                <input
                    id="newPostTitleInput"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-gray-905 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 focus:outline-none transition-all font-semibold text-sm"
                    required
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="newPostCategorySelect" className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1 pl-1">Category</label>
                    <select
                        id="newPostCategorySelect"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-gray-700 dark:text-slate-300 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 focus:outline-none transition-all text-xs font-semibold"
                    >
                        <option value="discussion" className="bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300">Discussion</option>
                        <option value="question" className="bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300">Question</option>
                        <option value="bug" className="bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300">Bug Report</option>
                        <option value="feature" className="bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300">Feature Request</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="newPostTagsInput" className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1 pl-1">Tags (comma-separated)</label>
                    <input
                        id="newPostTagsInput"
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="react, tailwind, backend"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-gray-905 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 focus:outline-none transition-all text-xs"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="newPostContentInput" className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1 pl-1">Content (Markdown supported)</label>
                <textarea
                    id="newPostContentInput"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your post content here..."
                    rows="4"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-gray-905 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 focus:outline-none transition-all font-mono text-xs"
                    required
                />
            </div>
            <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1 pl-1">
                    Image Attachment (Optional)
                </label>
                <div className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-slate-855 rounded-2xl p-4 bg-gray-55/50 dark:bg-slate-955/40 text-center hover:border-gray-400 dark:hover:border-slate-700 transition-colors cursor-pointer relative group">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={isUploading || isSubmitting}
                    />
                    
                    {imageUrl ? (
                        <div className="relative w-full flex flex-col items-center justify-center z-20 pointer-events-auto">
                            <img
                                src={normalizeImageSrc(imageUrl)}
                                alt="Attachment preview"
                                className="max-h-36 rounded-xl object-cover border border-gray-200 dark:border-slate-800 mb-2"
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setImageUrl('');
                                }}
                                className="px-3 py-1.5 text-[10px] font-bold bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/30 text-rose-650 dark:text-rose-400 rounded-xl hover:bg-rose-905 transition-colors"
                            >
                                Remove Image
                            </button>
                        </div>
                    ) : isUploading ? (
                        <div className="flex flex-col items-center py-4">
                            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2" />
                            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Uploading image...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-4 text-gray-400 dark:text-slate-500 group-hover:text-gray-650 dark:group-hover:text-slate-350 transition-colors">
                            <span className="text-xl mb-1">📸</span>
                            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">Upload an image file</span>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Drag & drop or click to choose (Max 5MB)</span>
                        </div>
                    )}
                </div>
                
                <div className="mt-2 text-right">
                    <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="text-[10px] font-bold text-teal-500 hover:underline transition-colors"
                    >
                        {showUrlInput ? 'Hide URL input' : 'Paste an external Image URL instead'}
                    </button>
                </div>
                
                {showUrlInput && (
                    <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full mt-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-gray-905 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 focus:outline-none transition-all text-xs"
                    />
                )}
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-750 dark:text-slate-200 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 dark:hover:bg-white/10 transition-all"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="flex items-center justify-center px-5 py-2 text-xs text-white bg-gradient-to-r from-purple-600 to-teal-650 rounded-xl border border-purple-500/35 hover:shadow-[0_0_20px_rgba(20,184,166,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 font-bold"
                    disabled={isSubmitting || isUploading}
                >
                    {isSubmitting ? 'Posting...' : 'Post Discussion'}
                </button>
            </div>
        </form>
    );
};

/**
 * The main Forum Page component.
 */
const ForumPage = () => {
    // Use hooks to access context values
    
    const { currentUser } = useAuth();
    const { openModal, closeModal } = useModal();
    const showToast = useToast();
    const { theme, toggleTheme } = useTheme();
    const [searchParams, setSearchParams] = useSearchParams();
    const querySearchTerm = searchParams.get('q') || '';

    const [message, setMessage] = useState({ type: '', text: '' });
    const currentUserId = currentUser?.id || currentUser?._id;
    const isLoggedIn = !!currentUser;
    const userToken = currentUser?.token;

    const [allPosts, setAllPosts] = useState([]);
    const [posts, setPosts] = useState([]);

    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [replyImage, setReplyImage] = useState('');
    const [showImageInput, setShowImageInput] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const [showCancelReplyModal, setShowCancelReplyModal] = useState(false);
    const [visibleReplies, setVisibleReplies] = useState({});

    const [searchTerm, setSearchTerm] = useState(querySearchTerm);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterTag, setFilterTag] = useState('');

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
    const [isAdvancedFilterExpanded, setIsAdvancedFilterExpanded] = useState(false);
    const [staffSolutionsOnly, setStaffSolutionsOnly] = useState(false);
    const [paidCourses, setPaidCourses] = useState([]);

    const openNewPostModal = () => {
        if (!isLoggedIn) {
            showToast('You must be logged in to create a post.', 'info');
            return;
        }

        // Check subscription status for posting access
        if (subscriptionStatus && subscriptionStatus.plan === 'free' && subscriptionStatus.status === 'active') {
            openModal(
                'Subscription Required', 
                'To post in the forum, please subscribe to one of our plans. Visit the Dashboard to see available plans.',
                () => {
                    window.location.href = '/admin-dashboard';
                }
            );
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
            return;
        }

        openModal(
            'Create a New Post',
            null,
            {
                hideFooter: true,
                content: (
                    <NewPostForm 
                        onSubmit={handlePostSubmit} 
                        onCancel={closeModal}
                        isSubmitting={isSubmitting}
                    />
                )
            }
        );
    };

    // Pagination
    const POSTS_PER_PAGE = 6;
    const REPLIES_PER_PAGE = 4;
    const [postPage, setPostPage] = useState(1);
    const [replyPages, setReplyPages] = useState({});

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

    // Fetch users list for UserCarousel to avoid loading late
    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/public/users`);
            const data = await response.json();
            if (response.ok) {
                const usersNormalized = (data || []).map(u => {
                    const nid = u.id || u._id || (u._id && String(u._id)) || (u.id && String(u.id));
                    return { ...u, id: nid };
                });
                setUsers(usersNormalized);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    }, []);

    useEffect(() => {
        const loadAllData = async () => {
            setIsInitialLoading(true);
            await Promise.all([
                fetchForumPosts(),
                fetchPaidCourses(),
                fetchUsers()
            ]);
            setIsInitialLoading(false);
        };
        loadAllData();
    }, [fetchForumPosts, fetchPaidCourses, fetchUsers]);

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
        setPosts(sortedTopLevelPosts);
    }, [searchTerm, filterCategory, filterTag, staffSolutionsOnly, allPosts]);

    // Reset/clamp pagination when filters/results change
    useEffect(() => {
        setPostPage(1);
    }, [searchTerm, filterCategory, filterTag, staffSolutionsOnly]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
        setPostPage(prev => Math.min(prev, totalPages));
    }, [posts.length]);

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

    const handlePostSubmit = async (formData) => {
        const { title, content, imageUrl, category, tags } = formData;
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

        if (!title.trim() || !content.trim()) {
            setIsSubmitting(false);
            throw new Error("Please fill in both title and content for your post.");
        }

        const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

        const postData = {
            title: title.trim(),
            content: content.trim(),
            imageUrl: imageUrl || null,
            category,
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
                closeModal();
                fetchForumPosts();
            } else {
                throw new Error(data.msg || 'Failed to create post.');
            }
        } catch (error) {
            console.error('Post creation API error:', error);
            throw error;
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

    const startReply = (postId, username = '') => {
        setReplyingTo(postId);
        setReplyContent(username ? `@${username} ` : '');
        setReplyImage('');
        setShowImageInput(false);
        setVisibleReplies(prev => ({ ...prev, [postId]: true }));
        setReplyPages(prev => ({ ...prev, [postId]: 1 }));
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
        setShowImageInput(false);
    };

    const handleToggleReplies = (postId) => {
        setVisibleReplies(prev => {
            const nextVisible = !prev[postId];
            if (nextVisible) {
                setReplyPages(rp => ({ ...rp, [postId]: 1 }));
            }
            return {
                ...prev,
                [postId]: nextVisible
            };
        });
    };

    const toggleAdvancedFilterExpanded = () => {
        setIsAdvancedFilterExpanded(prev => !prev);
    };



    const getReplies = (postId) => allPosts.filter(p => p.parentId === postId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const totalPostPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
    const postStartIndex = (postPage - 1) * POSTS_PER_PAGE;
    const pagedPosts = posts.slice(postStartIndex, postStartIndex + POSTS_PER_PAGE);

    const [topContributors, setTopContributors] = useState([]);
    const [showTopContributorsMobile, setShowTopContributorsMobile] = useState(false);
    const [showPaidCoursesMobile, setShowPaidCoursesMobile] = useState(false);

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

    if (isInitialLoading) {
        return (
            <div className="min-h-screen bg-transparent text-gray-800 dark:text-slate-100 font-sans antialiased pb-12">
                <div className="container mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                    {/* Forum Header Section Skeleton */}
                    <div className="lg:col-span-3">
                        <div className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/60 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm dark:shadow-none">
                            <div className="flex items-center space-x-4 w-full">
                                <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-slate-800 shrink-0" />
                                <div className="space-y-2 w-full max-w-md">
                                    <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded-lg w-1/2" />
                                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-lg w-3/4 hidden sm:block" />
                                </div>
                            </div>
                            <div className="w-full sm:w-36 h-11 bg-gray-200 dark:bg-slate-800 rounded-2xl shrink-0" />
                        </div>
                        <div className="flex items-center mt-4 pl-2 space-x-2">
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-lg w-12" />
                            <span className="text-gray-300 dark:text-slate-700">/</span>
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-lg w-12" />
                            <span className="text-gray-300 dark:text-slate-700">/</span>
                            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-lg w-20" />
                        </div>
                    </div>

                    {/* Left Column (span 2) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Search & Filter Bar Skeleton */}
                        <div className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 p-6 rounded-3xl flex items-center space-x-3 shadow-sm dark:shadow-none">
                            <div className="h-11 bg-gray-200 dark:bg-slate-800 rounded-2xl flex-grow" />
                            <div className="w-11 h-11 bg-gray-200 dark:bg-slate-800 rounded-2xl" />
                        </div>

                        {/* Discussion Feed Skeleton */}
                        <div className="space-y-6">
                            {[1, 2, 3].map((idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-900/20 border border-gray-200 dark:border-slate-800/60 rounded-3xl p-6 space-y-4 shadow-sm dark:shadow-none">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-800" />
                                            <div className="space-y-1.5">
                                                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24" />
                                                <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-16" />
                                            </div>
                                        </div>
                                        <div className="w-16 h-6 bg-gray-200 dark:bg-slate-800 rounded-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-3/4" />
                                        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-full" />
                                        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-5/6" />
                                    </div>
                                    <div className="flex items-center gap-3 pt-2">
                                        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded-full w-16" />
                                        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded-full w-20" />
                                        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded-full w-14" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column (span 1) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Premium Courses Skeleton */}
                        <div className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-sm dark:shadow-none">
                            <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-36 mb-1" />
                            <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-48 mb-4" />
                            <div className="space-y-3">
                                {[1, 2, 3].map((idx) => (
                                    <div key={idx} className="flex gap-3 p-2 rounded-xl bg-gray-50 dark:bg-slate-950/20 border border-gray-150 dark:border-slate-900">
                                        <div className="w-16 h-12 bg-gray-200 dark:bg-slate-800 rounded-lg shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-28" />
                                            <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-16" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Contributors Skeleton */}
                        <div className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-sm dark:shadow-none">
                            <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-36 mb-1" />
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map((idx) => (
                                    <div key={idx} className="flex items-center justify-between p-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-800" />
                                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24" />
                                        </div>
                                        <div className="w-12 h-5 bg-gray-200 dark:bg-slate-700 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* User Carousel Skeleton */}
                        <div className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-sm dark:shadow-none">
                            <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-28 mb-1" />
                            <div className="space-y-4">
                                {[1, 2].map((idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950/20 border border-gray-150 dark:border-slate-900 flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-slate-800" />
                                        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20" />
                                        <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-12" />
                                        <div className="w-20 h-8 bg-gray-200 dark:bg-slate-800 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ForumProvider forumHandlers={forumHandlers}>
            <div className="min-h-screen bg-transparent text-gray-800 dark:text-slate-100 font-sans antialiased pb-12">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Forum Header Section */}
                <div className="lg:col-span-3">
                    <header className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/60 backdrop-blur-md rounded-3xl shadow-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.15)] flex items-center justify-center animate-pulse">
                                <svg
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="text-teal-600 dark:text-teal-400"
                                >
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <circle cx="8" cy="8" r="2" fill="currentColor" />
                                    <circle cx="16" cy="8" r="2" fill="currentColor" />
                                    <circle cx="8" cy="16" r="2" fill="currentColor" />
                                    <circle cx="16" cy="16" r="2" fill="currentColor" />
                                    <path d="M8 8L16 16M16 8L8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-teal-600 via-emerald-500 to-indigo-600 dark:from-teal-400 dark:via-emerald-300 dark:to-indigo-400 bg-clip-text text-transparent">LearnBent Forum</h1>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 hidden sm:block">Ask questions, share ideas, and connect with other learners</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <button 
                                onClick={openNewPostModal} 
                                className={`w-full sm:w-auto flex items-center justify-center px-5 py-2.5 text-white font-semibold rounded-2xl border border-teal-500/25 transition-all duration-300 shadow-md ${
                                    !isLoggedIn 
                                        ? 'bg-gray-200 dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-700' 
                                        : (subscriptionStatus && subscriptionStatus.plan === 'free' && subscriptionStatus.status === 'active')
                                            ? 'bg-gray-200 dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-purple-600 to-teal-600 hover:shadow-[0_0_20px_rgba(20,184,166,0.35)] hover:-translate-y-0.5 active:translate-y-0'
                                }`} 
                                disabled={!isLoggedIn || (subscriptionStatus && subscriptionStatus.plan === 'free' && subscriptionStatus.status === 'active')}
                                title={!isLoggedIn ? 'Please login' : (subscriptionStatus && subscriptionStatus.plan === 'free' && subscriptionStatus.status === 'active') ? 'Subscription required to post' : 'Create a post'}
                            >
                                <PlusCircle size={18} className="mr-2" /> 
                                {!isLoggedIn 
                                    ? 'Login to Post' 
                                    : (subscriptionStatus && subscriptionStatus.plan === 'free' && subscriptionStatus.status === 'active')
                                        ? 'Subscribe to Post'
                                        : 'Ask a Question'
                                }
                            </button>
                            {isLoggedIn ? (
                                <div className="hidden lg:flex flex-col items-end">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-500 font-bold">Logged in as</span>
                                    <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">@{currentUser.username}</span>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 hidden lg:block font-medium">Log in to interact.</p>
                            )}
                        </div>
                    </header>
                    <div className="flex items-center text-xs font-semibold text-gray-500 mt-4 pl-2 space-x-1.5">
                        <a href="#home" onClick={(e) => e.preventDefault()} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Home</a>
                        <span>/</span>
                        <a href="#forum" onClick={(e) => e.preventDefault()} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Forum</a>
                        <span>/</span>
                        <span className="text-gray-800 dark:text-slate-300 font-bold">Discussion</span>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2">
                    {error && (
                        <div className="p-4 mb-5 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/15 border border-rose-200 dark:border-rose-500/20 rounded-2xl animate-slide-down flex items-start space-x-2" role="alert">
                            <Bug size={18} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}
                    {successMessage && (
                        <div className="p-4 mb-5 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl animate-slide-down flex items-start space-x-2" role="status">
                            <Award size={18} className="flex-shrink-0 mt-0.5" />
                            <span>{successMessage}</span>
                        </div>
                    )}
                    


                    {/* Search and Filter Section */}
                    <div className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 backdrop-blur-md p-6 rounded-3xl shadow-xl mb-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    placeholder="Search discussions..."
                                    className="w-full px-4 py-2.5 pl-10 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/60 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 focus:outline-none transition-all"
                                />
                                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                            </div>
                            <button onClick={toggleAdvancedFilterExpanded} className={`flex items-center justify-center p-3 rounded-2xl bg-gray-50 dark:bg-slate-950/60 border transition-all duration-300 hover:bg-gray-100 dark:hover:bg-slate-900/60 ${isAdvancedFilterExpanded ? 'border-teal-500/40 text-teal-600 dark:text-teal-400' : 'border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'}`}>
                                <Filter size={18} />
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-500 font-semibold mb-1">
                            <span className="truncate uppercase tracking-wider">Displaying {pagedPosts.length} out of {allPosts.filter(p => !p.parentId).length} discussions</span>
                            <div className="flex items-center space-x-2">
                                <label htmlFor="filter-category" className="sr-only">Filter by Category</label>
                                <select
                                    id="filter-category"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-gray-700 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                                >
                                    <option value="all" className="bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300">All Topics</option>
                                    <option value="discussion" className="bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300">Discussion</option>
                                    <option value="question" className="bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300">Question</option>
                                    <option value="bug" className="bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300">Bug Report</option>
                                    <option value="feature" className="bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300">Feature Request</option>
                                </select>
                            </div>
                        </div>

                        {isAdvancedFilterExpanded && (
                            <div className="mt-4 border-t pt-4 border-gray-200 dark:border-slate-800/80 space-y-4 animate-slide-down">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="filter-tag" className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-1.5 pl-1">Filter by Tag</label>
                                        <input
                                            id="filter-tag"
                                            type="text"
                                            value={filterTag}
                                            onChange={(e) => setFilterTag(e.target.value)}
                                            placeholder="e.g., react"
                                            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/60 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center mt-6 md:mt-8 pl-1">
                                        <label className="relative flex items-center cursor-pointer select-none">
                                            <input 
                                                type="checkbox" 
                                                checked={staffSolutionsOnly} 
                                                onChange={(e) => setStaffSolutionsOnly(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-10 h-6 bg-gray-205 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-full transition-colors duration-200 peer-checked:bg-teal-500/20 peer-checked:border-teal-500/40"></div>
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-gray-400 dark:bg-slate-400 rounded-full transition-transform duration-200 peer-checked:translate-x-full peer-checked:bg-teal-400"></div>
                                            <span className="ml-3 text-sm font-semibold text-gray-700 dark:text-slate-300">Staff Solutions Only</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Discussion Feed */}
                    <div className="space-y-6">
                        {posts.length > 0 ? (
                                <>
                                    {pagedPosts.map(post => (
                                        <Fragment key={post._id}>
                                            <div className="bg-white dark:bg-slate-900/20 border border-gray-200 dark:border-slate-800/60 backdrop-blur-md rounded-3xl shadow-xl overflow-visible hover:border-gray-300 dark:hover:border-slate-800 transition-all duration-300 shadow-sm dark:shadow-none">
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
                                                <div className="mt-4 ml-8 sm:ml-16 bg-gray-50 dark:bg-slate-900/10 border border-gray-150 dark:border-slate-800/40 rounded-2xl p-4 relative animate-slide-down">
                                                    <div className="absolute top-0 bottom-0 -left-[28px] w-[2px] bg-gradient-to-b from-gray-300 dark:from-slate-700/80 to-gray-100 dark:to-slate-700/10" />
                                                    <div className="absolute top-[24px] -left-[28px] w-[16px] h-[2px] bg-gray-300 dark:bg-slate-700/80" />
                                                    
                                                    <form onSubmit={(e) => handleReplySubmit(e, post._id)} className="flex flex-col space-y-3 w-full">
                                                        <div className="flex items-center space-x-3 w-full">
                                                            {/* User Avatar */}
                                                            <div
                                                                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-teal-600 border border-teal-500/40 shadow-sm"
                                                                style={{ backgroundColor: stringToColor(currentUser?.username || 'user') }}
                                                            >
                                                                {currentUser?.username ? currentUser.username.substring(0, 2).toUpperCase() : 'ME'}
                                                            </div>
                                                            
                                                            {/* Input Bar */}
                                                            <div className="flex-grow relative flex items-center bg-white dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 focus-within:border-teal-500/50 focus-within:ring-2 focus-within:ring-teal-500/10 rounded-2xl px-4 py-2 transition-all">
                                                                <input
                                                                    type="text"
                                                                    value={replyContent}
                                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                                    placeholder="Add a comment..."
                                                                    className="w-full bg-transparent text-gray-900 dark:text-slate-100 text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none pr-20"
                                                                    required
                                                                    autoFocus
                                                                />
                                                                
                                                                {/* Optional attachment button */}
                                                                <div className="absolute right-16 flex items-center space-x-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowImageInput(!showImageInput)}
                                                                        className={`text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors ${showImageInput ? 'text-teal-500' : ''}`}
                                                                        title="Attach Image Link"
                                                                    >
                                                                        <Link2 size={16} />
                                                                    </button>
                                                                </div>

                                                                <button
                                                                    type="submit"
                                                                    className="absolute right-4 text-teal-500 hover:text-teal-400 font-bold text-xs disabled:opacity-40 transition-colors uppercase tracking-wider"
                                                                    disabled={isSubmitting || !replyContent.trim()}
                                                                >
                                                                    Post
                                                                </button>
                                                            </div>
                                                            
                                                            {/* Cancel button */}
                                                            <button
                                                                type="button"
                                                                onClick={confirmCancelReply}
                                                                className="text-gray-405 hover:text-gray-650 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-2"
                                                                title="Cancel"
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        </div>

                                                        {/* Optional Image URL Input Drawer */}
                                                        {showImageInput && (
                                                            <div className="w-full px-11 animate-slide-down">
                                                                <input
                                                                    type="text"
                                                                    value={replyImage}
                                                                    onChange={(e) => setReplyImage(e.target.value)}
                                                                    placeholder="Attach image URL (optional)"
                                                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-gray-905 dark:text-slate-100 text-xs placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 focus:outline-none transition-all"
                                                                />
                                                            </div>
                                                        )}
                                                    </form>
                                                </div>
                                            )}
                                            {/* This is the key change to conditionally render replies */}
                                            {visibleReplies[post._id] && getReplies(post._id).length > 0 && (
                                                <div className="space-y-4 ml-8 sm:ml-16 mt-4">
                                                    {(() => {
                                                        const replies = getReplies(post._id);
                                                        const totalReplyPages = Math.max(1, Math.ceil(replies.length / REPLIES_PER_PAGE));
                                                        const replyPage = Math.min((replyPages[post._id] || 1), totalReplyPages);
                                                        const replyStartIndex = (replyPage - 1) * REPLIES_PER_PAGE;
                                                        const pagedReplies = replies.slice(replyStartIndex, replyStartIndex + REPLIES_PER_PAGE);

                                                        return (
                                                            <>
                                                                {totalReplyPages > 1 && (
                                                                    <div className="flex items-center justify-between gap-3 px-1 relative">
                                                                        <div className="absolute top-0 bottom-0 -left-[28px] w-[2px] bg-gradient-to-b from-gray-300 dark:from-slate-700/80 to-gray-100 dark:to-slate-700/10" />
                                                                        <span className="text-[11px] text-gray-550 dark:text-slate-500 font-bold uppercase tracking-wider pl-1">Replies page {replyPage} of {totalReplyPages}</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setReplyPages(prev => ({ ...prev, [post._id]: Math.max(1, (prev[post._id] || 1) - 1) }))}
                                                                                disabled={replyPage <= 1}
                                                                                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900/60 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-950/60 transition-colors"
                                                                            >
                                                                                Previous
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setReplyPages(prev => ({ ...prev, [post._id]: Math.min(totalReplyPages, (prev[post._id] || 1) + 1) }))}
                                                                                disabled={replyPage >= totalReplyPages}
                                                                                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900/60 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-950/60 transition-colors"
                                                                            >
                                                                                Next
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {pagedReplies.map(reply => (
                                                                    <Fragment key={reply._id}>
                                                                        <div className="relative ml-8 sm:ml-16 mt-4 animate-slide-down">
                                                                            <div className="absolute top-0 bottom-0 -left-[28px] w-[2px] bg-gradient-to-b from-gray-300 dark:from-slate-700/80 to-gray-100 dark:to-slate-700/10" />
                                                                            <div className="absolute top-[24px] -left-[28px] w-[16px] h-[2px] bg-gray-300 dark:bg-slate-700/80" />
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
                                                                        {replyingTo === reply._id && (
                                                                            <div className="mt-3 ml-16 sm:ml-28 bg-gray-55 dark:bg-slate-900/10 border border-gray-150 dark:border-slate-800/40 rounded-2xl p-4 relative animate-slide-down">
                                                                                <div className="absolute top-0 bottom-0 -left-[28px] w-[2px] bg-gradient-to-b from-gray-300 dark:from-slate-700/80 to-gray-100 dark:to-slate-700/10" />
                                                                                <div className="absolute top-[24px] -left-[28px] w-[16px] h-[2px] bg-gray-300 dark:bg-slate-700/80" />
                                                                                
                                                                                <form onSubmit={(e) => handleReplySubmit(e, post._id)} className="flex flex-col space-y-2 w-full">
                                                                                    <div className="flex items-center space-x-3 w-full">
                                                                                        {/* Current User Avatar */}
                                                                                        <div
                                                                                            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold bg-teal-600 border border-teal-500/40 shadow-sm"
                                                                                            style={{ backgroundColor: stringToColor(currentUser?.username || 'user') }}
                                                                                        >
                                                                                            {currentUser?.username ? currentUser.username.substring(0, 2).toUpperCase() : 'ME'}
                                                                                        </div>
                                                                                        
                                                                                        {/* Input field */}
                                                                                        <div className="flex-grow relative flex items-center bg-white dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 focus-within:border-teal-500/50 focus-within:ring-2 focus-within:ring-teal-500/10 rounded-2xl px-4 py-1.5 transition-all">
                                                                                            <input
                                                                                                type="text"
                                                                                                value={replyContent}
                                                                                                onChange={(e) => setReplyContent(e.target.value)}
                                                                                                placeholder={`Reply to @${reply.userId && typeof reply.userId === 'object' ? reply.userId.username : reply.userId}...`}
                                                                                                className="w-full bg-transparent text-gray-900 dark:text-slate-100 text-xs placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none pr-20"
                                                                                                required
                                                                                                autoFocus
                                                                                            />

                                                                                            {/* Optional image link toggler */}
                                                                                            <div className="absolute right-16 flex items-center space-x-2">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => setShowImageInput(!showImageInput)}
                                                                                                    className={`text-gray-400 hover:text-gray-650 dark:text-slate-400 dark:hover:text-slate-200 transition-colors ${showImageInput ? 'text-teal-500' : ''}`}
                                                                                                    title="Attach Image"
                                                                                                >
                                                                                                    <Link2 size={14} />
                                                                                                </button>
                                                                                            </div>

                                                                                            <button
                                                                                                type="submit"
                                                                                                className="absolute right-4 text-teal-500 hover:text-teal-400 font-bold text-[10px] disabled:opacity-40 transition-colors uppercase tracking-wider"
                                                                                                disabled={isSubmitting || !replyContent.trim()}
                                                                                            >
                                                                                                Post
                                                                                            </button>
                                                                                        </div>
                                                                                        
                                                                                        {/* Cancel button */}
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={confirmCancelReply}
                                                                                            className="text-gray-405 hover:text-gray-650 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1"
                                                                                            title="Cancel"
                                                                                        >
                                                                                            <X size={16} />
                                                                                        </button>
                                                                                    </div>

                                                                                    {/* Optional Image URL Input Drawer */}
                                                                                    {showImageInput && (
                                                                                        <div className="w-full px-10 animate-slide-down">
                                                                                            <input
                                                                                                type="text"
                                                                                                value={replyImage}
                                                                                                onChange={(e) => setReplyImage(e.target.value)}
                                                                                                placeholder="Attach image URL (optional)"
                                                                                                className="w-full px-4 py-1.5 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-gray-900 dark:text-slate-100 text-[11px] placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 focus:outline-none transition-all"
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                </form>
                                                                            </div>
                                                                        )}
                                                                    </Fragment>
                                                                ))}

                                                                {totalReplyPages > 1 && (
                                                                    <div className="flex items-center justify-end gap-2 pt-2 relative">
                                                                        <div className="absolute top-0 bottom-0 -left-[28px] w-[2px] bg-gradient-to-b from-gray-300 dark:from-slate-700/80 to-gray-100 dark:to-slate-700/10" />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setReplyPages(prev => ({ ...prev, [post._id]: Math.max(1, (prev[post._id] || 1) - 1) }))}
                                                                            disabled={replyPage <= 1}
                                                                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-950/60 border border-gray-205 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900/60 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-950/60 transition-colors"
                                                                        >
                                                                            Previous
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setReplyPages(prev => ({ ...prev, [post._id]: Math.min(totalReplyPages, (prev[post._id] || 1) + 1) }))}
                                                                            disabled={replyPage >= totalReplyPages}
                                                                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-950/60 border border-gray-205 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900/60 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-950/60 transition-colors"
                                                                        >
                                                                            Next
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </Fragment>
                                    ))}

                                    {/* Feed Pagination (New Control) */}
                                                                    {totalPostPages > 1 && (
                                                                        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 p-5 bg-gray-55 dark:bg-slate-900/30 border border-gray-200 dark:border-slate-850 rounded-2xl gap-4 shadow-sm dark:shadow-none">
                                                                            <span className="text-xs text-gray-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                                                                                Showing {postStartIndex + 1}-{Math.min(postStartIndex + POSTS_PER_PAGE, posts.length)} of {posts.length} discussions
                                                                            </span>
                                                                            <div className="flex items-center gap-3">
                                                                                <button
                                                                                    onClick={() => setPostPage(prev => Math.max(1, prev - 1))}
                                                                                    disabled={postPage === 1}
                                                                                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900/60 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-950/60 transition-all duration-300"
                                                                                >
                                                                                    Previous
                                                                                </button>
                                                                                <span className="text-xs font-bold text-gray-700 dark:text-slate-300 bg-gray-100/50 dark:bg-slate-955/30 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800/40">
                                                                                    Page {postPage} / {totalPostPages}
                                                                                </span>
                                                                                <button
                                                                                    onClick={() => setPostPage(prev => Math.min(totalPostPages, prev + 1))}
                                                                                    disabled={postPage === totalPostPages}
                                                                                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900/60 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-955/60 transition-all duration-300"
                                                                                >
                                                                                    Next
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div className="text-center p-12 bg-gray-50 dark:bg-slate-900/10 border border-gray-200 dark:border-slate-800/40 rounded-3xl text-gray-550 dark:text-slate-400">
                                                                    <MessageSquare size={36} className="mx-auto mb-3 text-gray-400 dark:text-slate-600" />
                                                                    <p className="font-semibold text-gray-705 dark:text-slate-400">No discussions found.</p>
                                                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Be the first to start a conversation!</p>
                                                                </div>
                                                            )
                                                        }
                                                    </div>
                                                </div>

                                                {/* Sidebar */}
                                                <div className="lg:col-span-1 space-y-6">
                                                    {/* Paid Courses Section */}


                                                        {/* Mobile toggle for Paid Courses (collapse on small screens) */}
                                                        <button
                                                            className="sidebar-toggle-button lg:hidden w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 backdrop-blur-md rounded-2xl text-sm font-semibold text-gray-750 dark:text-slate-200 shadow-sm dark:shadow-none"
                                                            onClick={() => setShowPaidCoursesMobile(prev => !prev)}
                                                            aria-expanded={showPaidCoursesMobile}
                                                        >
                                                            <span>💎 Premium Courses</span>
                                                        </button>

                                                        {paidCourses.length > 0 && (
                                                            <div className={`${showPaidCoursesMobile ? 'block' : 'hidden'} lg:block bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 backdrop-blur-md p-6 rounded-3xl shadow-xl shadow-sm dark:shadow-none`}>
                                                                <h2 className="text-lg font-bold mb-2 border-b pb-2 border-gray-100 dark:border-slate-850 text-gray-900 dark:text-white flex items-center gap-2">
                                                                    <span>💎</span> Premium Courses
                                                                </h2>
                                                                <p className="text-gray-500 dark:text-slate-400 text-xs mb-4">
                                                                    Explore our paid content and join discussions
                                                                </p>
                                                                <div className="space-y-3 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-slate-950/20 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700/60 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-600 pr-1">
                                                                    {paidCourses.map(course => (
                                                                        <div 
                                                                            key={course._id} 
                                                                            className="p-3 rounded-2xl border border-gray-150 dark:border-slate-800/60 bg-gray-50/50 dark:bg-slate-950/40 hover:bg-gray-100/70 dark:hover:bg-slate-900/40 hover:border-gray-250 dark:hover:border-slate-700/60 transition-all duration-300 cursor-pointer group shadow-sm dark:shadow-none"
                                                                            onClick={() => setSearchTerm(course.title)}
                                                                        >
                                                                            <div className="flex items-center space-x-3">
                                                                                {course.imageUrl ? (
                                                                                    <img 
                                                                                        src={course.imageUrl} 
                                                                                        alt={course.title}
                                                                                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border border-gray-205 dark:border-slate-800 group-hover:border-gray-300 dark:group-hover:border-slate-700 transition-colors"
                                                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-500/40 border border-teal-500/30 flex items-center justify-center flex-shrink-0 text-lg">
                                                                                        📚
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex-grow min-w-0">
                                                                                    <h3 className="font-semibold text-sm text-gray-805 dark:text-slate-200 group-hover:text-gray-950 dark:group-hover:text-white truncate transition-colors">
                                                                                        {course.title}
                                                                                    </h3>
                                                                                    <div className="flex items-center justify-between mt-1">
                                                                                        <span className="text-xs font-bold text-teal-500 dark:text-teal-400">
                                                                                            {course.price && `₹${course.price}`}
                                                                                        </span>
                                                                                        {course.rating && (
                                                                                            <span className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-0.5">
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
                                                        className="sidebar-toggle-button lg:hidden w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 backdrop-blur-md rounded-2xl text-sm font-semibold text-gray-755 dark:text-slate-202 shadow-sm dark:shadow-none"
                                                        onClick={() => setShowTopContributorsMobile(prev => !prev)}
                                                        aria-expanded={showTopContributorsMobile}
                                                    >
                                                        <span>🔥 Top Contributors</span>
                                                    </button>

                                                    <div className={`${showTopContributorsMobile ? 'block' : 'hidden'} lg:block bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 backdrop-blur-md p-6 rounded-3xl shadow-xl shadow-sm dark:shadow-none`}>
                                                        <h2 className="text-lg font-bold mb-2 border-b pb-2 border-gray-100 dark:border-slate-855 text-gray-905 dark:text-white">Top Contributors</h2>
                                                        <p className="text-gray-500 dark:text-slate-400 text-xs mb-4">
                                                            People who started the most discussions on LearnBent.
                                                        </p>
                                                        <ul className="space-y-4">
                                                            {topContributors.length > 0 ? (
                                                                topContributors.map(contributor => (
                                                                    <li key={contributor.id} className="flex items-center space-x-3 group">
                                                                        <div
                                                                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 border border-gray-205 dark:border-slate-800 ring-2 ring-gray-100 dark:ring-slate-800/50 group-hover:ring-teal-500/30 group-hover:border-teal-500/30 transition-all duration-300"
                                                                            style={{ backgroundColor: stringToColor(contributor.id || contributor.name) }}
                                                                        >
                                                                            {contributor.profilePicture ? (
                                                                                <img src={normalizeImageSrc(contributor.profilePicture)} alt={contributor.name} className="w-9 h-9 rounded-full object-cover" />
                                                                            ) : (
                                                                                contributor.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2)
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-grow flex items-center justify-between min-w-0">
                                                                            <span className="font-semibold text-sm text-gray-700 dark:text-slate-300 group-hover:text-gray-950 dark:group-hover:text-white pr-2 truncate transition-colors">{contributor.name}</span>
                                                                            <span className="flex items-center text-xs font-medium text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-850 px-2 py-0.5 rounded-full flex-shrink-0">
                                                                                {contributor.discussions} <MessageSquare size={12} className="ml-1 text-teal-500 dark:text-teal-400" />
                                                                            </span>
                                                                        </div>
                                                                    </li>
                                                                ))
                                                            ) : (
                                                                <li className="text-slate-500 text-xs text-center py-4">No contributors yet</li>
                                                            )}
                                                        </ul>
                                                    </div>
                    {/* User Carousel: list of all users & staff with follow buttons */}
                    <div>
                        {/* Lazy load the UserCarousel to avoid large initial bundle if desired */}
                        {/* We import dynamically to keep bundle small */}
                        {/* eslint-disable-next-line react/jsx-no-undef */}
                        <React.Suspense fallback={<div className="p-4 text-center text-sm text-gray-400">Loading people...</div>}>
                            <UserCarousel users={users} />
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




