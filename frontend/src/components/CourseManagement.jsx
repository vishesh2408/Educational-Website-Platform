// src/components/CourseManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Layers, 
  ListTodo, 
  Clipboard, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import './AdminDashboard.css'; // Assuming you have a common CSS file for admin dashboard styles
import CourseEditor from './CourseEditor';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

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

// --- Topic Editor Modal Component ---
const TopicEditorModal = ({ show, topic, onSave, onCancel, courseTitle, moduleTitle, isLoading }) => {
    if (!show || !topic) return null;

    const [editedTopic, setEditedTopic] = useState(topic);
    const [resources, setResources] = useState(topic.otherResources || []);
    const [articles, setArticles] = useState(Array.isArray(topic.articles) ? topic.articles : []);

    useEffect(() => {
        setEditedTopic(topic);
        setResources(topic.otherResources || []);
        setArticles(Array.isArray(topic.articles) ? topic.articles : []);
    }, [topic]);

    const handleResourceChange = (index, field, value) => {
        const newResources = [...resources];
        newResources[index][field] = value;
        setResources(newResources);
    };

    const handleSave = (e) => {
        e.preventDefault();
        onSave({ 
            ...editedTopic, 
            articles: (articles || [])
                .map((a, idx) => ({
                    ...a,
                    order: typeof a.order === 'number' ? a.order : idx,
                }))
                .filter((a) => (a.heading && String(a.heading).trim()) || (a.content && String(a.content).trim())),
            otherResources: resources.filter(r => r.name && r.url)
        });
    };

    const updateArticle = (index, patch) => {
        setArticles((prev) => {
            const next = Array.isArray(prev) ? [...prev] : [];
            next[index] = { ...(next[index] || {}), ...patch };
            return next;
        });
    };

    const addArticle = () => {
        setArticles((prev) => ([
            ...(Array.isArray(prev) ? prev : []),
            { heading: '', content: '', videoURL: '', quizId: '' }
        ]));
    };

    const deleteArticle = (index) => {
        setArticles((prev) => (Array.isArray(prev) ? prev.filter((_, i) => i !== index) : []));
    };

    return (
        <div className="modal-overlay modal-overlay-overflow">
            <div className="modal-content-box modal-content-box-xl">
                <div className="modal-header">
                    <h3 className="modal-title"><Clipboard size={20} className="icon-mr" /> Edit Topic Content: {editedTopic.title}</h3>
                    <button onClick={onCancel} className="modal-close-button"><X size={24} /></button>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <p>Course: <span className="text-teal-600 dark:text-teal-400 font-bold">{courseTitle}</span></p>
                    <p>Module: <span className="text-blue-600 dark:text-blue-400 font-bold">{moduleTitle}</span></p>
                </div>
                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label className="form-label">Topic Title</label>
                        <input type="text" name="title" value={editedTopic.title} onChange={(e) => setEditedTopic(prev => ({ ...prev, title: e.target.value }))} required className="form-input" />
                    </div>
                    
                    <h4 className="font-bold mt-6 mb-2 text-lg text-gray-800 dark:text-gray-200">Articles (Recommended)</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Add multiple articles for this topic. Each article supports a heading and content (Markdown or HTML).
                        Video URL and Quiz ID are optional per article.
                    </p>

                    {(articles || []).length > 0 ? (
                        <div className="space-y-4">
                            {articles.map((article, index) => (
                                <div key={article._id || index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div className="flex-1">
                                            <label className="form-label">Article Heading</label>
                                            <input
                                                type="text"
                                                value={article.heading || ''}
                                                onChange={(e) => updateArticle(index, { heading: e.target.value })}
                                                className="form-input"
                                                placeholder="e.g., Introduction"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => deleteArticle(index)}
                                            className="admin-action-button delete-button"
                                            title="Delete Article"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Article Content</label>
                                        <textarea
                                            value={article.content || ''}
                                            onChange={(e) => updateArticle(index, { content: e.target.value })}
                                            className="form-textarea"
                                            rows={8}
                                            placeholder="Write Markdown or HTML here..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="form-label">Video URL (Optional)</label>
                                            <input
                                                type="text"
                                                value={article.videoURL || ''}
                                                onChange={(e) => updateArticle(index, { videoURL: e.target.value })}
                                                className="form-input"
                                                placeholder="e.g., https://youtube.com/..."
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Linked Quiz ID (Optional)</label>
                                            <input
                                                type="text"
                                                value={article.quizId || ''}
                                                onChange={(e) => updateArticle(index, { quizId: e.target.value })}
                                                className="form-input"
                                                placeholder="MongoDB Quiz ID"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400">
                            No articles added yet.
                        </div>
                    )}

                    <button type="button" onClick={addArticle} className="admin-button-secondary w-full my-2">
                        + Add Article
                    </button>
                    
                    <h4 className="font-bold mt-4 mb-2 text-lg text-gray-800 dark:text-gray-200">Other Resources</h4>
                    {resources.map((res, index) => (
                        <div key={index} className="flex gap-4 mb-2 items-center p-2 border border-gray-300 dark:border-gray-600 rounded">
                            <input 
                                type="text" 
                                value={res.name} 
                                onChange={(e) => handleResourceChange(index, 'name', e.target.value)} 
                                placeholder="Resource Name"
                                className="form-input flex-1"
                            />
                            <input 
                                type="url" 
                                value={res.url} 
                                onChange={(e) => handleResourceChange(index, 'url', e.target.value)} 
                                placeholder="Resource URL"
                                className="form-input flex-1"
                            />
                            <button type="button" onClick={() => setResources(resources.filter((_, i) => i !== index))} className="admin-action-button delete-button p-2"><Trash2 size={18} /></button>
                        </div>
                    ))}
                    <button type="button" onClick={() => setResources([...resources, { name: '', url: '' }])} className="admin-button-secondary w-full my-2">
                        + Add Resource Link
                    </button>
                    
                    <div className="modal-actions-footer">
                        <button type="button" onClick={onCancel} className="modal-button-base modal-button-cancel">Cancel</button>
                        <button type="submit" disabled={isLoading} className="modal-button-base admin-button-primary">
                            {isLoading ? 'Saving...' : 'Save Topic Content'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CourseManagement = () => {
    const { currentUser, logout } = useAuth();
    const { openModal } = useModal();
    const [courses, setCourses] = useState([]);
    const [newCourse, setNewCourse] = useState({ title: '', description: '', type: 'paid', price: '', status: 'running', imageUrl: '', rating: 0 });
    const [editingCourse, setEditingCourse] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Modal & Collapse States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isContentSectionOpen, setIsContentSectionOpen] = useState(true);
    const [expandedCourses, setExpandedCourses] = useState({});
    const [expandedModules, setExpandedModules] = useState({});

    const handleImageFileChange = (e, isEdit = false) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setFormMessage({ type: 'error', text: 'Image size should be less than 2MB' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (isEdit) {
                setEditingCourse(prev => ({ ...prev, imageUrl: reader.result }));
            } else {
                setNewCourse(prev => ({ ...prev, imageUrl: reader.result }));
            }
        };
        reader.readAsDataURL(file);
    };

     // Module/Topic Management States
    const [modules, setModules] = useState([]);
    const [moduleToEdit, setModuleToEdit] = useState(null);
    const [topicToEdit, setTopicToEdit] = useState(null);
    const [isTopicEditModalOpen, setIsTopicEditModalOpen] = useState(false);

    // Api Calls
    const fetchCourses = useCallback(async () => {
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/courses`, {
                headers: { 'content-type': 'application/json' },
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
                data.forEach(course => {
                    if (course.modules && course.modules.length > 0) {
                         console.log(`Course ${course.title} has ${course.modules.length} modules.`);
                    }
                });
                setCourses(data);
                setFormMessage({ type: 'success', text: 'Courses loaded successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to fetch courses.' });
                if (response.status === 401 || response.status === 403) logout();
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to fetch courses.' });
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    // Course Handlers: Create, Edit, Delete
    const handleAddCourse = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        if (newCourse.type === 'paid' && !newCourse.price.trim()) {
            setFormMessage({ type: 'error', text: 'Price is required for paid courses.' });
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ ...newCourse, price: newCourse.type === 'free' ? 'Free' : newCourse.price.trim(), rating: parseFloat(newCourse.rating) || 0 }),
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                setCourses([...courses, data]);
                setNewCourse({ title: '', description: '', type: 'paid', price: '', status: 'running', imageUrl: '', rating: 0 });
                setFormMessage({ type: 'success', text: 'Course added successfully!' });
                setIsAddModalOpen(false); // Close Modal on success
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to add course.' });
                if (response.status === 401 || response.status === 403) logout();
            }
        } catch (error) {
            console.error('Error adding course:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to add course.' });
        } finally {
            setIsLoading(false);
        }
    };

    const startEditingCourse = (course) => {
        setEditingCourse({ ...course });
        setModules(course.modules || []);
        setIsEditModalOpen(true);
    };

    const handleEditChange = (e) => {
        const { name, value, type } = e.target;
        setEditingCourse(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        if (!editingCourse?._id) {
            setFormMessage({ type: 'error', text: 'Course ID missing.' });
            setIsLoading(false);
            return;
        }
        if (editingCourse.type === 'paid' && !editingCourse.price.trim()) {
            setFormMessage({ type: 'error', text: 'Price is required for paid courses.' });
            setIsLoading(false);
            return;
        }

        const { modules, ...courseUpdateData } = editingCourse;

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/courses/${editingCourse._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ ...courseUpdateData, price: editingCourse.type === 'free' ? 'Free' : editingCourse.price.trim(), rating: parseFloat(editingCourse.rating) || 0 }),
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                logout(); 
                setIsLoading(false);
                setIsEditModalOpen(false);
                return;
            }

            const data = await response.json();
            if (response.ok) {
                setCourses(courses.map(c => (c._id === data._id ? { ...c, ...data, modules: modules } : c)));
                setIsEditModalOpen(false);
                setEditingCourse(null);
                setFormMessage({ type: 'success', text: 'Course updated successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to update course.' });
                if (response.status === 401 || response.status === 403) logout();
            }
        } catch (error) {
            console.error('Error updating course:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to update course.' });
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDeleteCourse = (courseId) => {
        setCourseToDelete(courseId);
        setIsDeleting(true);
    };

    const handleDeleteCourse = async () => {
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        if (!courseToDelete) {
            setFormMessage({ type: 'error', text: 'Course ID missing for deletion.' });
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/courses/${courseToDelete}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                 setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                 logout(); 
                 setIsLoading(false);
                 setIsDeleting(false);
                 return;
            }

            const data = await response.json();
            if (response.ok) {
                setCourses(courses.filter(c => c._id !== courseToDelete));
                setFormMessage({ type: 'success', text: data.msg || 'Course deleted successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to delete course.' });
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to delete course.' });
        } finally {
            setIsDeleting(false);
            setCourseToDelete(null);
            setIsLoading(false);
        }
    };

    // --- Module CRUD Handlers ---
    const handleAddModule = async (courseId) => {
        const title = prompt("Enter new module title:");
        if (!title) return;

        setIsLoading(true);
        try {
            const targetCourse = courses.find(c => c._id === courseId);
            const newOrder = (targetCourse?.modules?.length || 0) + 1;

            const response = await fetch(`${API_BASE_URL}/api/admin/modules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ courseId, title, order: newOrder, topics: [] }),
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
                const newModuleData = { ...data, topics: [] };
                
                setCourses(prevCourses => prevCourses.map(c => {
                    if (c._id === courseId) {
                        const updatedModules = [...(c.modules || []), newModuleData].sort((a, b) => a.order - b.order);
                        return { ...c, modules: updatedModules };
                    }
                    return c;
                }));
                
                setModules(prev => [...prev, newModuleData]);
                await fetchCourses(); 
                setFormMessage({ type: 'success', text: `Module '${title}' added.` });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Failed to add module.');
            }
        } catch (error) {
            setFormMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteModule = async (moduleId, title) => {
        if (!window.confirm(`Are you sure you want to delete module: ${title}? This will also delete all its topics.`)) return;

        setIsLoading(true);
        try {
            const courseId = courses.find(c => c.modules.some(m => m._id === moduleId))?._id;
            if (!courseId) throw new Error("Could not find parent course for module.");

            const response = await fetch(`${API_BASE_URL}/api/admin/modules/${moduleId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                logout(); 
                setIsLoading(false);
                return;
            }

            if (response.ok) {
                await fetchCourses(); 
                setModules(prev => prev.filter(m => m._id !== moduleId));
                setFormMessage({ type: 'success', text: `Module '${title}' deleted.` });
            } else {
                const data = await response.json();
                throw new Error(data.msg || 'Failed to delete module.');
            }
        } catch (error) {
            setFormMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // --- Topic CRUD Handlers (Includes Notes/Content) ---
    const handleAddTopic = async (moduleId) => {
        const title = prompt("Enter new topic title:");
        if (!title) return;

        setIsLoading(true);
        try {
            const currentModule = modules.find(m => m._id === moduleId);
            const newOrder = (currentModule?.topics.length || 0) + 1;
            
            const response = await fetch(`${API_BASE_URL}/api/admin/topics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ moduleId, title, order: newOrder, notes: 'Start writing your formatted notes here...', videoURL: '', otherResources: [] }),
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
                const newTopicData = { ...data }; 
                const courseId = currentModule.courseId;

                setModules(prev => prev.map(m => {
                    if (m._id === moduleId) {
                        const updatedTopics = [...m.topics, newTopicData].sort((a, b) => a.order - b.order);
                        return { ...m, topics: updatedTopics }; 
                    }
                    return m;
                }));

                setCourses(prevCourses => prevCourses.map(c => {
                    if (c._id === courseId) {
                        return { ...c, modules: c.modules.map(m => {
                            if (m._id === moduleId) {
                                const updatedTopics = [...m.topics, newTopicData].sort((a, b) => a.order - b.order);
                                return { ...m, topics: updatedTopics };
                            }
                            return m;
                        }) };
                    }
                    return c;
                }));

                setFormMessage({ type: 'success', text: `Topic '${title}' added.` });
            } else {
                throw new Error(data.msg || 'Failed to add topic.');
            }
        } catch (error) {
            setFormMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenTopicEditor = (module, topic) => {
        setModuleToEdit(module);
        setTopicToEdit(topic);
        setIsTopicEditModalOpen(true);
    };

    const handleSaveTopicContent = async (updatedTopicData) => {
        const topicId = updatedTopicData._id;
        const moduleId = updatedTopicData.moduleId;
        const courseId = modules.find(m => m._id === moduleId)?.courseId; 

        setIsLoading(true);
        setFormMessage({ type: '', text: '' });
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/topics/${topicId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTopicData),
            });

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                logout(); 
                setIsLoading(false);
                return;
            }

            const data = await response.json();

            if (response.ok) {
                setModules(prevModules => prevModules.map(m => 
                    m._id === moduleId 
                        ? { ...m, topics: m.topics.map(t => t._id === topicId ? data : t) } 
                        : m
                ));

                setCourses(prevCourses => prevCourses.map(c => {
                    if (c._id === courseId) {
                        return { ...c, modules: c.modules.map(m => 
                            m._id === moduleId
                                ? { ...m, topics: m.topics.map(t => t._id === topicId ? data : t) }
                                : m
                        ) };
                    }
                    return c;
                }));
               
                setFormMessage({ type: 'success', text: `Topic '${data.title}' content updated.` });
                setIsTopicEditModalOpen(false);
            } else {
                throw new Error(data.msg || 'Failed to update topic content.');
            }
        } catch (error) {
            setFormMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTopic = async (topicId, moduleId, title) => {
        if (!window.confirm(`Are you sure you want to delete topic: ${title}?`)) return;
        const courseId = courses.find(c => c.modules.some(m => m._id === moduleId))?._id; 
    
        if (!courseId) {
            setFormMessage({ type: 'error', text: 'Parent course link lost. Please refresh the page.' });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/topics/${topicId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                logout(); 
                setIsLoading(false);
                return;
            }
            
            if (response.ok) {
                setModules(prev => prev.map(m => 
                    m._id === moduleId 
                        ? { ...m, topics: (m.topics || []).filter(t => t._id !== topicId) } 
                        : m
                ));

                setCourses(prevCourses => prevCourses.map(c => {
                    if (c._id === courseId) {
                        return { ...c, modules: (c.modules || []).map(m => 
                            m._id === moduleId
                                ? { ...m, topics: (m.topics || []).filter(t => t._id !== topicId) }
                                : m
                        ) };
                    }
                    return c;
                }));
                setFormMessage({ type: 'success', text: `Topic '${title}' deleted.` });
            } else {
                const data = await response.json();
                throw new Error(data.msg || 'Failed to delete topic.');
            }
        } catch (error) {
            setFormMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // --- Course Content Filter/Search Logic ---
    const [contentSearchTerm, setContentSearchTerm] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState(null);

    const filteredCoursesForContent = useMemo(() => {
        let listToFilter = courses;

        if (selectedCourseId) {
            listToFilter = courses.filter(c => c._id === selectedCourseId);
        }

        if (!contentSearchTerm) return listToFilter;
        
        const lowerCaseSearch = contentSearchTerm.toLowerCase();

        return listToFilter.filter(course =>
            course.title.toLowerCase().includes(lowerCaseSearch) ||
            (course.modules || []).some(module =>
                module.title.toLowerCase().includes(lowerCaseSearch) ||
                (module.topics || []).some(topic => topic.title.toLowerCase().includes(lowerCaseSearch))
            )
        );
    }, [courses, contentSearchTerm, selectedCourseId]);

    const toggleCourseCollapse = (courseId) => {
        setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
    };

    const toggleModuleCollapse = (moduleId) => {
        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    // --- Render Logic ---
    const renderCourseContentManagement = () => (
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
            {/* Header section (Clickable to collapse/expand entire management section) */}
            <div 
                onClick={() => setIsContentSectionOpen(!isContentSectionOpen)}
                className="flex justify-between items-center cursor-pointer select-none pb-3 border-b border-gray-250 dark:border-gray-700"
            >
                <h3 className="admin-section-title mb-0 border-b-0 pb-0 flex items-center gap-2">
                    <Layers size={20} /> Course Structure & Content Management
                </h3>
                <div className={`text-gray-400 transition-transform duration-200 ${isContentSectionOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown size={20} />
                </div>
            </div>
            
            {isContentSectionOpen && (
                <div className="mt-4 space-y-4">
                    {/* Filter / Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <select 
                            value={selectedCourseId || ''} 
                            onChange={(e) => setSelectedCourseId(e.target.value || null)}
                            className="form-select sm:w-64"
                        >
                            <option value="">Filter by Course</option>
                            {courses.map(course => (
                                <option key={course._id} value={course._id}>{course.title}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Search Modules/Topics..."
                            className="form-input flex-1"
                            value={contentSearchTerm}
                            onChange={(e) => setContentSearchTerm(e.target.value)}
                        />
                    </div>
        
                    {/* Courses Accordion List */}
                    {filteredCoursesForContent.map(course => {
                        const isCourseExpanded = !!expandedCourses[course._id];
                        const totalTopicsCount = course.modules?.reduce((acc, m) => acc + (m.topics?.length || 0), 0) || 0;
                        
                        return (
                            <div key={course._id} className="border border-teal-500/30 dark:border-teal-700/50 rounded-xl overflow-hidden shadow-xs transition-all duration-200 bg-gray-50/10 dark:bg-gray-900/10">
                                {/* Course Accordion Trigger */}
                                <div 
                                    onClick={() => toggleCourseCollapse(course._id)}
                                    className="p-4 bg-teal-500/5 dark:bg-teal-700/5 hover:bg-teal-500/10 dark:hover:bg-teal-700/10 cursor-pointer select-none flex items-center justify-between gap-4 transition-all duration-150"
                                >
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-base font-bold text-teal-600 dark:text-teal-400 truncate">{course.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {course.modules?.length || 0} Modules • {totalTopicsCount} Topics
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                            onClick={() => handleAddModule(course._id)} 
                                            className="px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-800 bg-teal-50 dark:bg-teal-950/45 hover:bg-teal-100/80 rounded-lg border border-teal-200/50 dark:border-teal-900/35 flex items-center gap-1.5"
                                        >
                                            <PlusCircle size={14} /> Add Module
                                        </button>
                                        <div 
                                            onClick={() => toggleCourseCollapse(course._id)}
                                            className={`text-teal-600 dark:text-teal-400 p-1 cursor-pointer transition-transform duration-200 ${isCourseExpanded ? 'rotate-180' : ''}`}
                                        >
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Course Content (Expanded) */}
                                {isCourseExpanded && (
                                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-teal-500/10 dark:border-teal-700/10 space-y-4">
                                        {(course.modules || []).sort((a, b) => a.order - b.order).map(module => {
                                            const isModExpanded = !!expandedModules[module._id];
                                            return (
                                                <div key={module._id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50/20 dark:bg-gray-800/20">
                                                    {/* Module Accordion Trigger */}
                                                    <div 
                                                        onClick={() => toggleModuleCollapse(module._id)}
                                                        className="flex justify-between items-center bg-gray-100 dark:bg-gray-705 p-3 cursor-pointer select-none hover:bg-gray-200/50 dark:hover:bg-gray-600/30 transition-all duration-150"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <ListTodo size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                                                            <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-250 truncate">
                                                                Module {module.order}: {module.title}
                                                            </h5>
                                                            <span className="text-[10px] bg-gray-205 dark:bg-gray-600 text-gray-705 dark:text-gray-300 px-2 py-0.5 rounded-full font-bold">
                                                                {module.topics?.length || 0} Topics
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                            <button 
                                                                onClick={() => handleAddTopic(module._id)} 
                                                                className="p-1 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 rounded border border-green-200/50 dark:border-green-900/30 flex items-center gap-0.5" 
                                                                title="Add Topic"
                                                            >
                                                                <PlusCircle size={13} /> Topic
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteModule(module._id, module.title)} 
                                                                className="p-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded border border-red-200/50 dark:border-red-900/30 flex items-center gap-0.5" 
                                                                title="Delete Module"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                            <div 
                                                                onClick={() => toggleModuleCollapse(module._id)}
                                                                className={`text-gray-400 p-1 cursor-pointer transition-transform duration-200 ${isModExpanded ? 'rotate-180' : ''}`}
                                                            >
                                                                <ChevronDown size={16} />
                                                            </div>
                                                        </div>
                                                    </div>
                        
                                                    {/* Topics List (Expanded) */}
                                                    {isModExpanded && (
                                                        <div className="bg-white dark:bg-gray-800 divide-y divide-gray-150 dark:divide-gray-700">
                                                            {(module.topics || []).sort((a, b) => a.order - b.order).map(topic => (
                                                                <div key={topic._id} className="flex justify-between items-center p-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-all duration-150">
                                                                    <span className="text-xs text-gray-700 dark:text-gray-300">
                                                                        Topic {topic.order}: <span className="font-semibold text-gray-900 dark:text-gray-100">{topic.title}</span>
                                                                    </span>
                                                                    <div className="flex gap-2">
                                                                        <button 
                                                                            onClick={() => handleOpenTopicEditor(module, topic)} 
                                                                            onMouseEnter={() => { import('./CourseEditorEditorPanel'); }} 
                                                                            className="admin-action-button edit-button" 
                                                                            title="Edit Content/Notes/Quiz"
                                                                        >
                                                                            <Edit size={14} />
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleDeleteTopic(topic._id, module._id, topic.title)} 
                                                                            className="admin-action-button delete-button" 
                                                                            title="Delete Topic"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {(module.topics || []).length === 0 && (
                                                                <p className="p-3 text-center text-xs text-gray-400 dark:text-gray-500 italic">
                                                                    No topics in this module. Click '+ Topic' to add one.
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {(course.modules || []).length === 0 && (
                                            <p className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
                                                No modules created for this course yet.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return (
        <>
            <MessageBox type={formMessage.type} text={formMessage.text} />
            
            {/* Page Header Area with Add Course Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 className="admin-section-title mb-0 border-b-0 pb-0 flex items-center gap-2">
                    <Info size={20} /> Existing Courses
                </h3>
                <button 
                    onClick={() => setIsAddModalOpen(true)} 
                    className="admin-button-primary flex items-center gap-2 self-start sm:self-auto"
                >
                    <PlusCircle size={18} /> Add New Course
                </button>
            </div>

            {isLoading && courses.length === 0 ? (
                <p className="text-center text-gray-550 dark:text-gray-400 my-8">Loading courses...</p>
            ) : courses.length === 0 ? (
                <p className="admin-message-info my-6">No courses found. Click 'Add New Course' above to create one!</p>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead className="admin-table-thead">
                            <tr>
                                <th className="admin-table-th rounded-tl-lg">Title</th>
                                <th className="admin-table-th">Modules</th>
                                <th className="admin-table-th">Description</th>
                                <th className="admin-table-th">Type</th>
                                <th className="admin-table-th">Price</th>
                                <th className="admin-table-th">Status</th>
                                <th className="admin-table-th">Image</th>  
                                <th className="admin-table-th">Rating</th>
                                <th className="admin-table-th rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map((course) => (
                                <tr key={course._id} className="admin-table-tr">
                                    <td className="admin-table-td" data-label="Title">{course.title}</td>
                                    <td className="admin-table-td" data-label="Modules">{(course.modules || []).length}</td>
                                    <td className="admin-table-td admin-table-td-description" data-label="Description">{course.description.substring(0, 50)}...</td>
                                    <td className="admin-table-td" data-label="Type">{course.type}</td>
                                    <td className="admin-table-td" data-label="Price">{course.price}</td>
                                    <td className="admin-table-td" data-label="Status">{course.status}</td>
                                    <td className="admin-table-td" data-label="Image">{course.imageUrl ? <img src={course.imageUrl} alt="Course" className="admin-table-image" /> : 'N/A'}</td>
                                    <td className="admin-table-td" data-label="Rating">{course.rating ? course.rating.toFixed(1) : 'N/A'}</td>
                                    <td className="admin-table-td admin-table-actions" data-label="Actions">
                                        <button onClick={() => startEditingCourse(course)} onMouseEnter={() => { import('./CourseEditorEditorPanel'); }} title="Edit" className="admin-action-button edit-button">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => confirmDeleteCourse(course._id)} title="Delete" className="admin-action-button delete-button">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ADD COURSE MODAL */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3 className="modal-title flex items-center gap-2">
                                <PlusCircle size={22} className="text-teal-500" /> Add New Course
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddCourse}>
                            <div className="form-group">
                                <label htmlFor="newCourseTitle" className="form-label">Title</label>
                                <input type="text" id="newCourseTitle" name="title" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} required className="form-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="newCourseDescription" className="form-label">Description</label>
                                <textarea id="newCourseDescription" name="description" value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} rows="3" required className="form-textarea"></textarea>
                            </div>
                            <div className="form-group">
                                <label htmlFor="newCourseType" className="form-label">Type</label>
                                <select id="newCourseType" name="type" value={newCourse.type} onChange={(e) => setNewCourse({ ...newCourse, type: e.target.value, price: e.target.value === 'free' ? 'Free' : '' })} className="form-select">
                                    <option value="paid">Paid</option>
                                    <option value="free">Free</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="newCoursePrice" className="form-label">Price (e.g., ₹9,999 or Free)</label>
                                <input type="text" id="newCoursePrice" name="price" value={newCourse.price} onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })} required={newCourse.type === 'paid'} disabled={newCourse.type === 'free'} className={`form-input ${newCourse.type === 'free' ? 'disabled' : ''}`} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="newCourseImageUrl" className="form-label">Image URL</label>
                                <input type="text" id="newCourseImageUrl" name="imageUrl" value={newCourse.imageUrl.startsWith('data:image/') ? '' : newCourse.imageUrl} onChange={(e) => setNewCourse({ ...newCourse, imageUrl: e.target.value })} className="form-input" placeholder="e.g., https://example.com/course.jpg" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Or Upload Course Image</label>
                                <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, false)} className="form-input" style={{ padding: '0.35rem 0.5rem' }} />
                                {newCourse.imageUrl && newCourse.imageUrl.startsWith('data:image/') && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">✓ Image Uploaded</span>
                                        <button type="button" onClick={() => setNewCourse(prev => ({ ...prev, imageUrl: '' }))} className="text-xs font-semibold text-red-500 hover:text-red-700 underline">
                                            Clear File
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label htmlFor="newCourseRating" className="form-label">Rating (0-5)</label>
                                <input type="number" id="newCourseRating" name="rating" value={newCourse.rating} onChange={(e) => setNewCourse({ ...newCourse, rating: parseFloat(e.target.value) || 0 })} min="0" max="5" step="0.1" className="form-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="newCourseStatus" className="form-label">Status</label>
                                <select id="newCourseStatus" name="status" value={newCourse.status} onChange={(e) => setNewCourse({ ...newCourse, status: e.target.value })} className="form-select">
                                    <option value="running">Running</option>
                                    <option value="upcoming">Upcoming</option>
                                </select>
                            </div>
                            <div className="modal-actions-footer">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="modal-button-base modal-button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading} className="modal-button-base admin-button-primary">
                                    {isLoading ? 'Adding...' : 'Add Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT COURSE MODAL */}
            {isEditModalOpen && editingCourse && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Course: {editingCourse.title}</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateCourse}>
                            <div className="form-group"><label htmlFor="editTitle" className="form-label">Title</label><input type="text" id="editTitle" name="title" value={editingCourse.title} onChange={handleEditChange} required className="form-input" /></div>
                            <div className="form-group"><label htmlFor="editDescription" className="form-label">Description</label><textarea id="editDescription" name="description" value={editingCourse.description} onChange={handleEditChange} rows="3" required className="form-textarea"></textarea></div>
                            <div className="form-group"><label htmlFor="editType" className="form-label">Type</label><select id="editType" name="type" value={editingCourse.type} onChange={(e) => handleEditChange({ target: { name: 'type', value: e.target.value, price: e.target.value === 'free' ? 'Free' : '' } })} className="form-select"><option value="paid">Paid</option><option value="free">Free</option></select></div>
                            <div className="form-group"><label htmlFor="editPrice" className="form-label">Price</label><input type="text" id="editPrice" name="price" value={editingCourse.price} onChange={handleEditChange} required={editingCourse.type === 'paid'} disabled={editingCourse.type === 'free'} className={`form-input ${editingCourse.type === 'free' ? 'disabled' : ''}`} /></div>
                            <div className="form-group">
                                <label htmlFor="editImageUrl" className="form-label">Image URL</label>
                                <input type="text" id="editImageUrl" name="imageUrl" value={editingCourse.imageUrl.startsWith('data:image/') ? '' : editingCourse.imageUrl} onChange={handleEditChange} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Or Upload New Course Image</label>
                                <input type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, true)} className="form-input" style={{ padding: '0.35rem 0.5rem' }} />
                                {editingCourse.imageUrl && editingCourse.imageUrl.startsWith('data:image/') && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">✓ Image Uploaded</span>
                                        <button type="button" onClick={() => setEditingCourse(prev => ({ ...prev, imageUrl: '' }))} className="text-xs font-semibold text-red-500 hover:text-red-700 underline">
                                            Clear File
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="form-group"><label htmlFor="editRating" className="form-label">Rating (0-5)</label><input type="number" id="editRating" name="rating" value={editingCourse.rating} onChange={handleEditChange} min="0" max="5" step="0.1" className="form-input" /></div>
                            <div className="form-group"><label htmlFor="editStatus" className="form-label">Status</label><select id="editStatus" name="status" value={editingCourse.status} onChange={handleEditChange} className="form-select"><option value="running">Running</option><option value="upcoming">Upcoming</option></select></div>
                            <div className="modal-actions-footer"><button type="button" onClick={() => setIsEditModalOpen(false)} className="modal-button-base modal-button-cancel">Cancel</button><button type="submit" disabled={isLoading} className="modal-button-base admin-button-primary">{isLoading ? 'Updating...' : 'Update Course'}</button></div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal show={isDeleting} title="Confirm Deletion" message="Are you sure you want to delete this course? This action cannot be undone." onConfirm={handleDeleteCourse} onCancel={() => setIsDeleting(false)} />

            {/* Dedicated Section for Module/Topic Management */}
            {renderCourseContentManagement()}
            
            {/* Topic Content Editor Modal */}
            <TopicEditorModal
                show={isTopicEditModalOpen}
                topic={topicToEdit}
                onSave={handleSaveTopicContent}
                onCancel={() => setIsTopicEditModalOpen(false)}
                courseTitle={editingCourse?.title || 'N/A'}
                moduleTitle={moduleToEdit?.title || 'N/A'}
                isLoading={isLoading}
            />
        </>
    );
};

export default CourseManagement;