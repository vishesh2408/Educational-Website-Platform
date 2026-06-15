


// src/components/QuizzesPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Code as CodeIcon,
    Binary as BinaryIcon,
    Globe as GlobeIcon,
    ArrowLeft as ArrowLeftIcon,
    Database as DatabaseIcon,
    Cpu as CpuIcon,
    BookOpen as BookOpenIcon,
    Lightbulb as LightbulbIcon,
    Sparkles as SparklesIcon,
    Loader2,
    Menu,
    User,
    Trophy,
    GraduationCap,
    Brain,
    Clock,
    Target,
    Zap,
    CheckCircle2,
    XCircle,
    ArrowRight,
    RotateCcw,
    ChevronRight
} from 'lucide-react';
// The 'three' module and related logic have been removed in favor of a new
// CSS-based animated background and design.

import { useAuth } from '../contexts/AuthContext'; // ✅ Import the useAuth hook
import { useModal } from '../contexts/ModalContext'; // ✅ Import the useModal hook
import { useToast } from '../contexts/ToastContext';

// Base URL for your backend API
// const API_BASE_URL = 'http://localhost:3001/api';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

const getQuizImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('data:')) return imageUrl;
    return `${BASE_URL}${imageUrl}`;
};

const generateFrontendDefaultQuizImage = (title) => {
    const gradients = [
        ['#1e3a8a', '#3b82f6', '#60a5fa'], // Blue theme
        ['#064e3b', '#10b981', '#34d399'], // Emerald theme
        ['#581c87', '#8b5cf6', '#a78bfa'], // Purple theme
        ['#7c2d12', '#f97316', '#fb923c'], // Orange theme
        ['#881337', '#f43f5e', '#fb7185'], // Rose theme
        ['#0f766e', '#14b8a6', '#2dd4bf'], // Teal theme
        ['#1e1b4b', '#4f46e5', '#818cf8'], // Indigo theme
    ];
    const selected = gradients[Math.floor(Math.random() * gradients.length)];
    const id = 'grad_' + Math.random().toString(36).substring(2, 9);
    
    // Split text into lines if it's too long
    const words = (title || 'Quiz').split(' ');
    let lines = [];
    let currentLine = '';
    
    words.forEach(word => {
        if ((currentLine + ' ' + word).trim().length > 22) {
            lines.push(currentLine.trim());
            currentLine = word;
        } else {
            currentLine = (currentLine + ' ' + word).trim();
        }
    });
    if (currentLine) {
        lines.push(currentLine.trim());
    }
    
    if (lines.length > 2) {
        lines = [lines[0] + ' ' + lines[1], lines.slice(2).join(' ')];
        if (lines[0].length > 25) lines[0] = lines[0].substring(0, 22) + '...';
        if (lines[1].length > 25) lines[1] = lines[1].substring(0, 22) + '...';
    }
    
    const escapeSvgXml = (str) => {
        return (str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    let textElements = '';
    if (lines.length === 1) {
        textElements = `<text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Inter', 'Segoe UI', sans-serif" font-weight="900" font-size="44" fill="#ffffff" letter-spacing="1">${escapeSvgXml(lines[0])}</text>`;
    } else {
        textElements = `
            <text x="50%" y="38%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Inter', 'Segoe UI', sans-serif" font-weight="900" font-size="40" fill="#ffffff" letter-spacing="1">${escapeSvgXml(lines[0])}</text>
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Inter', 'Segoe UI', sans-serif" font-weight="900" font-size="40" fill="#ffffff" letter-spacing="1">${escapeSvgXml(lines[1])}</text>
        `;
    }

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
        <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${selected[0]}" />
            <stop offset="50%" stop-color="${selected[1]}" />
            <stop offset="100%" stop-color="${selected[2]}" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="5" flood-opacity="0.35" />
        </filter>
    </defs>
    <rect width="800" height="450" fill="url(#${id})" />
    <circle cx="10%" cy="20%" r="140" fill="white" opacity="0.04" />
    <circle cx="90%" cy="80%" r="180" fill="white" opacity="0.04" />
    <rect x="75%" y="-10%" width="250" height="250" rx="30" transform="rotate(25)" fill="white" opacity="0.03" />
    <path d="M 0 320 Q 200 280 400 320 T 800 320 L 800 450 L 0 450 Z" fill="white" opacity="0.03" />
    <rect x="30" y="30" width="740" height="390" rx="20" fill="none" stroke="white" stroke-opacity="0.12" stroke-width="2" />
    <g filter="url(#shadow)">
        ${textElements}
        <text x="50%" y="64%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="18" fill="#ffffff" fill-opacity="0.75" letter-spacing="5">
            CHALLENGE
        </text>
    </g>
</svg>`.trim();

    return 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
};

// Mapping icon names to their components for dynamic rendering
const iconMap = {
    CodeIcon: CodeIcon,
    BinaryIcon: BinaryIcon,
    GlobeIcon: GlobeIcon,
    DatabaseIcon: DatabaseIcon,
    CpuIcon: CpuIcon,
    BookOpenIcon: BookOpenIcon,
    LightbulbIcon: LightbulbIcon,
    SparklesIcon: SparklesIcon,
    GraduationCap: GraduationCap
};

// Card accent colors — each quiz gets a unique accent
const cardAccents = [
    { border: 'border-t-teal-500', bg: 'from-teal-500/10 to-teal-600/5', icon: 'from-teal-500 to-emerald-600', glow: 'hover:shadow-teal-500/10', ring: 'ring-teal-500/30' },
    { border: 'border-t-violet-500', bg: 'from-violet-500/10 to-violet-600/5', icon: 'from-violet-500 to-purple-600', glow: 'hover:shadow-violet-500/10', ring: 'ring-violet-500/30' },
    { border: 'border-t-amber-500', bg: 'from-amber-500/10 to-orange-600/5', icon: 'from-amber-500 to-orange-600', glow: 'hover:shadow-amber-500/10', ring: 'ring-amber-500/30' },
    { border: 'border-t-rose-500', bg: 'from-rose-500/10 to-pink-600/5', icon: 'from-rose-500 to-pink-600', glow: 'hover:shadow-rose-500/10', ring: 'ring-rose-500/30' },
    { border: 'border-t-cyan-500', bg: 'from-cyan-500/10 to-sky-600/5', icon: 'from-cyan-500 to-blue-600', glow: 'hover:shadow-cyan-500/10', ring: 'ring-cyan-500/30' },
    { border: 'border-t-emerald-500', bg: 'from-emerald-500/10 to-green-600/5', icon: 'from-emerald-500 to-green-600', glow: 'hover:shadow-emerald-500/10', ring: 'ring-emerald-500/30' },
];

/** Circular progress ring for the results screen */
const ScoreGauge = ({ score, total }) => {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const circumference = 2 * Math.PI * 54; // radius = 54
    const offset = circumference - (percentage / 100) * circumference;
    const color = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';

    return (
        <div className="relative w-36 h-36 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800/60" />
                <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white">{percentage}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{score}/{total}</span>
            </div>
        </div>
    );
};

/** Skeleton card for loading state */
const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 rounded-3xl p-5 animate-pulse">
        <div className="flex items-start gap-4 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-slate-800/80" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800/80 rounded-lg w-3/4" />
                <div className="h-3 bg-gray-150 dark:bg-slate-800/60 rounded-lg w-full" />
            </div>
        </div>
        <div className="flex gap-2 mt-4">
            <div className="h-5 w-16 bg-gray-150 dark:bg-slate-800/60 rounded-full" />
            <div className="h-5 w-20 bg-gray-150 dark:bg-slate-800/60 rounded-full" />
        </div>
    </div>
);

const QuizzesPage = () => {
    const canvasRef = useRef(null);
    const navigate = useNavigate();

    // Get currentUser and openModal from contexts
    const { currentUser } = useAuth();
    const { openModal } = useModal();
    const showToast = useToast();

    const [allQuizzes, setAllQuizzes] = useState([]);
    const [selectedQuizId, setSelectedQuizId] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [isOptionSelected, setIsOptionSelected] = useState(false);

    const [customTopic, setCustomTopic] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [difficulty, setDifficulty] = useState('Intermediate');
    const [isTimed, setIsTimed] = useState(false);
    const [durationMin, setDurationMin] = useState(10);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [generationError, setGenerationError] = useState('');

    const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // This is the original fetchQuizzes logic, which makes a real API call
    const fetchQuizzes = useCallback(async () => {
        setIsLoadingQuizzes(true);
        setFetchError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/public/quizzes`);
            const data = await response.json();

            if (response.ok) {
                const processedQuizzes = data.map(quiz => ({
                    ...quiz,
                    questions: quiz.questions || [],
                    isTimedQuiz: quiz.isTimedQuiz ?? false,
                    allowDirectResultAccess: quiz.allowDirectResultAccess ?? true,
                    noOfQuestions: quiz.noOfQuestions ?? quiz.questions.length,
                    totalMarks: quiz.totalMarks ?? (quiz.questions.length * 10),
                    passMark: quiz.passMark ?? 60,
                    duration: quiz.duration ?? 'No Limit'
                }));
                setAllQuizzes(processedQuizzes);
            } else {
                throw new Error(data.msg || 'Failed to fetch quizzes.');
            }
        } catch (err) {
            console.error('Error fetching quizzes:', err);
            setFetchError('Failed to load quizzes. Please check your network and try again.');
        } finally {
            setIsLoadingQuizzes(false);
        }
    }, []);

    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);

    const selectedQuiz = allQuizzes.find(quiz => quiz._id === selectedQuizId);
    const currentQuestions = selectedQuiz ? selectedQuiz.questions : [];
    const currentQuestion = selectedQuiz ? currentQuestions[currentQuestionIndex] : null;

    const handleOptionSelect = (option) => {
        if (isOptionSelected || !currentQuestion) {
            return;
        }
        setSelectedOption(option);
        setIsOptionSelected(true);

        if (option === currentQuestion.correctAnswer) {
            setScore(prevScore => prevScore + 1);
            setFeedbackMessage('Correct!');
        } else {
            setFeedbackMessage(`Incorrect. The correct answer was: ${currentQuestion.correctAnswer}`);
        }
    };

    const handleSubmitQuizAttempt = async () => {
        if (!currentUser || !selectedQuizId) {
            showToast('You must be logged in to save quiz results.', 'info');
            return;
        }

        const userResponses = currentQuestions.map((q, index) => ({
            questionId: q._id,
            userAnswer: currentQuestionIndex === index ? selectedOption : null,
            isCorrect: currentQuestionIndex === index ? (selectedOption === q.correctAnswer) : null,
        }));

        try {
            const response = await fetch(`${API_BASE_URL}/user/quizzes/attempt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    quizId: selectedQuizId,
                    score: score,
                    totalQuestions: currentQuestions.length,
                    correctAnswers: score,
                    userResponses: userResponses
                }),
            });
            const data = await response.json();

            if (response.ok) {
                console.log("Quiz attempt submitted successfully:", data);
                } else {
                console.error("Failed to submit quiz attempt:", data.msg);
                showToast(data.msg || 'Failed to save your quiz results.', 'error');
            }
        } catch (err) {
            console.error("Network error submitting quiz attempt:", err);
            showToast('Could not save quiz results. Please check your connection.', 'error');
        }
    };

    const handleNextQuestion = async () => {
        setFeedbackMessage('');
        setSelectedOption(null);
        setIsOptionSelected(false);

        if (currentQuestionIndex < currentQuestions.length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
            } else {
                if (currentUser) {
                    await handleSubmitQuizAttempt();
                } else {
                    showToast('Quiz finished. Log in to save your score and track progress.', 'info');
                }
            setShowResults(true);
        }
    };

    const handleRestartQuiz = () => {
        setCurrentQuestionIndex(0);
        setScore(0);
        setShowResults(false);
        setSelectedOption(null);
        setFeedbackMessage('');
        setIsOptionSelected(false);
    };

    const handleBackToQuizzes = () => {
        setSelectedQuizId(null);
        handleRestartQuiz();
    };

    const handleGenerateCustomQuiz = async () => {
        if (!currentUser) {
            showToast('You must be logged in to generate custom quizzes.', 'info');
            navigate('/auth');
            return;
        }
        if (!customTopic.trim()) {
            setGenerationError('Please enter a topic.');
            return;
        }

        setIsGeneratingQuiz(true);
        setGenerationError('');

        try {
            const response = await fetch(`${API_BASE_URL}/generate-quiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    topic: customTopic,
                    num_questions: numQuestions,
                    difficulty: difficulty
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate quiz from backend.');
            }

            const data = await response.json();
            if (!data.quiz || data.quiz.length === 0) {
                throw new Error('AI did not return any questions. Try a different topic.');
            }

            const newQuizId = `generated-${Date.now()}`;
            const newQuiz = {
                _id: newQuizId,
                title: `${customTopic} Quiz (${difficulty})`,
                description: `A dynamically generated ${difficulty.toLowerCase()}-level quiz on "${customTopic}" by AI.`,
                icon: 'SparklesIcon',
                questions: data.quiz.map(q => ({
                    ...q,
                    type: q.type || 'Multiple choice',
                    isTimedPerQuestion: q.isTimedPerQuestion ?? false,
                    questionTimeLimit: q.questionTimeLimit ?? null,
                    selectedOptionCounts: q.options.reduce((acc, opt) => ({ ...acc, [opt]: 0 }), {})
                })),
                noOfQuestions: data.quiz.length,
                totalMarks: data.quiz.length * 10,
                passMark: data.quiz.length * 7,
                duration: isTimed ? `${durationMin} Minutes` : 'No Limit',
                isTimedQuiz: isTimed,
                attemptsCount: 0,
                totalScoreSum: 0,
                isReleased: true,
                allowDirectResultAccess: true,
            };

            setAllQuizzes(prev => [...prev, newQuiz]);
            setSelectedQuizId(newQuizId);
            setCustomTopic('');
            setNumQuestions(5);
            setDifficulty('Intermediate');
            setIsTimed(false);
            setDurationMin(10);
        } catch (err) {
            console.error("Error fetching generated quiz:", err);
            setGenerationError(err.message);
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    // --- Compute stats for hero ---
    const totalQuestions = allQuizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0);

    // ===========================
    // LOADING STATE
    // ===========================
    if (isLoadingQuizzes) {
        return (
            <div className="min-h-screen bg-transparent">
                {/* Ambient orbs */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                </div>
                <div className="relative container mx-auto px-4 py-8 max-w-7xl">
                    {/* Skeleton hero */}
                    <div className="text-center mb-10 animate-pulse">
                        <div className="w-14 h-14 rounded-2xl bg-gray-250 dark:bg-slate-800/80 mx-auto mb-4" />
                        <div className="h-8 bg-gray-200 dark:bg-slate-800/60 rounded-xl w-72 mx-auto mb-3" />
                        <div className="h-4 bg-gray-200 dark:bg-slate-800/40 rounded-lg w-96 mx-auto" />
                    </div>
                    {/* Skeleton cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                </div>
            </div>
        );
    }

    // ===========================
    // ERROR STATE
    // ===========================
    if (fetchError) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
                <div className="max-w-md w-full animate-scale-in">
                    <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-gray-250 dark:border-slate-800/80 rounded-3xl p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5">
                            <XCircle className="h-8 w-8 text-rose-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Failed to Load Quizzes</h2>
                        <p className="text-sm text-gray-650 dark:text-slate-400 mb-6 leading-relaxed">{fetchError}</p>
                        <button
                            onClick={fetchQuizzes}
                            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                        >
                            <RotateCcw size={16} />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ===========================
    // MAIN RENDER
    // ===========================
    return (
        <div className="flex-grow bg-transparent min-h-screen text-gray-900 dark:text-white">
            {/* ===== Ambient Background ===== */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {/* Gradient orbs */}
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-teal-500/[0.04] rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-60 -left-40 w-[600px] h-[600px] bg-violet-500/[0.04] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
                {/* Dot grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                />
            </div>

            <div className="relative container mx-auto px-4 py-6 max-w-7xl">
                {!selectedQuizId ? (
                    <section>
                        {/* ===== Hero Section ===== */}
                        <div className="text-center mb-10 animate-fade-in-up">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-teal-500/20 to-teal-500/40 border border-teal-500/30 rounded-2xl mb-5 shadow-lg shadow-teal-500/10">
                                <GraduationCap className="h-7 w-7 text-teal-450 dark:text-teal-400" />
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-teal-600 via-emerald-500 to-indigo-600 dark:from-teal-400 dark:via-emerald-300 dark:to-indigo-400 bg-clip-text text-transparent mb-3">
                                Explore CSE Quizzes
                            </h1>
                            <p className="text-sm text-gray-550 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-6">
                                Test your knowledge with our comprehensive collection of computer science quizzes and challenge yourself to reach new heights
                            </p>
                            {/* Stat badges */}
                            <div className="flex items-center justify-center gap-3 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-600 dark:text-teal-300 bg-teal-500/10 border border-teal-500/20 rounded-full">
                                    <BookOpenIcon size={13} /> {allQuizzes.length} Quizzes
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full">
                                    <Target size={13} /> {totalQuestions} Questions
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                    <Zap size={13} /> AI Powered
                                </span>
                            </div>
                        </div>

                        {/* ===== AI Quiz Generator ===== */}
                        <div className="mb-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
                            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900/40 backdrop-blur-md border border-gray-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                        <SparklesIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Generate Custom Quiz with AI</h2>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">Create personalized quizzes on any topic</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Topic Field */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-700 dark:text-slate-350">Topic / Subject</label>
                                        <input
                                            type="text"
                                            value={customTopic}
                                            onChange={(e) => setCustomTopic(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleGenerateCustomQuiz()}
                                            placeholder="Enter a topic (e.g., 'Machine Learning', 'React Hooks')"
                                            disabled={isGeneratingQuiz}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/60 text-gray-900 dark:text-slate-100 text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Grid for Parameters */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        {/* Number of Questions */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-gray-700 dark:text-slate-350">Questions</label>
                                            <select
                                                value={numQuestions}
                                                onChange={(e) => setNumQuestions(Number(e.target.value))}
                                                disabled={isGeneratingQuiz}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-gray-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value={3} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">3 Questions</option>
                                                <option value={5} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">5 Questions</option>
                                                <option value={8} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">8 Questions</option>
                                                <option value={10} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">10 Questions</option>
                                            </select>
                                        </div>

                                        {/* Difficulty */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-gray-700 dark:text-slate-350">Difficulty</label>
                                            <select
                                                value={difficulty}
                                                onChange={(e) => setDifficulty(e.target.value)}
                                                disabled={isGeneratingQuiz}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-gray-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="Beginner" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Beginner</option>
                                                <option value="Intermediate" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Intermediate</option>
                                                <option value="Advanced" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Advanced</option>
                                            </select>
                                        </div>

                                        {/* Timing Style */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-gray-700 dark:text-slate-350">Timing</label>
                                            <select
                                                value={isTimed ? 'Timed' : 'NoLimit'}
                                                onChange={(e) => setIsTimed(e.target.value === 'Timed')}
                                                disabled={isGeneratingQuiz}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-gray-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="NoLimit" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">No Time Limit</option>
                                                <option value="Timed" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Timed Quiz</option>
                                            </select>
                                        </div>

                                        {/* Duration */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-gray-700 dark:text-slate-350">Duration (Mins)</label>
                                            <input
                                                type="number"
                                                value={durationMin}
                                                onChange={(e) => setDurationMin(Math.max(1, Number(e.target.value)))}
                                                disabled={isGeneratingQuiz || !isTimed}
                                                min="1"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/60 text-gray-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={handleGenerateCustomQuiz}
                                            disabled={isGeneratingQuiz || (currentUser && !customTopic.trim())}
                                            className="relative overflow-hidden w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-pink-650 rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all duration-300 flex items-center gap-2 justify-center min-w-[200px]"
                                        >
                                            {isGeneratingQuiz ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Generating Quiz...
                                                </>
                                            ) : (
                                                <>
                                                    <SparklesIcon className="h-4 w-4" />
                                                    {currentUser ? 'Generate Quiz' : 'Login Required'}
                                                </>
                                            )}
                                            {/* Shimmer overlay */}
                                            {!isGeneratingQuiz && (customTopic.trim() || !currentUser) && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {generationError && (
                                    <div className="mt-3 p-3 bg-rose-950/30 border border-rose-500/20 rounded-xl animate-slide-down">
                                        <p className="text-rose-650 dark:text-rose-400 text-xs font-medium">{generationError}</p>
                                    </div>
                                )}
                                {!currentUser && !generationError && (
                                    <div className="mt-3 p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl">
                                        <p className="text-amber-600 dark:text-amber-400 text-xs font-medium">🔒 Login to generate custom quizzes with AI.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ===== Quiz Grid ===== */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {allQuizzes.map((quiz, index) => {
                                const IconComponent = iconMap[quiz.icon];
                                const accent = cardAccents[index % cardAccents.length];

                                return (
                                    <button
                                        key={quiz._id}
                                        onClick={() => setSelectedQuizId(quiz._id)}
                                        className={`group relative text-left bg-white dark:bg-slate-900/40 backdrop-blur-md border border-t-2 ${accent.border} border-gray-200 dark:border-slate-800/80 rounded-3xl p-5 hover:bg-gray-50 dark:hover:bg-slate-900/60 hover:border-gray-300 dark:hover:border-slate-700/80 hover:shadow-xl dark:hover:shadow-2xl ${accent.glow} transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0a0a0f] opacity-0 animate-fade-in-up`}
                                        style={{ animationDelay: `${0.15 + index * 0.06}s`, animationFillMode: 'forwards' }}
                                    >
                                        {/* Subtle gradient overlay on hover */}
                                        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${accent.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                        <div className="relative z-10 flex flex-col h-full">
                                            {/* Quiz Card Cover Image */}
                                            <div className="w-full h-32 rounded-2xl overflow-hidden mb-4 border border-gray-200 dark:border-slate-800/80 relative flex-shrink-0">
                                                <img src={quiz.imageUrl ? getQuizImageUrl(quiz.imageUrl) : generateFrontendDefaultQuizImage(quiz.title)} alt={quiz.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>

                                            {/* Icon + Title */}
                                            <div className="flex items-start gap-3.5 mb-3">
                                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent.icon} flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 ${accent.ring} group-hover:scale-110 transition-transform duration-300`}>
                                                    {IconComponent ? <IconComponent className="h-5 w-5 text-white" /> : <BookOpenIcon className="h-5 w-5 text-white" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm font-bold text-gray-805 dark:text-slate-200 group-hover:text-gray-950 dark:group-hover:text-white truncate transition-colors">{quiz.title}</h3>
                                                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{quiz.description}</p>
                                                </div>
                                            </div>

                                            {/* Metadata pills */}
                                            <div className="flex items-center gap-2 flex-wrap mt-4">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-gray-650 dark:text-slate-400 bg-gray-100 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-full">
                                                    <BookOpenIcon size={10} /> {quiz.noOfQuestions} Qs
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-gray-650 dark:text-slate-400 bg-gray-100 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-full">
                                                    <Clock size={10} /> {quiz.duration}
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-gray-650 dark:text-slate-400 bg-gray-100 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-full">
                                                    <Target size={10} /> {quiz.passMark}% pass
                                                </span>
                                            </div>

                                            {/* Start indicator */}
                                            <div className="flex items-center justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-605 dark:text-teal-400 flex items-center gap-1">
                                                    Start Quiz <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {allQuizzes.length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-center mx-auto mb-4">
                                    <BookOpenIcon className="h-8 w-8 text-slate-600" />
                                </div>
                                <p className="text-slate-500 text-sm font-medium">No quizzes available yet. Try generating one with AI!</p>
                            </div>
                        )}
                    </section>
                ) : (
                    <section className="animate-scale-in">
                        {/* ===== Quiz Active Header ===== */}
                        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md border border-gray-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-xl mb-6">
                            <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-800/50">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleBackToQuizzes}
                                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-800/60 hover:border-gray-300 dark:hover:border-slate-700 transition-all duration-300"
                                    >
                                        <ArrowLeftIcon className="h-3.5 w-3.5" />
                                        Back
                                    </button>
                                    <div className="min-w-0">
                                        <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                            {selectedQuiz?.title}
                                        </h1>
                                        <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">Challenge yourself and learn something new</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 md:p-8">
                                {showResults ? (
                                    /* ===== Results Screen ===== */
                                    <div className="max-w-lg mx-auto text-center animate-fade-in-up">
                                        {/* Score gauge */}
                                        <ScoreGauge score={score} total={currentQuestions.length} />

                                        {/* Performance tier */}
                                        <h2 className="text-2xl font-extrabold text-gray-905 dark:text-white mb-2">
                                            {score === currentQuestions.length ? '🌟 Perfect Score!' :
                                             score >= currentQuestions.length * 0.8 ? '🔥 Excellent Work!' :
                                             score >= currentQuestions.length * 0.6 ? '👍 Good Job!' : '💪 Keep Learning!'}
                                        </h2>
                                        <p className="text-sm text-gray-650 dark:text-slate-400 mb-6">
                                            You answered <span className="text-gray-950 dark:text-white font-bold">{score}</span> out of <span className="text-gray-950 dark:text-white font-bold">{currentQuestions.length}</span> questions correctly
                                        </p>

                                        {/* Performance badge */}
                                        <div className="mb-8">
                                            {(() => {
                                                const pct = currentQuestions.length > 0 ? (score / currentQuestions.length) * 100 : 0;
                                                const tier = pct >= 80 ? { label: 'Passed', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
                                                    : pct >= 60 ? { label: 'Almost There', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' }
                                                    : { label: 'Needs Practice', color: 'text-rose-650 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' };
                                                return (
                                                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold border rounded-full ${tier.color}`}>
                                                        <Trophy size={13} /> {tier.label}
                                                    </span>
                                                );
                                            })()}
                                        </div>

                                        {!currentUser && (
                                            <div className="mb-6 p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl">
                                                <p className="text-amber-500 dark:text-amber-400 text-xs font-medium">
                                                    🔒 Log in to save your results and track your progress!
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={handleRestartQuiz}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-teal-600 rounded-xl hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                                            >
                                                <RotateCcw size={14} /> Restart Quiz
                                            </button>
                                            <button
                                                onClick={handleBackToQuizzes}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/60 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-all duration-300"
                                            >
                                                All Quizzes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* ===== Question View ===== */
                                    <div className="max-w-3xl mx-auto">
                                        {/* Segmented Progress */}
                                        <div className="mb-8">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500 mb-0.5">Progress</p>
                                                    <p className="text-sm font-bold text-gray-905 dark:text-white">
                                                        Question <span className="text-teal-600 dark:text-teal-400">{currentQuestionIndex + 1}</span> of {currentQuestions.length}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500 mb-0.5">Score</p>
                                                    <p className="text-sm font-bold text-teal-600 dark:text-teal-400">
                                                        {score}/{currentQuestions.length}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Segmented dots */}
                                            <div className="flex gap-1">
                                                {currentQuestions.map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                                            i < currentQuestionIndex ? 'bg-teal-500'
                                                            : i === currentQuestionIndex ? 'bg-teal-400 animate-pulse'
                                                            : 'bg-gray-200 dark:bg-slate-800'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Question Card */}
                                        <div className="bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800/60 rounded-2xl p-5 md:p-6 mb-6 relative overflow-hidden">
                                            {/* Top accent line */}
                                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 via-violet-500 to-pink-500" />
                                            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-relaxed">
                                                {currentQuestion?.question}
                                            </h2>
                                        </div>

                                        {/* Options */}
                                        <div className="space-y-3 mb-6">
                                            {currentQuestion?.options.map((option, index) => {
                                                const isCorrectOption = option === currentQuestion.correctAnswer;
                                                const isSelected = selectedOption === option;

                                                let classes = "w-full p-4 text-left rounded-2xl transition-all duration-300 group/opt relative overflow-hidden flex items-center gap-4 ";

                                                if (!isOptionSelected) {
                                                    classes += "bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-900/60 hover:border-teal-500/30 hover:shadow-[0_0_20px_rgba(20,184,166,0.08)] hover:-translate-y-0.5 cursor-pointer text-gray-800 dark:text-slate-350";
                                                } else {
                                                    classes += "cursor-default ";
                                                    if (isSelected && isCorrectOption) {
                                                        classes += "bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]";
                                                    } else if (isSelected && !isCorrectOption) {
                                                        classes += "bg-rose-500/10 border border-rose-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]";
                                                    } else if (!isSelected && isCorrectOption) {
                                                        classes += "bg-emerald-500/5 border border-emerald-500/20";
                                                    } else {
                                                        classes += "bg-gray-50 dark:bg-slate-900/20 border border-gray-200 dark:border-slate-800/40 opacity-50";
                                                    }
                                                }

                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleOptionSelect(option)}
                                                        disabled={isOptionSelected}
                                                        className={classes}
                                                    >
                                                        {/* Letter badge */}
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-extrabold transition-all duration-300 ${
                                                            !isOptionSelected
                                                                ? 'bg-gray-100 dark:bg-slate-800/80 text-gray-505 dark:text-slate-400 border border-gray-200 dark:border-slate-700/60 group-hover/opt:bg-teal-500/20 group-hover/opt:text-teal-550 group-hover/opt:border-teal-500/30'
                                                                : isSelected && isCorrectOption ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30'
                                                                : isSelected && !isCorrectOption ? 'bg-rose-500/20 text-rose-505 dark:text-rose-400 border border-rose-500/30'
                                                                : isCorrectOption ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400/60 border border-emerald-500/20'
                                                                : 'bg-gray-100 dark:bg-slate-800/40 text-gray-400 dark:text-slate-600 border border-gray-200 dark:border-slate-800/40'
                                                        }`}>
                                                            {String.fromCharCode(65 + index)}
                                                        </div>

                                                        <span className={`text-sm flex-1 ${
                                                            !isOptionSelected ? 'text-gray-700 dark:text-slate-300 group-hover/opt:text-gray-950 dark:group-hover/opt:text-white' :
                                                            (isSelected && isCorrectOption) || (!isSelected && isCorrectOption) ? 'text-emerald-600 dark:text-emerald-200 font-semibold' :
                                                            isSelected && !isCorrectOption ? 'text-rose-650 dark:text-rose-200 font-semibold' : 'text-gray-405 dark:text-slate-500'
                                                        } transition-colors`}>
                                                            {option}
                                                        </span>

                                                        {/* Result indicator */}
                                                        {isOptionSelected && (
                                                            <div className="flex-shrink-0">
                                                                {isSelected && isCorrectOption && <CheckCircle2 size={18} className="text-emerald-500 dark:text-emerald-400" />}
                                                                {isSelected && !isCorrectOption && <XCircle size={18} className="text-rose-500 dark:text-rose-400" />}
                                                                {!isSelected && isCorrectOption && <CheckCircle2 size={18} className="text-emerald-500/50 dark:text-emerald-400/50" />}
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Feedback */}
                                        {feedbackMessage && (
                                            <div className={`mb-6 p-4 rounded-2xl border animate-slide-down ${
                                                feedbackMessage.startsWith('Correct')
                                                    ? 'bg-emerald-500/10 border-emerald-500/20'
                                                    : 'bg-rose-500/10 border-rose-500/20'
                                            }`}>
                                                <p className={`text-sm font-semibold flex items-center gap-2 ${
                                                    feedbackMessage.startsWith('Correct') ? 'text-emerald-300' : 'text-rose-300'
                                                }`}>
                                                    {feedbackMessage.startsWith('Correct') ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                                    {feedbackMessage}
                                                </p>
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        <div className="flex justify-center">
                                            <button
                                                onClick={handleNextQuestion}
                                                disabled={!isOptionSelected}
                                                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-teal-600 rounded-xl hover:shadow-[0_0_25px_rgba(20,184,166,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all duration-300"
                                            >
                                                {currentQuestionIndex < currentQuestions.length - 1 ? (
                                                    <> Next Question <ArrowRight size={16} /></>
                                                ) : (
                                                    <> Finish Quiz <Trophy size={16} /></>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default QuizzesPage;