import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, PlusCircle, Edit, Trash2, Info, Video, Calendar, Clock, Link as LinkIcon, Radio } from 'lucide-react';
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

const LiveClassManagement = () => {
    const { logout } = useAuth();
    const handleLogout = logout;

    const [liveClasses, setLiveClasses] = useState([]);
    const [courses, setCourses] = useState([]);
    const [newLiveClass, setNewLiveClass] = useState({ courseId: '', moduleId: '', topicId: '', title: '', description: '', streamURL: '', scheduledAt: '', duration: '1 Hour', status: 'upcoming' });
    const [editingLiveClass, setEditingLiveClass] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [liveClassToDelete, setLiveClassToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    const handleVideoUpload = async (e, isEdit = false) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (file.size > 200 * 1024 * 1024) {
            setFormMessage({ type: 'error', text: 'Video size should be less than 200MB' });
            return;
        }

        setUploadingVideo(true);
        setFormMessage({ type: 'info', text: 'Uploading video, please wait...' });
        try {
            const fd = new FormData();
            fd.append('file', file);
            const response = await fetch(`${API_BASE_URL}/admin/uploads`, {
                method: 'POST',
                body: fd,
                credentials: 'include',
            });
            const data = await response.json().catch(() => ({}));
            
            if (response.ok && data.url) {
                const absoluteUrl = data.url.startsWith('http') ? data.url : `${BASE_URL}${data.url}`;
                if (isEdit) {
                    setEditingLiveClass(prev => ({ ...prev, streamURL: absoluteUrl }));
                } else {
                    setNewLiveClass(prev => ({ ...prev, streamURL: absoluteUrl }));
                }
                setFormMessage({ type: 'success', text: 'Video uploaded successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to upload video.' });
            }
        } catch (error) {
            console.error('Error uploading video:', error);
            setFormMessage({ type: 'error', text: 'Failed to upload video due to network error.' });
        } finally {
            setUploadingVideo(false);
        }
    };

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

    const fetchLiveClasses = useCallback(async () => {
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/admin/live-classes`, {
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
                setLiveClasses(data);
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to fetch live classes.' });
            }
        } catch (error) {
            console.error('Error fetching live classes:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to fetch live classes.' });
        } finally {
            setIsLoading(false);
        }
    }, [handleLogout]);

    useEffect(() => {
        fetchCourses();
        fetchLiveClasses();
    }, [fetchCourses, fetchLiveClasses]);

    const handleAddLiveClass = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);

        if (!newLiveClass.courseId || !newLiveClass.title || !newLiveClass.scheduledAt) {
            setFormMessage({ type: 'error', text: 'All required fields must be filled.' });
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                ...newLiveClass,
                moduleId: newLiveClass.moduleId || null,
                topicId: newLiveClass.topicId || null,
            };
            const response = await fetch(`${API_BASE_URL}/admin/live-classes`, {
                method: 'POST',
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
                setLiveClasses([...liveClasses, data]);
                setNewLiveClass({ courseId: '', moduleId: '', topicId: '', title: '', description: '', streamURL: '', scheduledAt: '', duration: '1 Hour', status: 'upcoming' });
                setFormMessage({ type: 'success', text: 'Live class scheduled successfully!' });
                setIsAddModalOpen(false);
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to schedule live class.' });
            }
        } catch (error) {
            console.error('Error adding live class:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to add live class.' });
        } finally {
            setIsLoading(false);
        }
    };

    const startEditing = (liveClass) => {
        // format ISO date string to YYYY-MM-DDThh:mm for datetime-local input
        const date = new Date(liveClass.scheduledAt);
        const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
        const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);

        setEditingLiveClass({ 
            ...liveClass, 
            scheduledAt: localISOTime,
            moduleId: liveClass.moduleId || '',
            topicId: liveClass.topicId || ''
        });
        setIsEditModalOpen(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingLiveClass(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateLiveClass = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);

        if (!editingLiveClass?._id) {
            setFormMessage({ type: 'error', text: 'Live Class ID missing.' });
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                ...editingLiveClass,
                moduleId: editingLiveClass.moduleId || null,
                topicId: editingLiveClass.topicId || null,
            };
            const response = await fetch(`${API_BASE_URL}/admin/live-classes/${editingLiveClass._id}`, {
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
                setLiveClasses(liveClasses.map(lc => (lc._id === data._id ? data : lc)));
                setIsEditModalOpen(false);
                setEditingLiveClass(null);
                setFormMessage({ type: 'success', text: 'Live class updated successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to update live class.' });
            }
        } catch (error) {
            console.error('Error updating live class:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to update live class.' });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStatus = async (liveClass, nextStatus) => {
        setFormMessage({ type: '', text: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/admin/live-classes/${liveClass._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ ...liveClass, status: nextStatus }),
            });
            const data = await response.json();
            if (response.ok) {
                setLiveClasses(liveClasses.map(lc => (lc._id === data._id ? data : lc)));
                setFormMessage({ type: 'success', text: `Status updated to ${nextStatus}!` });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to update status.' });
            }
        } catch (error) {
            console.error('Error updating status:', error);
            setFormMessage({ type: 'error', text: 'Failed to update status.' });
        }
    };

    const confirmDelete = (id) => {
        setLiveClassToDelete(id);
        setIsDeleting(true);
    };

    const handleDeleteLiveClass = async () => {
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        if (!liveClassToDelete) {
            setFormMessage({ type: 'error', text: 'Live Class ID missing for deletion.' });
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/live-classes/${liveClassToDelete}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                handleLogout();
                setIsLoading(false);
                setIsDeleting(false);
                return;
            }

            if (response.ok) {
                setLiveClasses(liveClasses.filter(lc => lc._id !== liveClassToDelete));
                setFormMessage({ type: 'success', text: data.msg || 'Live class deleted successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to delete live class.' });
            }
        } catch (error) {
            console.error('Error deleting live class:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to delete live class.' });
        } finally {
            setIsDeleting(false);
            setLiveClassToDelete(null);
            setIsLoading(false);
        }
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

    const getCourseName = (courseId) => {
        const c = courses.find(item => item._id === courseId);
        return c ? c.title : 'General / Shared';
    };

    return (
        <div className="admin-page-section-container">
            <MessageBox type={formMessage.type} text={formMessage.text} />
            
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-250 dark:border-gray-700">
                <h3 className="admin-section-title mb-0 border-b-0 pb-0 flex items-center gap-2">
                    <Video size={24} className="text-teal-600 dark:text-teal-400" /> Live Classes Scheduling Dashboard
                </h3>
                <button 
                    onClick={() => setIsAddModalOpen(true)} 
                    className="admin-button-primary flex items-center gap-2"
                >
                    <PlusCircle size={18} /> Schedule Live Class
                </button>
            </div>

            {isLoading && liveClasses.length === 0 ? (
                <p className="admin-loading-message text-center">Loading live class schedules...</p>
            ) : liveClasses.length === 0 ? (
                <p className="admin-message-info">No live classes scheduled. Click 'Schedule Live Class' to get started!</p>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead className="table-header">
                            <tr>
                                <th className="admin-table-th">Title</th>
                                <th className="admin-table-th">Course</th>
                                <th className="admin-table-th">Schedule Time</th>
                                <th className="admin-table-th">Duration</th>
                                <th className="admin-table-th">Status</th>
                                <th className="admin-table-th">Quick Controls</th>
                                <th className="admin-table-th">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {liveClasses.map((item) => (
                                <tr key={item._id} className="table-row">
                                    <td className="table-cell font-semibold" data-label="Title">{item.title}</td>
                                    <td className="table-cell" data-label="Course">
                                        <div className="font-semibold">{getCourseName(item.courseId)}</div>
                                        {getModuleAndTopicName(item) && (
                                            <div className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">{getModuleAndTopicName(item)}</div>
                                        )}
                                    </td>
                                    <td className="table-cell" data-label="Schedule Time">
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Calendar size={14} className="text-gray-400" />
                                            {new Date(item.scheduledAt).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="table-cell text-xs" data-label="Duration">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} className="text-gray-400" />
                                            {item.duration}
                                        </div>
                                    </td>
                                    <td className="table-cell" data-label="Status">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                            item.status === 'live' ? 'bg-red-500/20 text-red-600 border border-red-500/30' :
                                            item.status === 'completed' ? 'bg-green-500/20 text-green-600 border border-green-500/30' :
                                            'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                                        }`}>
                                            {item.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>}
                                            {item.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="table-cell" data-label="Quick Controls">
                                        <div className="flex gap-2">
                                            {item.status === 'upcoming' && (
                                                <button onClick={() => toggleStatus(item, 'live')} className="text-xs px-2 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition">
                                                    Go Live
                                                </button>
                                            )}
                                            {item.status === 'live' && (
                                                <button onClick={() => toggleStatus(item, 'completed')} className="text-xs px-2 py-1 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition">
                                                    Complete
                                                </button>
                                            )}
                                            {item.status === 'completed' && (
                                                <button onClick={() => toggleStatus(item, 'upcoming')} className="text-xs px-2 py-1 rounded bg-slate-600 text-white font-semibold hover:bg-slate-700 transition">
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="table-cell table-actions">
                                        <button onClick={() => startEditing(item)} title="Edit" className="admin-action-button edit-button">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => confirmDelete(item._id)} title="Delete" className="admin-action-button delete-button">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ADD SCHEDULE MODAL */}
            {isAddModalOpen && (
                <div className="modal-overlay modal-overlay-overflow">
                    <div className="modal-content-box modal-content-box-lg">
                        <div className="modal-header">
                            <h3 className="modal-title flex items-center gap-2">
                                <PlusCircle size={22} className="text-teal-500" /> Schedule New Live Class
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddLiveClass} className="admin-form-spacing mt-4">
                            <div className="form-group">
                                <label className="form-label">Course *</label>
                                <select 
                                    value={newLiveClass.courseId} 
                                    onChange={(e) => setNewLiveClass({...newLiveClass, courseId: e.target.value, moduleId: '', topicId: ''})} 
                                    required 
                                    className="form-select"
                                >
                                    <option value="">Select Course</option>
                                    {courses.map(course => (
                                        <option key={course._id} value={course._id}>{course.title}</option>
                                    ))}
                                </select>
                            </div>
                            {newLiveClass.courseId && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                                    <div className="form-group">
                                        <label className="form-label">Module (Optional)</label>
                                        <select
                                            value={newLiveClass.moduleId}
                                            onChange={(e) => setNewLiveClass({...newLiveClass, moduleId: e.target.value, topicId: ''})}
                                            className="form-select"
                                        >
                                            <option value="">Select Module (General Course Class)</option>
                                            {(courses.find(c => c._id === newLiveClass.courseId)?.modules || []).map(mod => (
                                                <option key={mod._id} value={mod._id}>{mod.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Topic (Optional)</label>
                                        <select
                                            value={newLiveClass.topicId}
                                            onChange={(e) => setNewLiveClass({...newLiveClass, topicId: e.target.value})}
                                            disabled={!newLiveClass.moduleId}
                                            className="form-select"
                                        >
                                            <option value="">Select Topic (General Module Class)</option>
                                            {(courses.find(c => c._id === newLiveClass.courseId)
                                                ?.modules?.find(m => m._id === newLiveClass.moduleId)
                                                ?.topics || []).map(topic => (
                                                <option key={topic._id} value={topic._id}>{topic.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Live Class Title *</label>
                                <input 
                                    type="text" 
                                    value={newLiveClass.title} 
                                    onChange={(e) => setNewLiveClass({...newLiveClass, title: e.target.value})} 
                                    required 
                                    className="form-input" 
                                    placeholder="e.g. Q&A and Project Setup Session" 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description (Optional)</label>
                                <textarea 
                                    value={newLiveClass.description} 
                                    onChange={(e) => setNewLiveClass({...newLiveClass, description: e.target.value})} 
                                    className="form-textarea" 
                                    rows="3" 
                                    placeholder="Brief outline of topics covered..."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Scheduled Date & Time *</label>
                                    <input 
                                        type="datetime-local" 
                                        value={newLiveClass.scheduledAt} 
                                        onChange={(e) => setNewLiveClass({...newLiveClass, scheduledAt: e.target.value})} 
                                        required 
                                        className="form-input" 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Estimated Duration (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={newLiveClass.duration} 
                                        onChange={(e) => setNewLiveClass({...newLiveClass, duration: e.target.value})} 
                                        className="form-input" 
                                        placeholder="e.g. 1 Hour, 45 Minutes" 
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Secure Stream / Video URL (Optional)</label>
                                <div className="relative space-y-2">
                                    <input 
                                        type="url" 
                                        value={newLiveClass.streamURL} 
                                        onChange={(e) => setNewLiveClass({...newLiveClass, streamURL: e.target.value})} 
                                        className="form-input" 
                                        placeholder="e.g. https://www.youtube.com/embed/dQw4w9WgXcQ" 
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Or upload video file:</span>
                                        <input 
                                            type="file" 
                                            accept="video/*" 
                                            onChange={(e) => handleVideoUpload(e, false)} 
                                            className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 dark:file:bg-teal-950/40 dark:file:text-teal-400 hover:file:bg-teal-100 transition cursor-pointer"
                                        />
                                        {uploadingVideo && <span className="text-xs text-teal-600 dark:text-teal-400 animate-pulse">Uploading...</span>}
                                    </div>
                                    <span className="text-xs text-gray-500 mt-1 block">
                                        For security, use embeddable iframe links. Iframe screenshotting and inspector panels are disabled on the viewer.
                                    </span>
                                </div>
                            </div>
                            <div className="modal-actions-footer">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="modal-button-base modal-button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading} className="modal-button-base admin-button-primary">
                                    {isLoading ? 'Scheduling...' : 'Schedule Class'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT SCHEDULE MODAL */}
            {isEditModalOpen && editingLiveClass && (
                <div className="modal-overlay modal-overlay-overflow">
                    <div className="modal-content-box modal-content-box-lg">
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Live Class Session</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateLiveClass} className="admin-form-spacing mt-4">
                            <div className="form-group">
                                <label className="form-label">Course *</label>
                                <select 
                                    name="courseId"
                                    value={editingLiveClass.courseId} 
                                    onChange={(e) => setEditingLiveClass({...editingLiveClass, courseId: e.target.value, moduleId: '', topicId: ''})} 
                                    required 
                                    className="form-select"
                                >
                                    <option value="">Select Course</option>
                                    {courses.map(course => (
                                        <option key={course._id} value={course._id}>{course.title}</option>
                                    ))}
                                </select>
                            </div>
                            {editingLiveClass.courseId && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                                    <div className="form-group">
                                        <label className="form-label">Module (Optional)</label>
                                        <select
                                            name="moduleId"
                                            value={editingLiveClass.moduleId}
                                            onChange={(e) => setEditingLiveClass({...editingLiveClass, moduleId: e.target.value, topicId: ''})}
                                            className="form-select"
                                        >
                                            <option value="">Select Module (General Course Class)</option>
                                            {(courses.find(c => c._id === editingLiveClass.courseId)?.modules || []).map(mod => (
                                                <option key={mod._id} value={mod._id}>{mod.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Topic (Optional)</label>
                                        <select
                                            name="topicId"
                                            value={editingLiveClass.topicId}
                                            onChange={(e) => setEditingLiveClass({...editingLiveClass, topicId: e.target.value})}
                                            disabled={!editingLiveClass.moduleId}
                                            className="form-select"
                                        >
                                            <option value="">Select Topic (General Module Class)</option>
                                            {(courses.find(c => c._id === editingLiveClass.courseId)
                                                ?.modules?.find(m => m._id === editingLiveClass.moduleId)
                                                ?.topics || []).map(topic => (
                                                <option key={topic._id} value={topic._id}>{topic.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Live Class Title *</label>
                                <input 
                                    type="text" 
                                    name="title"
                                    value={editingLiveClass.title} 
                                    onChange={handleEditChange} 
                                    required 
                                    className="form-input" 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea 
                                    name="description"
                                    value={editingLiveClass.description} 
                                    onChange={handleEditChange} 
                                    className="form-textarea" 
                                    rows="3" 
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Scheduled Date & Time *</label>
                                    <input 
                                        type="datetime-local" 
                                        name="scheduledAt"
                                        value={editingLiveClass.scheduledAt} 
                                        onChange={handleEditChange} 
                                        required 
                                        className="form-input" 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Estimated Duration (Optional)</label>
                                    <input 
                                        type="text" 
                                        name="duration"
                                        value={editingLiveClass.duration} 
                                        onChange={handleEditChange} 
                                        className="form-input" 
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Secure Stream / Video URL (Optional)</label>
                                <div className="relative space-y-2">
                                    <input 
                                        type="url" 
                                        name="streamURL"
                                        value={editingLiveClass.streamURL} 
                                        onChange={handleEditChange} 
                                        className="form-input" 
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Or upload video file:</span>
                                        <input 
                                            type="file" 
                                            accept="video/*" 
                                            onChange={(e) => handleVideoUpload(e, true)} 
                                            className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 dark:file:bg-teal-950/40 dark:file:text-teal-400 hover:file:bg-teal-100 transition cursor-pointer"
                                        />
                                        {uploadingVideo && <span className="text-xs text-teal-600 dark:text-teal-400 animate-pulse">Uploading...</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Session Status</label>
                                <select 
                                    name="status"
                                    value={editingLiveClass.status} 
                                    onChange={handleEditChange} 
                                    className="form-select"
                                >
                                    <option value="upcoming">Upcoming</option>
                                    <option value="live">Live</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            <div className="modal-actions-footer">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="modal-button-base modal-button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading} className="modal-button-base admin-button-primary">
                                    {isLoading ? 'Updating...' : 'Update Class'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal 
                show={isDeleting} 
                title="Cancel Live Session" 
                message="Are you sure you want to delete this live class session? This will remove it from all student course dashboards." 
                onConfirm={handleDeleteLiveClass} 
                onCancel={() => setIsDeleting(false)} 
            />
        </div>
    );
};

export default LiveClassManagement;
