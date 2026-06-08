


// src/components/QuizzesPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    Brain
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

// Card gradient themes
const cardThemes = [
    'from-blue-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-purple-500 to-pink-600',
    'from-teal-500 to-cyan-600',
    'from-indigo-500 to-blue-600'
];

const QuizzesPage = () => {
    const canvasRef = useRef(null);

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
                    'x-auth-token': currentUser.token,
                },
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
                    'x-auth-token': currentUser.token,
                },
                body: JSON.stringify({ topic: customTopic, num_questions: 5 }),
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
                title: `${customTopic} Quiz (AI Generated)`,
                description: `A dynamically generated quiz on "${customTopic}" by AI.`,
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
                duration: 'No Limit',
                isTimedQuiz: false,
                attemptsCount: 0,
                totalScoreSum: 0,
                isReleased: true,
                allowDirectResultAccess: true,
            };

            setAllQuizzes(prev => [...prev, newQuiz]);
            setSelectedQuizId(newQuizId);
            setCustomTopic('');
        } catch (err) {
            console.error("Error fetching generated quiz:", err);
            setGenerationError(err.message);
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    if (isLoadingQuizzes) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="relative overflow-hidden">
                    {/* 3D Background Elements */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-20 left-10 w-32 h-32 bg-teal-500 rounded-full blur-xl animate-pulse"></div>
                        <div className="absolute top-40 right-20 w-40 h-40 bg-purple-500 rounded-full blur-xl animate-pulse delay-1000"></div>
                        <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-blue-500 rounded-full blur-xl animate-pulse delay-2000"></div>
                    </div>
                    
                    <div className="flex items-center justify-center min-h-[calc(100vh)] p-4">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl animate-bounce">
                                <Loader2 className="h-8 w-8 animate-spin text-white" />
                            </div>
                            <p className="text-xl text-white font-medium">Loading amazing quizzes...</p>
                            <div className="flex justify-center mt-4">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-200"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="min-h-screen bg-slate-950">
                <div className="flex items-center justify-center min-h-[calc(100vh)] p-4">
                    <div className="text-center max-w-md">
                        <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 shadow-2xl">
                            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <p className="text-xl text-white mb-6">Error: {fetchError}</p>
                            <button 
                                onClick={fetchQuizzes}
                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-[#167468] text-white rounded-xl hover:opacity-95 transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-grow bg-slate-950 min-h-screen">
            {/* 3D Background Pattern */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
                
                {/* Geometric shapes */}
                <div className="absolute top-20 left-10 w-4 h-4 bg-white/10 rotate-45 animate-ping"></div>
                <div className="absolute top-40 right-20 w-6 h-6 bg-white/10 rounded-full animate-ping delay-500"></div>
                <div className="absolute bottom-40 left-20 w-3 h-3 bg-white/10 rotate-45 animate-ping delay-1000"></div>
                <div className="absolute bottom-20 right-40 w-5 h-5 bg-white/10 rounded-full animate-ping delay-1500"></div>
            </div>

            <div className="relative container mx-auto px-4 py-4 max-w-7xl">
                <main className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
                    {!selectedQuizId ? (
                        <section className="p-4 md:p-6 lg:p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-teal-400 to-teal-600 rounded-2xl mb-4 shadow-2xl">
                                    <GraduationCap className="h-8 w-8 text-white" />
                                </div>
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-teal-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    Explore CSE Quizzes
                                </h1>
                                <p className="text-base text-gray-300 max-w-3xl mx-auto leading-relaxed">
                                    Test your knowledge with our comprehensive collection of computer science quizzes and challenge yourself to reach new heights
                                </p>
                            </div>

                            {/* Custom Quiz Generation */}
                            <div className="mb-8 p-6 bg-gradient-to-r from-teal-500/20 to-teal-600/20 backdrop-blur-xl rounded-xl border border-teal-400/30 shadow-2xl">
                                <div className="max-w-3xl mx-auto">
                                    <div className="text-center mb-4">
                                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-teal-500 to-pink-600 rounded-lg mb-3 shadow-xl">
                                            <SparklesIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white mb-1">Generate Custom Quiz with AI</h2>
                                        <p className="text-gray-300 text-sm">Create personalized quizzes on any topic using artificial intelligence</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            type="text"
                                            value={customTopic}
                                            onChange={(e) => setCustomTopic(e.target.value)}
                                            placeholder="Enter topic for an AI-generated quiz (e.g., 'Machine Learning')"
                                            disabled={isGeneratingQuiz || !currentUser}
                                            className="flex-1 px-4 py-3 rounded-lg border border-white/20 bg-white/20 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:bg-gray-800/50 disabled:cursor-not-allowed text-white placeholder-gray-400"
                                        />
                                        <button
                                            onClick={handleGenerateCustomQuiz}
                                            disabled={isGeneratingQuiz || !customTopic.trim() || !currentUser}
                                            className="px-5 py-3 bg-gradient-to-r from-purple-500 to-[#167468] text-white rounded-lg hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 justify-center min-w-fit transform hover:scale-105 shadow-xl text-sm"
                                        >
                                            {isGeneratingQuiz ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Generating Magic...
                                                </>
                                            ) : (
                                                <>
                                                    <SparklesIcon className="h-4 w-4" />
                                                    {currentUser ? 'Generate Quiz' : 'Login Required'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    {generationError && (
                                        <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
                                            <p className="text-red-300 text-sm">{generationError}</p>
                                        </div>
                                    )}
                                    {!currentUser && !generationError && (
                                        <div className="mt-3 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg backdrop-blur-sm">
                                            <p className="text-amber-300 text-sm">Login to generate custom quizzes with AI.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quiz Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {allQuizzes.map((quiz, index) => {
                                    const IconComponent = iconMap[quiz.icon];
                                    const themeClass = cardThemes[index % cardThemes.length];
                                    
                                    return (
                                        <button
                                            key={quiz._id}
                                            onClick={() => setSelectedQuizId(quiz._id)}
                                            className="group relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5 hover:border-white/40 hover:bg-white/20 transition-all duration-500 text-left focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-transparent transform hover:scale-105 hover:-translate-y-2 shadow-2xl"
                                        >
                                            {/* Gradient overlay */}
                                            <div className={`absolute inset-0 bg-gradient-to-br ${themeClass} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
                                            
                                            {/* Floating elements */}
                                            <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-xl group-hover:from-white/20 transition-all duration-500"></div>
                                            
                                            <div className="relative z-10">
                                                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${themeClass} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-xl`}>
                                                    {IconComponent && <IconComponent className="h-6 w-6 text-white" />}
                                                </div>
                                                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-teal-300 transition-colors">{quiz.title}</h3>
                                                <p className="text-gray-300 text-sm mb-4 leading-relaxed">{quiz.description}</p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                                                        <span className="flex items-center space-x-1">
                                                            <BookOpenIcon className="h-3 w-3" />
                                                            <span>{quiz.noOfQuestions} questions</span>
                                                        </span>
                                                        <span className="flex items-center space-x-1">
                                                            <span>⏱️</span>
                                                            <span>{quiz.duration}</span>
                                                        </span>
                                                    </div>
                                                    <div className="text-teal-400 group-hover:text-white transition-colors">
                                                        <ArrowLeftIcon className="h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    ) : (
                        <section className="min-h-[600px]">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-teal-500/20 to-purple-600/20 backdrop-blur-xl px-4 py-3 border-b border-white/10">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleBackToQuizzes}
                                        className="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm"
                                    >
                                        <ArrowLeftIcon className="h-5 w-5" />
                                        <span>Back to Quizzes</span>
                                    </button>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white">
                                            {selectedQuiz?.title} Quiz
                                        </h1>
                                        <p className="text-gray-300 mt-1 text-sm">Challenge yourself and learn something new</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 md:p-6 lg:p-8">
                                {showResults ? (
                                    <div className="max-w-3xl mx-auto text-center">
                                        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-8 border border-emerald-400/30 shadow-2xl">
                                            <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
                                                <Trophy className="h-8 w-8 text-white" />
                                            </div>
                                            <h2 className="text-3xl font-bold text-white mb-4">🎉 Quiz Completed!</h2>
                                            <div className="mb-8">
                                                <p className="text-base text-gray-300 mb-3">Your final score is</p>
                                                <div className="text-4xl font-bold mb-2">
                                                    <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                                        {score}
                                                    </span>
                                                    <span className="text-white/60 text-2xl"> / </span>
                                                    <span className="text-white text-2xl">
                                                        {currentQuestions.length}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-white/20 rounded-full h-3 mb-4">
                                                    <div 
                                                        className="bg-gradient-to-r from-teal-400 to-emerald-500 h-3 rounded-full transition-all duration-1000"
                                                        style={{ width: `${(score / currentQuestions.length) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-base text-gray-300">
                                                    {score === currentQuestions.length ? "Perfect Score! 🌟" : 
                                                    score >= currentQuestions.length * 0.8 ? "Excellent Work! 🔥" :
                                                    score >= currentQuestions.length * 0.6 ? "Good Job! 👍" : "Keep Learning! 💪"}
                                                </p>
                                            </div>
                                            {!currentUser && (
                                                <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl backdrop-blur-sm">
                                                    <p className="text-yellow-300 text-sm">
                                                        🔒 Log in to save your quiz results and track your progress!
                                                    </p>
                                                </div>
                                            )}
                                            <button
                                                onClick={handleRestartQuiz}
                                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-[#167468] text-white rounded-lg hover:opacity-95 transition-all duration-300 transform hover:scale-105 shadow-xl text-sm"
                                            >
                                                🔄 Restart Quiz
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-5xl mx-auto">
                                        {/* Progress */}
                                        <div className="mb-8">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="text-white">
                                                    <p className="text-xs text-gray-400">Progress</p>
                                                    <p className="text-base font-semibold">
                                                        Question {currentQuestionIndex + 1} of {currentQuestions.length}
                                                    </p>
                                                </div>
                                                <div className="text-right text-white">
                                                    <p className="text-xs text-gray-400">Score</p>
                                                    <p className="text-base font-semibold text-teal-400">
                                                        {score}/{currentQuestions.length}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                                                <div 
                                                    className="bg-gradient-to-r from-teal-400 to-emerald-500 h-2 rounded-full transition-all duration-500 shadow-lg"
                                                    style={{ width: `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Question */}
                                        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-5 md:p-6 mb-6 border border-white/20 shadow-2xl">
                                            <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                                                {currentQuestion?.question}
                                            </h2>
                                        </div>

                                        {/* Options */}
                                        <div className="space-y-4 mb-8">
                                            {currentQuestion?.options.map((option, index) => {
                                                const isCorrectOption = option === currentQuestion.correctAnswer;
                                                const isSelected = selectedOption === option;

                                                let buttonClasses = "w-full p-4 text-left border-2 rounded-xl transition-all duration-300 group relative overflow-hidden ";
                                                
                                                if (!isOptionSelected) {
                                                    buttonClasses += "border-white/20 bg-white/5 hover:border-teal-400/60 hover:bg-teal-500/20 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-transparent transform hover:scale-102 hover:-translate-y-1";
                                                } else {
                                                    buttonClasses += "cursor-not-allowed ";
                                                    if (isSelected && isCorrectOption) {
                                                        buttonClasses += "border-emerald-400 bg-emerald-500/20 text-emerald-100 shadow-xl shadow-emerald-500/20";
                                                    } else if (isSelected && !isCorrectOption) {
                                                        buttonClasses += "border-red-400 bg-red-500/20 text-red-100 shadow-xl shadow-red-500/20";
                                                    } else if (!isSelected && isCorrectOption) {
                                                        buttonClasses += "border-emerald-400 bg-emerald-500/20 text-emerald-100 shadow-xl shadow-emerald-500/20";
                                                    } else {
                                                        buttonClasses += "border-white/20 bg-white/5 text-gray-400";
                                                    }
                                                }

                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleOptionSelect(option)}
                                                        disabled={isOptionSelected}
                                                        className={buttonClasses}
                                                    >
                                                        {!isOptionSelected && (
                                                            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/5 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                        )}
                                                        <div className="relative flex items-center gap-4">
                                                            <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center flex-shrink-0 font-bold">
                                                                <span className="text-base">
                                                                    {String.fromCharCode(65 + index)}
                                                                </span>
                                                            </div>
                                                            <span className="text-base text-white flex-1">{option}</span>
                                                            {isOptionSelected && isSelected && (
                                                                <div className="flex-shrink-0">
                                                                    {isCorrectOption ? 
                                                                        <span className="text-xl">✅</span> : 
                                                                        <span className="text-xl">❌</span>
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Feedback */}
                                        {feedbackMessage && (
                                            <div className={`mb-6 p-4 rounded-xl border backdrop-blur-xl ${
                                                feedbackMessage.startsWith('Correct') 
                                                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100' 
                                                    : 'bg-red-500/20 border-red-400/40 text-red-100'
                                            }`}>
                                                <p className="text-base font-semibold flex items-center gap-2">
                                                    {feedbackMessage.startsWith('Correct') ? '🎉' : '�'} 
                                                    {feedbackMessage}
                                                </p>
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        <div className="flex justify-center">
                                            <button
                                                onClick={handleNextQuestion}
                                                disabled={!isOptionSelected}
                                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-[#167468] text-white rounded-lg hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-base transform hover:scale-105 shadow-2xl disabled:shadow-none"
                                            >
                                                {currentQuestionIndex < currentQuestions.length - 1 ? '➡️ Next Question' : '🏁 Finish Quiz'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};

export default QuizzesPage;