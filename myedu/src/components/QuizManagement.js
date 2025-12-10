
// src/components/QuizManagement.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    PlusCircle, Edit, Trash2, X, AlertCircle, CheckCircle, Info, Send,
    BarChart2, Plus as PlusIcon, Code as CodeIcon, Binary as BinaryIcon,
    Globe as GlobeIcon, Database as DatabaseIcon, Cpu as CpuIcon,
    BookOpen as BookOpenIcon, Lightbulb as LightbulbIcon, Sparkles as SparklesIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import './AdminDashboard.css'; // Assuming you have a common CSS file for admin dashboard styles

const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } = window.Recharts || {};
// const API_BASE_URL = 'http://localhost:3001/api';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

// Quill editor removed; use CourseEditor or other editor when needed.

const iconMap = {
    Code: CodeIcon, BinaryIcon: BinaryIcon, GlobeIcon: GlobeIcon, DatabaseIcon: DatabaseIcon, CpuIcon: CpuIcon, BookOpenIcon: BookOpenIcon, LightbulbIcon: LightbulbIcon, SparklesIcon: SparklesIcon
};

const MessageBox = ({ type, text }) => {
    if (!text) return null;
    let Icon;
    let classes = 'admin-message-box ';
    switch (type) {
        case 'info': Icon = Info; classes += 'admin-message-info'; break;
        case 'success': Icon = CheckCircle; classes += 'admin-message-success'; break;
        case 'error': Icon = AlertCircle; classes += 'admin-message-error'; break;
        default: Icon = Info; classes += 'admin-message-info';
    }
    return (
        <div className={classes}>
            {Icon && <Icon size={20} />}
            {text}
        </div>
    );
};

