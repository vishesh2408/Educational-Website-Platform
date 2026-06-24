import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, PlusCircle, Edit, Trash2, Info, Award, Calendar, HelpCircle, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

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

const QuizAssignmentManagement = () => {
    const { logout } = useAuth();
    const handleLogout = logout;

    const [quizzes, setQuizzes] = useState([]);
    const [courses, setCourses] = useState([]);
    const [assigningQuiz, setAssigningQuiz] = useState(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    // Confirmation Modal States
    const [isClearing, setIsClearing] = useState(false);
    const [quizToClear, setQuizToClear] = useState(null);

    const fetchCourses = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/courses`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setCourses(data);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    }, []);

    const fetchQuizzes = useCallback(async () => {
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/admin/quizzes`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                handleLogout();
                setIsLoading(false);
                return;
            }

            if (response.ok) {
                if (data && Array.isArray(data.items)) {
                    setQuizzes(data.items);
                } else if (Array.isArray(data)) {
                    setQuizzes(data);
                }
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to fetch quizzes.' });
            }
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to fetch quizzes.' });
        } finally {
            setIsLoading(false);
        }
    }, [handleLogout]);

    useEffect(() => {
        fetchCourses();
        fetchQuizzes();
    }, [fetchCourses, fetchQuizzes]);

    const startNewAssignment = () => {
        setAssigningQuiz({
            _id: '',
            courseId: '',
            moduleId: '',
            topicId: '',
            isEditing: false
        });
        setIsAssignModalOpen(true);
    };

    const startEditing = (quiz) => {
        setAssigningQuiz({
            ...quiz,
            courseId: quiz.courseId || '',
            moduleId: quiz.moduleId || '',
            topicId: quiz.topicId || '',
            isEditing: true
        });
        setIsAssignModalOpen(true);
    };

    const handleSaveAssignment = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);

        if (!assigningQuiz?._id) {
            setFormMessage({ type: 'error', text: 'Please select a quiz to assign.' });
            setIsLoading(false);
            return;
        }

        if (!assigningQuiz?.courseId || !assigningQuiz?.moduleId || !assigningQuiz?.topicId) {
            setFormMessage({ type: 'error', text: 'Course, Module, and Topic selection are all required.' });
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                courseId: assigningQuiz.courseId,
                moduleId: assigningQuiz.moduleId,
                topicId: assigningQuiz.topicId,
            };

            const response = await fetch(`${API_BASE_URL}/admin/quizzes/${assigningQuiz._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                handleLogout();
                setIsLoading(false);
                return;
            }

            if (response.ok) {
                setQuizzes(quizzes.map(q => (q._id === data._id ? { ...q, ...data } : q)));
                setIsAssignModalOpen(false);
                setAssigningQuiz(null);
                setFormMessage({ type: 'success', text: 'Quiz assignment saved successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to update quiz assignment.' });
            }
        } catch (error) {
            console.error('Error saving quiz assignment:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to save assignment.' });
        } finally {
            setIsLoading(false);
        }
    };

    const confirmClearAssignment = (quiz) => {
        setQuizToClear(quiz);
        setIsClearing(true);
    };

    const handleClearAssignment = async () => {
        if (!quizToClear) return;
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);

        try {
            const payload = {
                courseId: quizToClear.courseId, // Keep original course, or set to null if preferred. We set moduleId/topicId to null.
                moduleId: null,
                topicId: null,
            };

            const response = await fetch(`${API_BASE_URL}/admin/quizzes/${quizToClear._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (response.ok) {
                setQuizzes(quizzes.map(q => (q._id === data._id ? { ...q, ...data } : q)));
                setFormMessage({ type: 'success', text: 'Quiz assignment cleared successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to clear assignment.' });
            }
        } catch (error) {
            console.error('Error clearing quiz assignment:', error);
            setFormMessage({ type: 'error', text: 'Failed to clear assignment.' });
        } finally {
            setIsLoading(false);
            setIsClearing(false);
            setQuizToClear(null);
        }
    };

    const getCourseName = (courseId) => {
        const c = courses.find(item => item._id === courseId);
        return c ? c.title : 'Unassigned';
    };

    const getModuleAndTopicName = (item) => {
        const course = courses.find(c => c._id === item.courseId);
        if (!course) return null;
        const mod = course.modules?.find(m => m._id === item.moduleId);
        if (!mod) return null;
        const top = mod.topics?.find(t => t._id === item.topicId);
        if (top) {
            return `${mod.title} > ${top.title}`;
        }
        return mod.title;
    };

    // Table filters: ONLY show quizzes explicitly assigned to a topic
    const assignedQuizzes = quizzes.filter(q => q.topicId);

    // Get quizzes that are NOT assigned to a topic yet, for the dropdown select list
    const unassignedQuizzes = quizzes.filter(q => !q.topicId);

    return (
        <div className="admin-page-section-container">
            <MessageBox type={formMessage.type} text={formMessage.text} />
            
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-250 dark:border-gray-700">
                <h3 className="admin-section-title mb-0 border-b-0 pb-0 flex items-center gap-2">
                    <Award size={24} className="text-purple-650 dark:text-purple-400" /> Quiz Assignments Dashboard
                </h3>
                <button 
                    onClick={startNewAssignment} 
                    className="admin-button-primary flex items-center gap-2"
                >
                    <PlusCircle size={18} /> Assign Quiz
                </button>
            </div>

            {isLoading && quizzes.length === 0 ? (
                <p className="admin-loading-message text-center">Loading quizzes...</p>
            ) : assignedQuizzes.length === 0 ? (
                <p className="admin-message-info">No quizzes assigned to topics yet. Click 'Assign Quiz' to manually link a quiz!</p>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead className="table-header">
                            <tr>
                                <th className="admin-table-th">Quiz Title</th>
                                <th className="admin-table-th">Course / Module / Topic</th>
                                <th className="admin-table-th">Questions</th>
                                <th className="admin-table-th">Total Marks</th>
                                <th className="admin-table-th">Duration</th>
                                <th className="admin-table-th">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignedQuizzes.map((item) => (
                                <tr key={item._id} className="table-row">
                                    <td className="table-cell font-semibold" data-label="Title">{item.title}</td>
                                    <td className="table-cell" data-label="Course">
                                        <div className="font-semibold">{getCourseName(item.courseId)}</div>
                                        {getModuleAndTopicName(item) && (
                                            <div className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">{getModuleAndTopicName(item)}</div>
                                        )}
                                    </td>
                                    <td className="table-cell" data-label="Questions">{item.noOfQuestions}</td>
                                    <td className="table-cell" data-label="Marks">{item.totalMarks} (Pass: {item.passMark})</td>
                                    <td className="table-cell" data-label="Duration">{item.duration || 'No Limit'}</td>
                                    <td className="table-cell table-actions">
                                        <button onClick={() => startEditing(item)} title="Edit Assignment" className="admin-action-button edit-button">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => confirmClearAssignment(item)} title="Clear Assignment" className="admin-action-button delete-button">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ASSIGN MODAL */}
            {isAssignModalOpen && assigningQuiz && (
                <div className="modal-overlay modal-overlay-overflow">
                    <div className="modal-content-box modal-content-box-lg">
                        <div className="modal-header">
                            <h3 className="modal-title">{assigningQuiz.isEditing ? 'Edit Quiz Assignment' : 'Assign Quiz to Topic'}</h3>
                            <button onClick={() => setIsAssignModalOpen(false)} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveAssignment} className="admin-form-spacing mt-4">
                            {!assigningQuiz.isEditing ? (
                                <div className="form-group">
                                    <label className="form-label">Quiz *</label>
                                    <select 
                                        value={assigningQuiz._id} 
                                        onChange={(e) => {
                                            const selected = quizzes.find(q => q._id === e.target.value);
                                            setAssigningQuiz({
                                                ...assigningQuiz,
                                                _id: e.target.value,
                                                courseId: selected ? (selected.courseId || '') : '',
                                                moduleId: '',
                                                topicId: ''
                                            });
                                        }} 
                                        required 
                                        className="form-select"
                                    >
                                        <option value="">Select Quiz</option>
                                        {unassignedQuizzes.map(q => (
                                            <option key={q._id} value={q._id}>{q.title}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label className="form-label">Quiz</label>
                                    <input 
                                        type="text" 
                                        value={assigningQuiz.title} 
                                        disabled 
                                        className="form-input bg-gray-100 dark:bg-gray-800 cursor-not-allowed" 
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Course *</label>
                                <select 
                                    value={assigningQuiz.courseId} 
                                    onChange={(e) => setAssigningQuiz({...assigningQuiz, courseId: e.target.value, moduleId: '', topicId: ''})} 
                                    required 
                                    className="form-select"
                                >
                                    <option value="">Select Course</option>
                                    {courses.map(course => (
                                        <option key={course._id} value={course._id}>{course.title}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {assigningQuiz.courseId && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                                    <div className="form-group">
                                        <label className="form-label">Module *</label>
                                        <select
                                            value={assigningQuiz.moduleId}
                                            onChange={(e) => setAssigningQuiz({...assigningQuiz, moduleId: e.target.value, topicId: ''})}
                                            required
                                            className="form-select"
                                        >
                                            <option value="">Select Module</option>
                                            {(courses.find(c => c._id === assigningQuiz.courseId)?.modules || []).map(mod => (
                                                <option key={mod._id} value={mod._id}>{mod.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Topic *</label>
                                        <select
                                            value={assigningQuiz.topicId}
                                            onChange={(e) => setAssigningQuiz({...assigningQuiz, topicId: e.target.value})}
                                            disabled={!assigningQuiz.moduleId}
                                            required
                                            className="form-select"
                                        >
                                            <option value="">Select Topic</option>
                                            {(courses.find(c => c._id === assigningQuiz.courseId)
                                                ?.modules?.find(m => m._id === assigningQuiz.moduleId)
                                                ?.topics || []).map(topic => (
                                                <option key={topic._id} value={topic._id}>{topic.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                            
                            <div className="modal-actions-footer">
                                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="modal-button-base modal-button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading} className="modal-button-base admin-button-primary">
                                    {isLoading ? 'Saving...' : 'Save Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal 
                show={isClearing} 
                title="Remove Quiz Assignment" 
                message={`Are you sure you want to remove the assignment for "${quizToClear?.title}"? This will hide the quiz from the assigned course topic.`} 
                onConfirm={handleClearAssignment} 
                onCancel={() => setIsClearing(false)} 
            />
        </div>
    );
};

export default QuizAssignmentManagement;