const ConfirmationModal = ({ show, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', confirmButtonClass = 'admin-button-danger' }) => {
    if (!show) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content-box">
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button onClick={onCancel} className="modal-close-button">
                        <X size={24} />
                    </button>
                </div>
                <p className="modal-message-text">{message}</p>
                <div className="modal-actions-footer">
                    <button onClick={onCancel} className="modal-button-base modal-button-cancel">
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} className={`modal-button-base ${confirmButtonClass}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const QuestionStatsModal = ({ show, quiz, onClose }) => {
    if (!show || !quiz || !quiz.questions) return null;
    const questionAccuracyData = quiz.questions.map((q, index) => {
        const totalSelections = Object.values(q.selectedOptionCounts || {}).reduce((sum, count) => sum + count, 0);
        const correctSelections = q.selectedOptionCounts?.[q.correctAnswer] || 0;
        const incorrectSelections = totalSelections - correctSelections;
        return { name: `Q${index + 1}`, Correct: correctSelections, Incorrect: incorrectSelections, Total: totalSelections, question: q.question };
    });
    const averageScore = quiz.attemptsCount > 0 ? (quiz.totalScoreSum / quiz.attemptsCount) : 0;
    const passRate = (averageScore / quiz.totalMarks) * 100;
    const failRate = 100 - passRate;
    const passFailData = [{ name: 'Passed', value: passRate > 0 ? passRate : 0 }, { name: 'Failed', value: failRate > 0 ? failRate : 0 }];
    const PIE_COLORS_STATS = ['#22c55e', '#ef4444'];
    return (
        <div className="modal-overlay modal-overlay-overflow">
        <div className="modal-content-box stats-modal-content">
        <div className="stats-modal-header">
        <h3 className="stats-modal-title">Statistics for: {quiz.title}</h3>
        <button onClick={onClose} className="modal-close-button"><X size={28} /></button>
        </div>
        <div className="stats-grid mb-8"><div className="stats-summary-card">
        <h4 className="stats-summary-title">Overall Quiz Performance</h4>
        <p className="stats-summary-text">Total Attempts: <span className="stats-highlight-teal">{quiz.attemptsCount}</span></p>
        <p className="stats-summary-text">Average Score: <span className="stats-highlight-blue">{averageScore.toFixed(1)} / {quiz.totalMarks}</span></p>
        <p className="stats-summary-text">Pass Mark: <span className="stats-highlight-purple">{quiz.passMark}</span></p></div>
        <div className="chart-card">
            <h4 className="chart-title">Overall Pass/Fail Rate</h4>
            <div className="chart-responsive-container">
                {PieChart && (<ResponsiveContainer width="100%" height={250}><PieChart><Pie data={passFailData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} (${percent.toFixed(0)}%)`} >{passFailData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS_STATS[index % PIE_COLORS_STATS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: 'var(--color-card-bg-light)', borderColor: 'var(--color-border-light)', color: 'var(--color-text-light)' }} itemStyle={{ color: 'var(--color-text-light)' }} /><Legend wrapperStyle={{ color: 'var(--color-text-light)' }} /></PieChart></ResponsiveContainer>)}</div></div></div><h4 className="stats-summary-title">Question-wise Performance</h4>{BarChart && (<ResponsiveContainer width="100%" height={400}><BarChart data={questionAccuracyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" className="chart-grid-stroke" /><XAxis dataKey="name" className="chart-axis-tick" /><YAxis className="chart-axis-tick" /><Tooltip cursor={{ fill: 'rgba(0,0,0,0.1)' }} contentStyle={{ backgroundColor: 'var(--color-card-bg-light)', borderColor: 'var(--color-border-light)', color: 'var(--color-text-light)' }} itemStyle={{ color: 'var(--color-text-light)' }} formatter={(value, name, props) => { if (name === 'Correct') return [`Correct: ${value}`, props.payload.question]; if (name === 'Incorrect') return [`Incorrect: ${value}`, props.payload.question]; return [value, name]; }} /><Legend wrapperStyle={{ color: 'var(--color-text-light)' }} /><Bar dataKey="Correct" stackId="a" className="chart-bar-green" name="Correct Answers" /><Bar dataKey="Incorrect" stackId="a" className="chart-bar-light-red" name="Incorrect Answers" /></BarChart></ResponsiveContainer>)}
                <div className="modal-actions-footer">
                    <button onClick={onClose} className="modal-button-base modal-button-cancel">Close</button>
                </div>
                </div>
                </div>);
};






const QuizManagement = () => {
    const { currentUser, logout } = useAuth();
    // const adminToken = currentUser?.token;
    const { openModal } = useModal();

    const [quizzes, setQuizzes] = useState([]);
    const [courses, setCourses] = useState([]);
    const [newQuiz, setNewQuiz] = useState({ courseId: '', title: '', description: '', icon: 'CodeIcon', noOfQuestions: '', totalMarks: '', passMark: '', duration: '', isTimedQuiz: true, attemptsCount: 0, totalScoreSum: 0, isReleased: true, questions: [], allowDirectResultAccess: true });
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [isAddQuizModalOpen, setIsAddQuizModalOpen] = useState(false);
    const [isEditQuizModalOpen, setIsEditModalOpen] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [quizToDelete, setQuizToDelete] = useState(null);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [quizForStats, setQuizForStats] = useState(null);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [questionFormText, setQuestionFormText] = useState('');
    const [questionFormType, setQuestionFormType] = useState('Multiple choice');
    const [questionFormOptions, setQuestionFormOptions] = useState(['', '', '']);
    const [questionFormCorrectAnswer, setQuestionFormCorrectAnswer] = useState('');
    const [questionFormIsTimed, setQuestionFormIsTimed] = useState(true);
    const [questionFormTimeLimit, setQuestionFormTimeLimit] = useState('');
    const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

    // Setup fetch options to include cookies
    const fetchOptions = useMemo(() => ({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 🎯 FIX: Tell the browser to send the HTTP-only cookie
    }), []);

    const fetchQuizzes = useCallback(async () => {
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });

        // if (!adminToken) {
        //     setFormMessage({ type: 'error', text: 'Authentication token missing.' });
        //     setIsLoading(false);
        //     return;
        // }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/quizzes`, { ...fetchOptions, method: 'GET'});

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication token missing or expired. Please log in again.' });
                logout(); 
                setIsLoading(false);
                return;
            }

            const data = await response.json();

            if (response.ok) {
                setQuizzes(data);
                setFormMessage({ type: 'success', text: 'Quizzes loaded.' });
            }
            else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to fetch quizzes.' });

                // if (response.status === 401 || response.status === 403) logout();
            }

        } catch (error) {
            console.error('Error fetching quizzes:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to fetch quizzes.' });
        }
        finally { setIsLoading(false); }
    }, [logout, fetchOptions]);

    const fetchCoursesForQuizzes = useCallback(async () => {
        // if (!adminToken) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/courses`, { ...fetchOptions, method: 'GET' });

            if (response.status === 401 || response.status === 403) {
                 // If auth fails here, it will be caught by fetchQuizzes check, but we handle it defensively
                 return;
            }

            const data = await response.json();

            if (response.ok) {
                setCourses(data);

            } else {
                console.error('Failed to fetch courses for quiz management:', data.msg);
            }

        } catch (error) { console.error('Network error fetching courses for quiz management:', error); }
    }, [fetchOptions]);

    useEffect(() => {
        fetchQuizzes();
        fetchCoursesForQuizzes();
    }, [fetchQuizzes, fetchCoursesForQuizzes]);

    const handleAddQuiz = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });

        // if (!adminToken) {
        //     setFormMessage({ type: 'error', text: 'Authentication token missing.' });
        //     setIsLoading(false); return;
        // }

        if (!newQuiz.courseId || !newQuiz.title || !newQuiz.description || !newQuiz.icon || !newQuiz.noOfQuestions || parseInt(newQuiz.noOfQuestions) <= 0 || !newQuiz.totalMarks || parseInt(newQuiz.totalMarks) <= 0 || !newQuiz.passMark || parseInt(newQuiz.passMark) < 0 || (newQuiz.isTimedQuiz && !newQuiz.duration.trim()))
        {
            setFormMessage({ type: 'error', text: 'All quiz details fields are required and must be valid. Duration is required for timed quizzes.' });
            setIsLoading(false); return;
        }
        if (newQuiz.questions.length === 0) {
            setFormMessage({ type: 'error', text: 'Please add at least one question to the quiz.' });
            setIsLoading(false); return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/quizzes`, { method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({ ...newQuiz, noOfQuestions: parseInt(newQuiz.noOfQuestions, 10), totalMarks: parseInt(newQuiz.totalMarks, 10), passMark: parseInt(newQuiz.passMark, 10) }), credentials: 'include', });

            if (response.status === 401 || response.status === 403) {
                 // If auth fails here, it will be caught by fetchQuizzes check, but we handle it defensively
                 return;
            }

            const data = await response.json();

            if (response.ok) {
                setQuizzes([...quizzes, data]);
                setNewQuiz({ courseId: '', title: '', description: '', icon: 'CodeIcon', noOfQuestions: '', totalMarks: '', passMark: '', duration: '', isTimedQuiz: true, attemptsCount: 0, totalScoreSum: 0, isReleased: true, questions: [], allowDirectResultAccess: true });
                setFormMessage({ type: 'success', text: 'Quiz added successfully!' });
                resetQuestionForm();
                setIsAddQuizModalOpen(false);
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to add quiz.' });
                // if (response.status === 401 || response.status === 403) logout();
            }
        } catch (error) {
            console.error('Error adding quiz:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to add quiz.' });
        }
        finally { setIsLoading(false); }
    };

    const resetQuestionForm = () => {
        setQuestionFormText('');
        setQuestionFormType('Multiple choice');
        setQuestionFormOptions(['', '', '']);
        setQuestionFormCorrectAnswer('');
        setQuestionFormIsTimed(true);
        setQuestionFormTimeLimit('');
        setEditingQuestionIndex(null);
    };

    const startEditingQuiz = (quiz) => {
        setEditingQuiz(JSON.parse(JSON.stringify({
            ...quiz, questions: quiz.questions || [], noOfQuestions: quiz.noOfQuestions, totalMarks: quiz.totalMarks, passMark: quiz.passMark, isTimedQuiz: quiz.isTimedQuiz ?? true, attemptsCount: quiz.attemptsCount ?? 0, totalScoreSum: quiz.totalScoreSum ?? 0, isReleased: quiz.isReleased ?? true, allowDirectResultAccess: quiz.allowDirectResultAccess ?? true, duration: quiz.duration || (quiz.isTimedQuiz ? '' : 'No Limit')
        })));
        setIsEditModalOpen(true);
        resetQuestionForm();
    };

    const handleQuizDetailsChange = (e, targetStateSetter) => {
        const { name, value, type } = e.target;
        targetStateSetter(prev => ({ ...prev, [name]: (type === 'number' ? parseInt(value, 10) || '' : value) }));
    };

    const handleIsTimedQuizChange = (e, targetStateSetter) => {
        const isTimed = e.target.value === 'true';
        targetStateSetter(prev => ({ ...prev, isTimedQuiz: isTimed, duration: isTimed ? (prev.duration === 'No Limit' ? '' : prev.duration) : 'No Limit' }));
    };

    const handleResultAccessChange = (e, targetStateSetter) => {
        const value = e.target.value === 'true';
        targetStateSetter(prev => ({ ...prev, allowDirectResultAccess: value }));
    };

    const handleUpdateQuiz = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        
        // if (!adminToken || !editingQuiz?._id) {
        //     setFormMessage({ type: 'error', text: 'Authentication token or quiz ID missing.' });
        //     setIsLoading(false); return;
        // }

        if (!editingQuiz.courseId || !editingQuiz.title || !editingQuiz.description || !editingQuiz.icon || !editingQuiz.noOfQuestions || parseInt(editingQuiz.noOfQuestions) <= 0 || !editingQuiz.totalMarks || parseInt(editingQuiz.totalMarks) <= 0 || !editingQuiz.passMark || parseInt(editingQuiz.passMark) < 0 || (editingQuiz.isTimedQuiz && !editingQuiz.duration.trim()))
        {
            setFormMessage({ type: 'error', text: 'All quiz details fields are required and must be valid. Duration is required for timed quizzes.' }); setIsLoading(false); return;
        }
        if (editingQuiz.questions.length === 0) {
            setFormMessage({ type: 'error', text: 'Please add at least one question to the quiz.' });
            setIsLoading(false); return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/quizzes/${editingQuiz._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({ ...editingQuiz, noOfQuestions: parseInt(editingQuiz.noOfQuestions, 10), totalMarks: parseInt(editingQuiz.totalMarks, 10), passMark: parseInt(editingQuiz.passMark, 10) }), credentials: 'include', });
            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                logout(); 
                setIsLoading(false);
                setIsEditModalOpen(false);
                return;
            }
            const data = await response.json();
            if (response.ok) {
                setQuizzes(quizzes.map(q => (q._id === data._id ? data : q)));
                setIsEditModalOpen(false);
                setEditingQuiz(null);
                setFormMessage({ type: 'success', text: 'Quiz updated successfully!' });
            }
            else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to update quiz.' });
            //     if (response.status === 401 || response.status === 403) logout();
             }
        }
        catch (error) {
            console.error('Error updating quiz:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to update quiz.' });
        } finally { setIsLoading(false); }
    };

    const confirmDeleteQuiz = (quizId) => {
        setQuizToDelete(quizId);
        setIsDeleting(true);
    };

    const handleDeleteQuiz = async () => {
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });

        // if (!adminToken || !quizToDelete) {
        //     setFormMessage({ type: 'error', text: 'Authentication token or quiz ID missing for deletion.' });
        //     setIsLoading(false); return;
        // }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/quizzes/${quizToDelete}`, {
                method: 'DELETE', 
                // headers: { 'x-auth-token': adminToken },
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                logout(); 
                setIsLoading(false);
                return;
            }

            const data = await response.json();
            
            if (response.ok) {
                setQuizzes(quizzes.filter(q => q._id !== quizToDelete));
                setFormMessage({ type: 'success', text: data.msg || 'Quiz deleted successfully!' });
            }
            else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to delete quiz.' });
                // if (response.status === 401 || response.status === 403) logout();
            }
        } catch (error) {
            console.error('Error deleting quiz:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to delete quiz.' });
        }
        finally { setIsDeleting(false); setQuizToDelete(null); setIsLoading(false); }
    };

    const handleOptionChange = (index, value) => {
        const updatedOptions = [...questionFormOptions];
        updatedOptions[index] = value;
        setQuestionFormOptions(updatedOptions);
    };

    const handleAddOptionField = () => {
        setQuestionFormOptions(prev => [...prev, '']);
    };

    const handleRemoveOptionField = (indexToRemove) => {
        setQuestionFormOptions(prev => {
            const newOptions = prev.filter((_, index) => index !== indexToRemove);
            if (questionFormCorrectAnswer === prev[indexToRemove]) {
                setQuestionFormCorrectAnswer('');
            }
            return newOptions;
        });
    };

    const handleQuestionTypeChange = (e) => {
        const newType = e.target.value;
        setQuestionFormType(newType);
        if (newType === 'True or False') {
            setQuestionFormOptions(['True', 'False']);
            if (questionFormCorrectAnswer !== 'True' && questionFormCorrectAnswer !== 'False')
            {
                setQuestionFormCorrectAnswer('');
            }
        } else {
            setQuestionFormOptions(['', '', '', '']);
            setQuestionFormCorrectAnswer('');
        }
    };

    const handleQuestionIsTimedChange = (e) => {
        const isTimed = e.target.value === 'true';
        setQuestionFormIsTimed(isTimed);
        setQuestionFormTimeLimit(isTimed ? questionFormTimeLimit : '');
    };

    const handleSaveQuestionToQuiz = (quizStateSetter, isEditMode) => {
        if (!questionFormText.trim()) {
            setFormMessage({ type: 'error', text: 'Question text is required.' }); return;
        }
        const filledOptions = questionFormOptions.filter(opt => opt.trim() !== '');

        if (questionFormType === 'Multiple choice' && filledOptions.length < 2) {
            setFormMessage({ type: 'error', text: 'Multiple choice questions require at least two non-empty options.' }); return;
        }

        if (questionFormType === 'True or False' && (filledOptions.length !== 2 || filledOptions[0] !== 'True' || filledOptions[1] !== 'False')) {
            setFormMessage({ type: 'error', text: 'True/False questions must have "True" and "False" as options.' }); return;
        }

        if (!questionFormCorrectAnswer.trim()) {
            setFormMessage({ type: 'error', text: 'Please select a correct answer.' }); return;
        }

        if (!filledOptions.includes(questionFormCorrectAnswer.trim())) {
            setFormMessage({ type: 'error', text: 'Correct answer must be one of the provided options.' }); return;
        }

        if (questionFormIsTimed && (questionFormTimeLimit === '' || parseInt(questionFormTimeLimit) <= 0)) {
            setFormMessage({ type: 'error', text: 'Time limit per question is required and must be a positive number for timed questions.' }); return;
        }

        const questionToSave = {
            question: questionFormText.trim(),
            type: questionFormType,
            options: filledOptions,
            correctAnswer: questionFormCorrectAnswer.trim(),
            isTimedPerQuestion: questionFormIsTimed,
            questionTimeLimit: questionFormIsTimed ? parseInt(questionFormTimeLimit, 10) : null,
            selectedOptionCounts: filledOptions.reduce((acc, option) => ({ ...acc, [option]: 0 }), {})
        };
        quizStateSetter(prev => {
            const updatedQuestions = [...(prev.questions || [])];
            if (isEditMode && editingQuestionIndex !== null) {
                updatedQuestions[editingQuestionIndex] = questionToSave;
                setFormMessage({ type: 'success', text: 'Question updated in quiz draft!' });
            }
            else {
                updatedQuestions.push(questionToSave); setFormMessage({ type: 'success', text: `Question ${updatedQuestions.length} added. Add next one!` });
            }
            return { ...prev, questions: updatedQuestions };
        });
        resetQuestionForm();
    };

    const handleRemoveQuestionFromQuiz = (index, quizStateSetter) => {
        quizStateSetter(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
        setFormMessage({ type: 'info', text: 'Question removed from quiz draft.' });
        if (editingQuestionIndex === index) {
            resetQuestionForm();
        }
    };

    const handleEditQuestion = (question, index) => {
        setQuestionFormText(question.question);
        setQuestionFormType(question.type || 'Multiple choice');
        setQuestionFormOptions(question.options);
        setQuestionFormCorrectAnswer(question.correctAnswer);
        setQuestionFormIsTimed(question.isTimedPerQuestion ?? true);
        setQuestionFormTimeLimit(question.questionTimeLimit ?? '');
        setEditingQuestionIndex(index);
        setFormMessage({ type: 'info', text: 'Editing question. Make changes and click "Update Question".' });
    };

    const handleCancelEditQuestion = () => {
        resetQuestionForm();
        setFormMessage({ type: 'info', text: 'Question editing cancelled.' });
    };
    const getCourseNameById = (courseId) => {
        const course = courses.find(c => c._id === courseId); return course ? course.title : 'Unknown Course';
    };
    const handleReleaseResults = async (quizId) => {
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });

        try {
            const response = await fetch(`${API_BASE_URL}/admin/quizzes/${quizId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isReleased: true }),
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                logout(); 
                setIsLoading(false);
                return;
            }

            const data = await response.json();

            if (response.ok) {
                setQuizzes(quizzes.map(quiz => quiz._id === data._id ? data : quiz));
                setFormMessage({ type: 'success', text: 'Results released for selected quiz!' });
            }
            else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to release results.' });
            }
        } catch (error) {
            console.error('Error releasing results:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewQuestionStats = (quiz) => {
        setQuizForStats(quiz); setIsStatsModalOpen(true);
    };
    const handleSendNotification = () => {
        if (notificationMessage.trim() === '') {
            setFormMessage({ type: 'error', text: 'Notification message cannot be empty!' }); return;
        }
        openModal('Notification Sent', `Notification sent to all attempted candidates: "${notificationMessage}"`); setNotificationMessage('');
    };

    return (
        <div className="admin-page-section-container">
            <nav className="admin-quiz-nav">
                <h1 className="admin-quiz-nav-title">Quiz Admin Dashboard</h1>
                <div className="admin-quiz-nav-actions">
                    <div className="admin-quiz-nav-notification-container">
                        <input type="text" value={notificationMessage} onChange={(e) => setNotificationMessage(e.target.value)} placeholder="Type notification message..." className="admin-quiz-nav-input" />
                        <button onClick={handleSendNotification} className="admin-quiz-nav-button admin-quiz-nav-button-notify" title="Send Notification to All Attempted"><Send size={18} /> <span className="admin-quiz-nav-button-text">Notify</span></button>
                    </div>
                    <button onClick={() => setIsAddQuizModalOpen(true)} className="admin-quiz-nav-button admin-quiz-nav-button-add">Add Quiz</button>
                </div>
            </nav>
            <main className="admin-quiz-main-content">
                <MessageBox type={formMessage.type} text={formMessage.text} />
                <section className="admin-section-spacing">
                    <h3 className="admin-section-title"><Info size={26} className="text-purple-600" /> Existing Quizzes</h3>
                    {isLoading ? (<p className="admin-loading-message">Loading quizzes...</p>) : quizzes.length === 0 ? (<p className="admin-message-info">No quizzes found. Add a new quiz above!</p>) : (
                        <div className="admin-quiz-list">
                            {quizzes.map((quiz) => (
                                <div key={quiz._id} className="admin-quiz-list-item">
                                    <div className="admin-quiz-list-item-header">
                                        {iconMap[quiz.icon] ? React.createElement(iconMap[quiz.icon], { size: 48, className: 'admin-quiz-icon' }) : null}
                                        <div>
                                            <h4 className="admin-quiz-title">{quiz.title}</h4>
                                            <p className="admin-quiz-course-name">{getCourseNameById(quiz.courseId)}</p>
                                            <p className="admin-quiz-details-row">
                                                <span className="admin-quiz-detail-item"><Info size={16} className="admin-quiz-detail-icon" />{quiz.noOfQuestions} Questions</span>
                                                <span className="admin-quiz-detail-item"><Info size={16} className="admin-quiz-detail-icon" />{quiz.duration}</span>
                                                <span className="admin-quiz-detail-item"><Info size={16} className="admin-quiz-detail-icon" />Avg. Score: {quiz.attemptsCount > 0 ? (quiz.totalScoreSum / quiz.attemptsCount).toFixed(1) : 'N/A'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="admin-quiz-actions">
                                        <button onClick={() => handleViewQuestionStats(quiz)} className="admin-action-button admin-action-button-stats" title="View Question Statistics"><BarChart2 size={20} /> Stats</button>
                                        {quiz.allowDirectResultAccess ? (<span className="admin-quiz-results-direct">Results Direct</span>) : (quiz.isReleased ? (<span className="admin-quiz-results-released">Results Released</span>) : (<button onClick={() => handleReleaseResults(quiz._id)} className="admin-quiz-release-button">Release Results</button>))}
                                        <button onClick={() => startEditingQuiz(quiz)} title="Edit Quiz" className="admin-action-button admin-action-button-edit"><Edit size={20} /></button>
                                        <button onClick={() => confirmDeleteQuiz(quiz._id)} className="admin-action-button admin-action-button-delete" title="Delete Quiz"><Trash2 size={20} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
            {isAddQuizModalOpen && (
                <div className="modal-overlay modal-overlay-overflow">
                    <div className="modal-content-box modal-content-box-lg">
                        <div className="modal-header"><h3 className="modal-title">Add New Quiz</h3><button onClick={() => setIsAddQuizModalOpen(false)} className="modal-close-button"><X size={28} /></button></div>
                        <form onSubmit={handleAddQuiz} className="admin-form-spacing">

                            <div className="form-group"><label htmlFor="addQuizCourse" className="form-label">Course *</label><select id="addQuizCourse" name="courseId" value={newQuiz.courseId} onChange={(e) => handleQuizDetailsChange(e, setNewQuiz)} required className="form-select"><option value="">Select Course</option>{courses.map(course => (<option key={course._id} value={course._id}>{course.title}</option>))}</select></div>

                            <div className="form-group"><label htmlFor="addQuizTitle" className="form-label">Quiz Title *</label><input type="text" id="addQuizTitle" name="title" value={newQuiz.title} onChange={(e) => handleQuizDetailsChange(e, setNewQuiz)} required className="form-input" placeholder="e.g., Introduction to React" /></div>


                            <div className="admin-form-grid"><div className="form-group"><label htmlFor="addNoOfQuestions" className="form-label">No. of Questions *</label><input type="number" id="addNoOfQuestions" name="noOfQuestions" value={newQuiz.noOfQuestions} onChange={(e) => handleQuizDetailsChange(e, setNewQuiz)} required min="1" className="form-input" /></div><div className="form-group"><label htmlFor="addTotalMarks" className="form-label">Total Marks *</label><input type="number" id="addTotalMarks" name="totalMarks" value={newQuiz.totalMarks} onChange={(e) => handleQuizDetailsChange(e, setNewQuiz)} required min="1" className="form-input" /></div></div>

                            <div className="admin-form-grid"><div className="form-group"><label htmlFor="addPassMark" className="form-label">Pass Mark *</label><input type="number" id="addPassMark" name="passMark" value={newQuiz.passMark} onChange={(e) => handleQuizDetailsChange(e, setNewQuiz)} required min="0" className="form-input" /></div><div className="form-group"><label htmlFor="addIsTimedQuiz" className="form-label">Quiz Timing</label><select id="addIsTimedQuiz" name="isTimedQuiz" value={newQuiz.isTimedQuiz} onChange={(e) => handleIsTimedQuizChange(e, setNewQuiz)} className="form-select"><option value={true}>Timed Quiz</option><option value={false}>No Time Limit</option></select></div></div>

                            {newQuiz.isTimedQuiz && (<div className="form-group"><label htmlFor="addDuration" className="form-label">Duration (e.g., "30 Minutes") *</label><input type="text" id="addDuration" name="duration" value={newQuiz.duration} onChange={(e) => handleQuizDetailsChange(e, setNewQuiz)} required={newQuiz.isTimedQuiz} className="form-input" placeholder="e.g., 30 Minutes or 02:05 AM" /></div>)}

                            <div className="form-group"><label htmlFor="newQuizDescription" className="form-label">Quiz Description</label><textarea id="newQuizDescription" name="description" value={newQuiz.description} onChange={(e) => handleQuizDetailsChange(e, setNewQuiz)} rows="3" required className="form-textarea resize-y" placeholder="Brief description of the quiz content."></textarea></div>

                            <div className="form-group"><label htmlFor="newQuizIcon" className="form-label">Icon Name (e.g., CodeIcon)</label><input type="text" id="newQuizIcon" name="icon" value={newQuiz.icon} onChange={(e) => handleQuizDetailsChange(e, setNewQuiz)} required className="form-input" placeholder="e.g., CodeIcon, BookOpen, Brain" /></div>

                            <div className="form-group"><label htmlFor="newQuizResultAccess" className="form-label">Result Access</label><select id="newQuizResultAccess" name="allowDirectResultAccess" value={newQuiz.allowDirectResultAccess} onChange={(e) => handleResultAccessChange(e, setNewQuiz)} className="form-select"><option value={true}>Allow Direct Access (Show immediately)</option><option value={false}>Admin Release (Release later)</option></select></div>

                            <h4 className="admin-form-section-title">Add Questions</h4><div className="admin-form-question-builder"><div className="form-group"><label htmlFor="newQuestionText" className="form-label">Question Text</label><input type="text" id="newQuestionText" value={questionFormText} onChange={(e) => setQuestionFormText(e.target.value)} className="form-input" placeholder="Enter your question here..." /></div><div className="form-group"><label htmlFor="questionType" className="form-label">Question Type</label><select id="questionType" value={questionFormType} onChange={handleQuestionTypeChange} className="form-select"><option value="Multiple choice">Multiple choice</option><option value="True or False">True or False</option></select></div><div className="form-group"><label htmlFor="questionTiming" className="form-label">Per-Question Timing</label><select id="questionTiming" value={questionFormIsTimed} onChange={handleQuestionIsTimedChange} className="form-select"><option value={true}>Time Allowed</option><option value={false}>No Limit</option></select></div>

                                {questionFormIsTimed && (<div className="form-group"><label htmlFor="questionTimeLimit" className="form-label">Time Limit (seconds) *</label><input type="number" id="questionTimeLimit" value={questionFormTimeLimit} onChange={(e) => setQuestionFormTimeLimit(e.target.value)} required={questionFormIsTimed} min="1" className="form-input" placeholder="e.g., 30" /></div>)}
                                {questionFormType === 'Multiple choice' && questionFormOptions.map((option, index) => (<div key={index} className="form-group form-group-flex-row"><input type="text" id={`option-${index}`} value={option} onChange={(e) => handleOptionChange(index, e.target.value)} className="form-input flex-grow" placeholder={`Choice ${String.fromCharCode(65 + index)}`} /> <label htmlFor={`correct-option-${index}`} className="form-toggle-label">
    <input
        type="checkbox"
        id={`correct-option-${index}`}
        className="sr-only"
        checked={questionFormCorrectAnswer === option}
        onChange={(e) => setQuestionFormCorrectAnswer(e.target.checked ? option : '')}
        disabled={option.trim() === ''}
    />
    <div className="form-toggle-switch">
        <div className="form-toggle-slider"></div>
        <div className="form-toggle-dot"></div>
    </div>
    <span className="ml-3 text-gray-700 text-sm font-medium">Correct</span>
</label> {questionFormOptions.length > 2 && (<button type="button" onClick={() => handleRemoveOptionField(index)} className="admin-action-button delete-button" title="Remove Option"><Trash2 size={20} /></button>)}</div>))}

                                {questionFormType === 'Multiple choice' && questionFormOptions.length < 5 && (<button type="button" onClick={handleAddOptionField} className="admin-button-secondary admin-button-full-width"><PlusIcon size={18} className="icon-mr" /> Add New Option</button>)}
                                {questionFormType === 'True or False' && (<div className="space-y-2">{['True', 'False'].map((option, index) => (<div key={index} className="form-group form-group-flex-row"><input type="text" id={`tf-option-${index}`} value={option} readOnly className="form-input flex-grow" /><label htmlFor={`tf-correct-option-${index}`} className="form-toggle-label"><div className="form-toggle-switch"><input type="checkbox" id={`tf-correct-option-${index}`} className="sr-only" checked={questionFormCorrectAnswer === option} onChange={(e) => setQuestionFormCorrectAnswer(e.target.checked ? option : '')} /><div className="form-toggle-slider"></div><div className="form-toggle-dot"></div></div><span className="ml-3 text-gray-700 text-sm font-medium">Correct</span></label></div>))}</div>)}

                                <div className="admin-form-actions-row"><button type="button" onClick={() => handleSaveQuestionToQuiz(setNewQuiz, editingQuestionIndex !== null)} className="admin-button-primary admin-button-full-width">{editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}</button>{editingQuestionIndex !== null && (<button type="button" onClick={handleCancelEditQuestion} className="admin-button-secondary admin-button-full-width">Cancel Edit</button>)}</div>
                            </div>
                            <h4 className="admin-form-section-title">Current Questions ({newQuiz.questions.length})</h4>
                            {newQuiz.questions.length === 0 ? (<p className="admin-message-info">No questions added yet. Add some above!</p>) : (<ul className="admin-question-list">{newQuiz.questions.map((q, idx) => (<li key={idx} className="admin-question-list-item"><span className="flex-grow">{q.question} (<span className="font-semibold text-green-700">Correct: {q.correctAnswer}</span>)</span><div className="admin-question-actions"><button type="button" onClick={() => handleEditQuestion(q, idx)} className="admin-action-button edit-button" title="Edit Question"><Edit size={20} /></button><button type="button" onClick={() => handleRemoveQuestionFromQuiz(idx, setNewQuiz)} className="admin-action-button delete-button" title="Remove Question"><Trash2 size={20} /></button></div></li>))}</ul>)}
                            <div className="admin-form-footer-buttons"><button type="button" onClick={() => setIsAddQuizModalOpen(false)} className="admin-button-secondary">Cancel</button><button type="submit" className="admin-button-primary">Add Quiz</button></div>
                        </form>
                    </div>
                </div>
            )}
            {isEditQuizModalOpen && editingQuiz && (
                <div className="modal-overlay modal-overlay-overflow">
                    <div className="modal-content-box modal-content-box-lg">
                        <div className="modal-header"><h3 className="modal-title">Edit Quiz</h3><button onClick={() => setIsEditModalOpen(false)} className="modal-close-button"><X size={28} /></button></div>
                        <form onSubmit={handleUpdateQuiz} className="admin-form-spacing">
                            <div className="form-group"><label htmlFor="editQuizCourse" className="form-label">Course *</label><select id="editQuizCourse" name="courseId" value={editingQuiz.courseId} onChange={(e) => handleQuizDetailsChange(e, setEditingQuiz)} required className="form-select"><option value="">Select Course</option>{courses.map(course => (<option key={course._id} value={course._id}>{course.title}</option>))}</select></div>
                            <div className="form-group"><label htmlFor="editQuizTitle" className="form-label">Quiz Title</label><input type="text" id="editQuizTitle" name="title" value={editingQuiz.title} onChange={(e) => handleQuizDetailsChange(e, setEditingQuiz)} required className="form-input" /></div>
                            <div className="admin-form-grid"><div className="form-group"><label htmlFor="editNoOfQuestions" className="form-label">No. of Questions *</label><input type="number" id="editNoOfQuestions" name="noOfQuestions" value={editingQuiz.noOfQuestions} onChange={(e) => handleQuizDetailsChange(e, setEditingQuiz)} required min="1" className="form-input" /></div><div className="form-group"><label htmlFor="editTotalMarks" className="form-label">Total Marks *</label><input type="number" id="editTotalMarks" name="totalMarks" value={editingQuiz.totalMarks} onChange={(e) => handleQuizDetailsChange(e, setEditingQuiz)} required min="1" className="form-input" /></div></div>
                            <div className="admin-form-grid"><div className="form-group"><label htmlFor="editPassMark" className="form-label">Pass Mark *</label><input type="number" id="editPassMark" name="passMark" value={editingQuiz.passMark} onChange={(e) => handleQuizDetailsChange(e, setEditingQuiz)} required min="0" className="form-input" /></div><div className="form-group"><label htmlFor="editIsTimedQuiz" className="form-label">Quiz Timing</label><select id="editIsTimedQuiz" name="isTimedQuiz" value={editingQuiz.isTimedQuiz} onChange={(e) => handleIsTimedQuizChange(e, setEditingQuiz)} className="form-select"><option value={true}>Timed Quiz</option><option value={false}>No Time Limit</option></select></div></div>
                            {editingQuiz.isTimedQuiz && (<div className="form-group"><label htmlFor="editDuration" className="form-label">Duration (e.g., "30 Minutes") *</label><input type="text" id="editDuration" name="duration" value={editingQuiz.duration} onChange={(e) => handleQuizDetailsChange(e, setEditingQuiz)} required={editingQuiz.isTimedQuiz} className="form-input" placeholder="e.g., 30 Minutes or 02:05 AM" /></div>)}
                            <div className="form-group"><label htmlFor="editQuizDescription" className="form-label">Quiz Description</label><textarea id="editQuizDescription" name="description" value={editingQuiz.description} onChange={(e) => handleQuizDetailsChange(e, setEditingQuiz)} rows="3" required className="form-textarea resize-y"></textarea></div>
                            <div className="form-group"><label htmlFor="editQuizIcon" className="form-label">Icon Name</label><input type="text" id="editQuizIcon" name="icon" value={editingQuiz.icon} onChange={(e) => handleQuizDetailsChange(e, setEditingQuiz)} required className="form-input" /></div>
                            <div className="form-group"><label htmlFor="editQuizResultAccess" className="form-label">Result Access</label><select id="editQuizResultAccess" name="allowDirectResultAccess" value={editingQuiz.allowDirectResultAccess} onChange={(e) => handleResultAccessChange(e, setEditingQuiz)} className="form-select"><option value={true}>Allow Direct Access (Show immediately)</option><option value={false}>Admin Release (Release later)</option></select></div>
                            <h4 className="admin-form-section-title">Edit Questions ({editingQuiz.questions.length})</h4>
                            <div className="admin-form-question-builder"><div className="form-group"><label htmlFor="editNewQuestionText" className="form-label">Question Text</label><input type="text" id="editNewQuestionText" value={questionFormText} onChange={(e) => setQuestionFormText(e.target.value)} className="form-input" /></div><div className="form-group"><label htmlFor="editQuestionType" className="form-label">Question Type</label><select id="editQuestionType" value={questionFormType} onChange={handleQuestionTypeChange} className="form-select"><option value="Multiple choice">Multiple choice</option><option value="True or False">True or False</option></select></div><div className="form-group"><label htmlFor="editQuestionTiming" className="form-label">Per-Question Timing</label><select id="editQuestionTiming" value={questionFormIsTimed} onChange={handleQuestionIsTimedChange} className="form-select"><option value={true}>Time Allowed</option><option value={false}>No Limit</option></select></div>
                                {questionFormIsTimed && (<div className="form-group"><label htmlFor="editQuestionTimeLimit" className="form-label">Time Limit (seconds) *</label><input type="number" id="editQuestionTimeLimit" value={questionFormTimeLimit} onChange={(e) => setQuestionFormTimeLimit(e.target.value)} required={editingQuiz.isTimedQuiz} min="1" className="form-input" placeholder="e.g., 30" /></div>)}
                                {questionFormType === 'Multiple choice' && questionFormOptions.map((option, index) => (<div key={index} className="form-group form-group-flex-row"><input type="text" id={`editOption-${index}`} value={option || ''} onChange={(e) => handleOptionChange(index, e.target.value)} className="form-input flex-grow" placeholder={`Choice ${index + 1}`} /><label htmlFor={`editCorrect-option-${index}`} className="form-toggle-label"><div className="form-toggle-switch"><input type="checkbox" id={`editCorrect-option-${index}`} className="sr-only" checked={questionFormCorrectAnswer === option} onChange={(e) => setQuestionFormCorrectAnswer(e.target.checked ? option : '')} disabled={option.trim() === ''} /><div className="form-toggle-slider"></div><div className="form-toggle-dot"></div></div><span className="ml-3 text-gray-700 text-sm font-medium">Correct</span></label>{questionFormOptions.length > 2 && (<button type="button" onClick={() => handleRemoveOptionField(index)} className="admin-action-button delete-button" title="Remove Option"><Trash2 size={20} /></button>)}</div>))}
                                {questionFormType === 'Multiple choice' && questionFormOptions.length < 5 && (<button type="button" onClick={handleAddOptionField} className="admin-button-secondary admin-button-full-width"><PlusIcon size={18} className="icon-mr" /> Add New Option</button>)}
                                {questionFormType === 'True or False' && (<div className="space-y-2">{['True', 'False'].map((option, index) => (<div key={index} className="form-group form-group-flex-row"><input type="text" id={`tf-option-${index}`} value={option} readOnly className="form-input flex-grow" /><label htmlFor={`tf-correct-option-${index}`} className="form-toggle-label"><div className="form-toggle-switch"><input type="checkbox" id={`tf-correct-option-${index}`} className="sr-only" checked={questionFormCorrectAnswer === option} onChange={(e) => setQuestionFormCorrectAnswer(e.target.checked ? option : '')} /><div className="form-toggle-slider"></div><div className="form-toggle-dot"></div></div><span className="ml-3 text-gray-700 text-sm font-medium">Correct</span></label></div>))}</div>)}
                                <div className="admin-form-actions-row"><button type="button" onClick={() => handleSaveQuestionToQuiz(setEditingQuiz, editingQuestionIndex !== null)} className="admin-button-primary admin-button-full-width">{editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}</button>{editingQuestionIndex !== null && (<button type="button" onClick={handleCancelEditQuestion} className="admin-button-secondary admin-button-full-width">Cancel Edit</button>)}</div>
                            </div>
                            <h4 className="admin-form-section-title">Current Questions ({editingQuiz.questions.length})</h4>
                            {editingQuiz.questions.length === 0 ? (<p className="admin-message-info">No questions added yet. Add some above!</p>) : (<ul className="admin-question-list">{editingQuiz.questions.map((q, idx) => (<li key={idx} className="admin-question-list-item"><span className="flex-grow">{q.question} (<span className="font-semibold text-green-700">Correct: {q.correctAnswer}</span>)</span><div className="admin-question-actions"><button type="button" onClick={() => handleEditQuestion(q, idx)} className="admin-action-button edit-button" title="Edit Question"><Edit size={20} /></button><button type="button" onClick={() => handleRemoveQuestionFromQuiz(idx, setEditingQuiz)} className="admin-action-button delete-button" title="Remove Question"><Trash2 size={20} /></button></div></li>))}</ul>)}
                            <div className="admin-form-footer-buttons"><button type="button" onClick={() => setIsEditModalOpen(false)} className="admin-button-secondary">Cancel</button><button type="submit" className="admin-button-primary">Update Quiz</button></div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationModal show={isDeleting} title="Confirm Deletion" message="Are you sure you want to delete this quiz? This action cannot be undone." onConfirm={handleDeleteQuiz} onCancel={() => setIsDeleting(false)} />
            <QuestionStatsModal show={isStatsModalOpen} quiz={quizForStats} onClose={() => setIsStatsModalOpen(false)} />
        </div>
    );
};

export default QuizManagement;







