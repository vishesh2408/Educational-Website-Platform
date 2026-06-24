// src/components/TutorialManagement.jsx
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

const InputModal = ({ show, title, label, defaultValue = '', onSave, onCancel, saveText = 'Save', cancelText = 'Cancel', isLoading = false }) => {
    const [inputValue, setInputValue] = useState(defaultValue);

    useEffect(() => {
        if (show) {
            setInputValue(defaultValue);
        }
    }, [show, defaultValue]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onSave(inputValue.trim());
        }
    };

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
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        {label && <label className="form-label">{label}</label>}
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            required
                            className="form-input"
                            autoFocus
                        />
                    </div>
                    <div className="modal-actions-footer">
                        <button type="button" onClick={onCancel} className="modal-button-base modal-button-cancel">
                            {cancelText}
                        </button>
                        <button type="submit" disabled={isLoading || !inputValue.trim()} className="modal-button-base admin-button-primary">
                            {isLoading ? 'Saving...' : saveText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Topic Editor Modal Component ---
const TopicEditorModal = ({ show, topic, onSave, onCancel, tutorialTitle, moduleTitle, isLoading, quizzes }) => {
    if (!show || !topic) return null;

    const [editedTopic, setEditedTopic] = useState(topic);
    const [resources, setResources] = useState(topic.otherResources || []);
    const [articles, setArticles] = useState(Array.isArray(topic.articles) ? topic.articles : []);
    const [videos, setVideos] = useState(topic.videos || []);

    useEffect(() => {
        setEditedTopic(topic);
        setResources(topic.otherResources || []);
        setArticles(Array.isArray(topic.articles) ? topic.articles : []);
        setVideos(topic.videos || []);
    }, [topic]);

    const handleResourceChange = (index, field, value) => {
        const newResources = [...resources];
        newResources[index][field] = value;
        setResources(newResources);
    };

    const handleVideoChange = (index, field, value) => {
        const newVideos = [...videos];
        newVideos[index][field] = value;
        setVideos(newVideos);
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
            videos: videos.filter(v => v.title && v.videoURL),
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
                    <p>Tutorial: <span className="text-teal-600 dark:text-teal-400 font-bold">{tutorialTitle}</span></p>
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
                                            <label className="form-label">Linked Quiz (Optional)</label>
                                            <select
                                                value={article.quizId || ''}
                                                onChange={(e) => updateArticle(index, { quizId: e.target.value || null })}
                                                className="form-select"
                                            >
                                                <option value="">No Quiz Linked</option>
                                                {Array.isArray(quizzes) && quizzes.map(quiz => (
                                                    <option key={quiz._id} value={quiz._id}>
                                                        {quiz.title}
                                                    </option>
                                                ))}
                                            </select>
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

                    <h4 className="font-bold mt-6 mb-2 text-lg text-gray-800 dark:text-gray-200">Videos</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Allocate video lessons directly to this topic. These will show up in the student's Videos tab.
                    </p>
                    {videos.map((vid, index) => (
                        <div key={index} className="flex gap-4 mb-2 items-center p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-850">
                            <input 
                                type="text" 
                                value={vid.title} 
                                onChange={(e) => handleVideoChange(index, 'title', e.target.value)} 
                                placeholder="Video Title"
                                className="form-input flex-1"
                                required
                            />
                            <input 
                                type="url" 
                                value={vid.videoURL} 
                                onChange={(e) => handleVideoChange(index, 'videoURL', e.target.value)} 
                                placeholder="Video URL (e.g., https://youtube.com/watch?v=...)"
                                className="form-input flex-1"
                                required
                            />
                            <button type="button" onClick={() => setVideos(videos.filter((_, i) => i !== index))} className="admin-action-button delete-button p-2"><Trash2 size={18} /></button>
                        </div>
                    ))}
                    <button type="button" onClick={() => setVideos([...videos, { title: '', videoURL: '' }])} className="admin-button-secondary w-full my-2">
                        + Add Video
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

const TutorialManagement = () => {
    const { currentUser, logout } = useAuth();
    const { openModal } = useModal();
    const [tutorials, setTutorials] = useState([]);
    const [newTutorial, setNewTutorial] = useState({ title: '', description: '', type: 'paid', price: '', status: 'running', imageUrl: '', rating: 0 });
    const [editingTutorial, setEditingTutorial] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [tutorialToDelete, setTutorialToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Modal & Collapse States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isContentSectionOpen, setIsContentSectionOpen] = useState(true);
    const [expandedTutorials, setExpandedTutorials] = useState({});
    const [expandedModules, setExpandedModules] = useState({});

    // Custom Modal state hooks for creating modules & topics dynamically
    const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);
    const [targetTutorialIdForNewModule, setTargetTutorialIdForNewModule] = useState(null);

    const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);
    const [targetModuleIdForNewTopic, setTargetModuleIdForNewTopic] = useState(null);

    // Confirmation states for deleting modules & topics
    const [moduleToDelete, setModuleToDelete] = useState(null);
    const [topicToDelete, setTopicToDelete] = useState(null);

    // Custom Modal state hooks for editing module & tutorial names
    const [isEditModuleModalOpen, setIsEditModuleModalOpen] = useState(false);
    const [targetModuleForRename, setTargetModuleForRename] = useState(null);

    const [isEditTutorialNameModalOpen, setIsEditTutorialNameModalOpen] = useState(false);
    const [targetTutorialForRename, setTargetTutorialForRename] = useState(null);

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
                setEditingTutorial(prev => ({ ...prev, imageUrl: reader.result }));
            } else {
                setNewTutorial(prev => ({ ...prev, imageUrl: reader.result }));
            }
        };
        reader.readAsDataURL(file);
    };

     // Module/Topic Management States
    const [modules, setModules] = useState([]);
    const [moduleToEdit, setModuleToEdit] = useState(null);
    const [topicToEdit, setTopicToEdit] = useState(null);
    const [isTopicEditModalOpen, setIsTopicEditModalOpen] = useState(false);
    const [quizzes, setQuizzes] = useState([]);

    // Api Calls
    const fetchTutorials = useCallback(async () => {
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/tutorials`, {
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
                setTutorials(data);
                setFormMessage({ type: 'success', text: 'Tutorials loaded successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to fetch tutorials.' });
                if (response.status === 401 || response.status === 403) logout();
            }
        } catch (error) {
            console.error('Error fetching tutorials:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to fetch tutorials.' });
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    const fetchQuizzes = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/quizzes`, {
                headers: { 'content-type': 'application/json' },
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setQuizzes(data);
            }
        } catch (error) {
            console.error('Error fetching quizzes:', error);
        }
    }, []);

    useEffect(() => {
        fetchTutorials();
        fetchQuizzes();
    }, [fetchTutorials, fetchQuizzes]);

    // Tutorial Handlers: Create, Edit, Delete
    const handleAddTutorial = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/tutorials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    title: newTutorial.title,
                    description: '',
                    type: 'free',
                    price: 'Free',
                    status: 'running',
                    imageUrl: '',
                    rating: 0
                }),
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                setTutorials([...tutorials, data]);
                setNewTutorial({ title: '', description: '', type: 'free', price: 'Free', status: 'running', imageUrl: '', rating: 0 });
                setFormMessage({ type: 'success', text: 'Tutorial added successfully!' });
                setIsAddModalOpen(false); // Close Modal on success
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to add tutorial.' });
                if (response.status === 401 || response.status === 403) logout();
            }
        } catch (error) {
            console.error('Error adding tutorial:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to add tutorial.' });
        } finally {
            setIsLoading(false);
        }
    };

    const startEditingTutorial = (tutorial) => {
        setEditingTutorial({ ...tutorial });
        setModules(tutorial.modules || []);
        setIsEditModalOpen(true);
    };

    const handleEditChange = (e) => {
        const { name, value, type } = e.target;
        setEditingTutorial(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleUpdateTutorial = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        if (!editingTutorial?._id) {
            setFormMessage({ type: 'error', text: 'Tutorial ID missing.' });
            setIsLoading(false);
            return;
        }

        const { modules } = editingTutorial;

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/tutorials/${editingTutorial._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    title: editingTutorial.title,
                    description: editingTutorial.description || '',
                    type: editingTutorial.type || 'free',
                    price: editingTutorial.price || 'Free',
                    status: editingTutorial.status || 'running',
                    imageUrl: editingTutorial.imageUrl || '',
                    rating: parseFloat(editingTutorial.rating) || 0
                }),
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
                setTutorials(tutorials.map(c => (c._id === data._id ? { ...c, ...data, modules: modules } : c)));
                setIsEditModalOpen(false);
                setEditingTutorial(null);
                setFormMessage({ type: 'success', text: 'Tutorial updated successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to update tutorial.' });
                if (response.status === 401 || response.status === 403) logout();
            }
        } catch (error) {
            console.error('Error updating tutorial:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to update tutorial.' });
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDeleteTutorial = (tutorialId) => {
        setTutorialToDelete(tutorialId);
        setIsDeleting(true);
    };

    const handleDeleteTutorial = async () => {
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        if (!tutorialToDelete) {
            setFormMessage({ type: 'error', text: 'Tutorial ID missing for deletion.' });
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/tutorials/${tutorialToDelete}`, {
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
                setTutorials(tutorials.filter(c => c._id !== tutorialToDelete));
                setFormMessage({ type: 'success', text: data.msg || 'Tutorial deleted successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to delete tutorial.' });
            }
        } catch (error) {
            console.error('Error deleting tutorial:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to delete tutorial.' });
        } finally {
            setIsDeleting(false);
            setTutorialToDelete(null);
            setIsLoading(false);
        }
    };

    // --- Module CRUD Handlers ---
    const triggerAddModule = (tutorialId) => {
        setTargetTutorialIdForNewModule(tutorialId);
        setIsAddModuleModalOpen(true);
    };

    const handleAddModule = async (title) => {
        if (!targetTutorialIdForNewModule || !title) return;
        const tutorialId = targetTutorialIdForNewModule;
        setIsLoading(true);
        try {
            const targetTutorial = tutorials.find(c => c._id === tutorialId);
            const newOrder = (targetTutorial?.modules?.length || 0) + 1;

            const response = await fetch(`${API_BASE_URL}/api/admin/tutorial-modules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ tutorialId, title, order: newOrder, topics: [] }),
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
                
                setTutorials(prevTutorials => prevTutorials.map(c => {
                    if (c._id === tutorialId) {
                        const updatedModules = [...(c.modules || []), newModuleData].sort((a, b) => a.order - b.order);
                        return { ...c, modules: updatedModules };
                    }
                    return c;
                }));
                
                setModules(prev => [...prev, newModuleData]);
                await fetchTutorials(); 
                setFormMessage({ type: 'success', text: `Module '${title}' added.` });
                setIsAddModuleModalOpen(false);
                setTargetTutorialIdForNewModule(null);
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

    const triggerDeleteModule = (moduleId, title) => {
        setModuleToDelete({ id: moduleId, title });
    };

    const handleDeleteModule = async () => {
        if (!moduleToDelete) return;
        const moduleId = moduleToDelete.id;
        const title = moduleToDelete.title;
        setIsLoading(true);
        try {
            const tutorialId = tutorials.find(c => c.modules.some(m => m._id === moduleId))?._id;
            if (!tutorialId) throw new Error("Could not find parent tutorial for module.");

            const response = await fetch(`${API_BASE_URL}/api/admin/tutorial-modules/${moduleId}`, {
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
                await fetchTutorials(); 
                setModules(prev => prev.filter(m => m._id !== moduleId));
                setFormMessage({ type: 'success', text: `Module '${title}' deleted.` });
                setModuleToDelete(null);
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

    const triggerEditModule = (moduleId, title) => {
        setTargetModuleForRename({ id: moduleId, title });
        setIsEditModuleModalOpen(true);
    };

    const handleEditModule = async (newTitle) => {
        if (!targetModuleForRename || !newTitle.trim()) return;
        const moduleId = targetModuleForRename.id;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/tutorial-modules/${moduleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle.trim() }),
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
                setModules(prev => prev.map(m => m._id === moduleId ? { ...m, title: data.title } : m));
                await fetchTutorials();
                setFormMessage({ type: 'success', text: `Module renamed to '${data.title}'.` });
                setIsEditModuleModalOpen(false);
                setTargetModuleForRename(null);
            } else {
                throw new Error(data.msg || 'Failed to rename module.');
            }
        } catch (error) {
            setFormMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const triggerEditTutorialName = (tutorialId, title) => {
        setTargetTutorialForRename({ id: tutorialId, title });
        setIsEditTutorialNameModalOpen(true);
    };

    const handleEditTutorialName = async (newTitle) => {
        if (!targetTutorialForRename || !newTitle.trim()) return;
        const tutorialId = targetTutorialForRename.id;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/tutorials/${tutorialId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle.trim() }),
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
                setTutorials(prev => prev.map(t => t._id === tutorialId ? { ...t, title: data.title } : t));
                setFormMessage({ type: 'success', text: `Tutorial renamed to '${data.title}'.` });
                setIsEditTutorialNameModalOpen(false);
                setTargetTutorialForRename(null);
            } else {
                throw new Error(data.msg || 'Failed to rename tutorial.');
            }
        } catch (error) {
            setFormMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // --- Topic CRUD Handlers (Includes Notes/Content) ---
    const triggerAddTopic = (moduleId) => {
        setTargetModuleIdForNewTopic(moduleId);
        setIsAddTopicModalOpen(true);
    };

    const handleAddTopic = async (title) => {
        if (!targetModuleIdForNewTopic || !title) return;
        const moduleId = targetModuleIdForNewTopic;
        setIsLoading(true);
        try {
            const currentModule = modules.find(m => m._id === moduleId);
            const newOrder = (currentModule?.topics.length || 0) + 1;
            
            const response = await fetch(`${API_BASE_URL}/api/admin/tutorial-topics`, {
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
                const tutorialId = currentModule.tutorialId;

                setModules(prev => prev.map(m => {
                    if (m._id === moduleId) {
                        const updatedTopics = [...m.topics, newTopicData].sort((a, b) => a.order - b.order);
                        return { ...m, topics: updatedTopics }; 
                    }
                    return m;
                }));

                setTutorials(prevTutorials => prevTutorials.map(c => {
                    if (c._id === tutorialId) {
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
                setIsAddTopicModalOpen(false);
                setTargetModuleIdForNewTopic(null);
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
        const tutorialId = modules.find(m => m._id === moduleId)?.tutorialId; 

        setIsLoading(true);
        setFormMessage({ type: '', text: '' });
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/tutorial-topics/${topicId}`, {
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

                setTutorials(prevTutorials => prevTutorials.map(c => {
                    if (c._id === tutorialId) {
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

    const triggerDeleteTopic = (topicId, moduleId, title) => {
        setTopicToDelete({ id: topicId, moduleId, title });
    };

    const handleDeleteTopic = async () => {
        if (!topicToDelete) return;
        const { id: topicId, moduleId, title } = topicToDelete;
        const tutorialId = tutorials.find(c => c.modules.some(m => m._id === moduleId))?._id; 
    
        if (!tutorialId) {
            setFormMessage({ type: 'error', text: 'Parent tutorial link lost. Please refresh the page.' });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/tutorial-topics/${topicId}`, {
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

                setTutorials(prevTutorials => prevTutorials.map(c => {
                    if (c._id === tutorialId) {
                        return { ...c, modules: (c.modules || []).map(m => 
                            m._id === moduleId
                                ? { ...m, topics: (m.topics || []).filter(t => t._id !== topicId) }
                                : m
                        ) };
                    }
                    return c;
                }));
                setFormMessage({ type: 'success', text: `Topic '${title}' deleted.` });
                setTopicToDelete(null);
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

    // --- Tutorial Content Filter/Search Logic ---
    const [contentSearchTerm, setContentSearchTerm] = useState('');
    const [selectedTutorialId, setSelectedTutorialId] = useState(null);

    const filteredTutorialsForContent = useMemo(() => {
        let listToFilter = tutorials;

        if (selectedTutorialId) {
            listToFilter = tutorials.filter(c => c._id === selectedTutorialId);
        }

        if (!contentSearchTerm) return listToFilter;
        
        const lowerCaseSearch = contentSearchTerm.toLowerCase();

        return listToFilter.filter(tutorial =>
            tutorial.title.toLowerCase().includes(lowerCaseSearch) ||
            (tutorial.modules || []).some(module =>
                module.title.toLowerCase().includes(lowerCaseSearch) ||
                (module.topics || []).some(topic => topic.title.toLowerCase().includes(lowerCaseSearch))
            )
        );
    }, [tutorials, contentSearchTerm, selectedTutorialId]);

    const toggleTutorialCollapse = (tutorialId) => {
        setExpandedTutorials(prev => ({ ...prev, [tutorialId]: !prev[tutorialId] }));
    };

    const toggleModuleCollapse = (moduleId) => {
        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    // --- Render Logic ---
    const renderTutorialContentManagement = () => (
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
            {/* Header section (Clickable to collapse/expand entire management section) */}
            <div 
                onClick={() => setIsContentSectionOpen(!isContentSectionOpen)}
                className="flex justify-between items-center cursor-pointer select-none pb-3 border-b border-gray-250 dark:border-gray-700"
            >
                <h3 className="admin-section-title mb-0 border-b-0 pb-0 flex items-center gap-2">
                    <Layers size={20} /> Tutorial Structure & Content Management
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
                            value={selectedTutorialId || ''} 
                            onChange={(e) => setSelectedTutorialId(e.target.value || null)}
                            className="form-select sm:w-64"
                        >
                            <option value="">Filter by Tutorial</option>
                            {tutorials.map(tutorial => (
                                <option key={tutorial._id} value={tutorial._id}>{tutorial.title}</option>
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
        
                    {/* Tutorials Accordion List */}
                    {filteredTutorialsForContent.map(tutorial => {
                        const isTutorialExpanded = !!expandedTutorials[tutorial._id];
                        const totalTopicsCount = tutorial.modules?.reduce((acc, m) => acc + (m.topics?.length || 0), 0) || 0;
                        
                        return (
                            <div key={tutorial._id} className="border border-teal-500/30 dark:border-teal-700/50 rounded-xl overflow-hidden shadow-xs transition-all duration-200 bg-gray-50/10 dark:bg-gray-900/10">
                                {/* Tutorial Accordion Trigger */}
                                <div 
                                    onClick={() => toggleTutorialCollapse(tutorial._id)}
                                    className="p-4 bg-teal-500/5 dark:bg-teal-700/5 hover:bg-teal-500/10 dark:hover:bg-teal-700/10 cursor-pointer select-none flex items-center justify-between gap-4 transition-all duration-150"
                                >
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-base font-bold text-teal-600 dark:text-teal-400 truncate">{tutorial.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {tutorial.modules?.length || 0} Modules • {totalTopicsCount} Topics
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                            onClick={() => triggerEditTutorialName(tutorial._id, tutorial.title)} 
                                            className="px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-805 bg-blue-50 dark:bg-blue-950/45 hover:bg-blue-100/80 rounded-lg border border-blue-200/50 dark:border-blue-900/35 flex items-center gap-1.5"
                                            title="Rename Tutorial"
                                        >
                                            <Edit size={14} /> Rename
                                        </button>
                                        <button 
                                            onClick={() => triggerAddModule(tutorial._id)} 
                                            className="px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-800 bg-teal-50 dark:bg-teal-950/45 hover:bg-teal-100/80 rounded-lg border border-teal-200/50 dark:border-teal-900/35 flex items-center gap-1.5"
                                        >
                                            <PlusCircle size={14} /> Add Module
                                        </button>
                                        <div 
                                            onClick={() => toggleTutorialCollapse(tutorial._id)}
                                            className={`text-teal-600 dark:text-teal-400 p-1 cursor-pointer transition-transform duration-200 ${isTutorialExpanded ? 'rotate-180' : ''}`}
                                        >
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Tutorial Content (Expanded) */}
                                {isTutorialExpanded && (
                                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-teal-500/10 dark:border-teal-700/10 space-y-4">
                                        {(tutorial.modules || []).sort((a, b) => a.order - b.order).map(module => {
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
                                                                onClick={() => triggerEditModule(module._id, module.title)} 
                                                                className="p-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded border border-blue-200/50 dark:border-blue-900/30 flex items-center gap-0.5" 
                                                                title="Rename Module"
                                                            >
                                                                <Edit size={13} /> Rename
                                                            </button>
                                                            <button 
                                                                onClick={() => triggerAddTopic(module._id)} 
                                                                className="p-1 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 rounded border border-green-200/50 dark:border-green-900/30 flex items-center gap-0.5" 
                                                                title="Add Topic"
                                                            >
                                                                <PlusCircle size={13} /> Topic
                                                            </button>
                                                            <button 
                                                                onClick={() => triggerDeleteModule(module._id, module.title)} 
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
                                                                            onClick={() => triggerDeleteTopic(topic._id, module._id, topic.title)} 
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
                                        {(tutorial.modules || []).length === 0 && (
                                            <p className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
                                                No modules created for this tutorial yet.
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
            
            {/* Page Header Area with Add Tutorial Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 className="admin-section-title mb-0 border-b-0 pb-0 flex items-center gap-2">
                    <Info size={20} /> Existing Tutorials
                </h3>
                <button 
                    onClick={() => setIsAddModalOpen(true)} 
                    className="admin-button-primary flex items-center gap-2 self-start sm:self-auto"
                >
                    <PlusCircle size={18} /> Add New Tutorial
                </button>
            </div>

            {isLoading && tutorials.length === 0 ? (
                <p className="text-center text-gray-550 dark:text-gray-400 my-8">Loading tutorials...</p>
            ) : tutorials.length === 0 ? (
                <p className="admin-message-info my-6">No tutorials found. Click 'Add New Tutorial' above to create one!</p>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead className="admin-table-thead">
                            <tr>
                                <th className="admin-table-th rounded-tl-lg">Title</th>
                                <th className="admin-table-th">Modules</th>
                                <th className="admin-table-th rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tutorials.map((tutorial) => (
                                <tr key={tutorial._id} className="admin-table-tr">
                                    <td className="admin-table-td" data-label="Title">{tutorial.title}</td>
                                    <td className="admin-table-td" data-label="Modules">{(tutorial.modules || []).length}</td>
                                    <td className="admin-table-td admin-table-actions" data-label="Actions">
                                        <button onClick={() => startEditingTutorial(tutorial)} onMouseEnter={() => { import('./CourseEditorEditorPanel'); }} title="Edit" className="admin-action-button edit-button">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => confirmDeleteTutorial(tutorial._id)} title="Delete" className="admin-action-button delete-button">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ADD TUTORIAL MODAL */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3 className="modal-title flex items-center gap-2">
                                <PlusCircle size={22} className="text-teal-500" /> Add New Tutorial
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddTutorial}>
                            <div className="form-group">
                                <label htmlFor="newTutorialTitle" className="form-label">Title</label>
                                <input type="text" id="newTutorialTitle" name="title" value={newTutorial.title} onChange={(e) => setNewTutorial({ ...newTutorial, title: e.target.value })} required className="form-input" />
                            </div>
                            <div className="modal-actions-footer">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="modal-button-base modal-button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading} className="modal-button-base admin-button-primary">
                                    {isLoading ? 'Adding...' : 'Add Tutorial'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT TUTORIAL MODAL */}
            {isEditModalOpen && editingTutorial && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Tutorial: {editingTutorial.title}</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateTutorial}>
                            <div className="form-group">
                                <label htmlFor="editTitle" className="form-label">Title</label>
                                <input type="text" id="editTitle" name="title" value={editingTutorial.title} onChange={(e) => setEditingTutorial({ ...editingTutorial, title: e.target.value })} required className="form-input" />
                            </div>
                            <div className="modal-actions-footer">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="modal-button-base modal-button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading} className="modal-button-base admin-button-primary">
                                    {isLoading ? 'Updating...' : 'Update Tutorial'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal show={isDeleting} title="Confirm Deletion" message="Are you sure you want to delete this tutorial? This action cannot be undone." onConfirm={handleDeleteTutorial} onCancel={() => setIsDeleting(false)} />

            {/* Dedicated Section for Module/Topic Management */}
            {renderTutorialContentManagement()}
            
            {/* Topic Content Editor Modal */}
            <TopicEditorModal
                show={isTopicEditModalOpen}
                topic={topicToEdit}
                onSave={handleSaveTopicContent}
                onCancel={() => setIsTopicEditModalOpen(false)}
                tutorialTitle={editingTutorial?.title || 'N/A'}
                moduleTitle={moduleToEdit?.title || 'N/A'}
                isLoading={isLoading}
                quizzes={quizzes}
            />

            {/* Custom Input Modals for Modules & Topics */}
            <InputModal
                show={isAddModuleModalOpen}
                title="Add New Module"
                label="Module Title"
                onSave={handleAddModule}
                onCancel={() => { setIsAddModuleModalOpen(false); setTargetTutorialIdForNewModule(null); }}
                isLoading={isLoading}
            />

            <InputModal
                show={isAddTopicModalOpen}
                title="Add New Topic"
                label="Topic Title"
                onSave={handleAddTopic}
                onCancel={() => { setIsAddTopicModalOpen(false); setTargetModuleIdForNewTopic(null); }}
                isLoading={isLoading}
            />

            <InputModal
                show={isEditModuleModalOpen}
                title="Rename Module"
                label="Module Title"
                defaultValue={targetModuleForRename?.title || ''}
                onSave={handleEditModule}
                onCancel={() => { setIsEditModuleModalOpen(false); setTargetModuleForRename(null); }}
                isLoading={isLoading}
            />

            <InputModal
                show={isEditTutorialNameModalOpen}
                title="Rename Tutorial"
                label="Tutorial Title"
                defaultValue={targetTutorialForRename?.title || ''}
                onSave={handleEditTutorialName}
                onCancel={() => { setIsEditTutorialNameModalOpen(false); setTargetTutorialForRename(null); }}
                isLoading={isLoading}
            />

            {/* Custom Confirmation Modals for Module & Topic Deletion */}
            <ConfirmationModal
                show={!!moduleToDelete}
                title="Confirm Module Deletion"
                message={moduleToDelete ? `Are you sure you want to delete module "${moduleToDelete.title}"? This will also delete all its topics. This action cannot be undone.` : ''}
                onConfirm={handleDeleteModule}
                onCancel={() => setModuleToDelete(null)}
            />

            <ConfirmationModal
                show={!!topicToDelete}
                title="Confirm Topic Deletion"
                message={topicToDelete ? `Are you sure you want to delete topic "${topicToDelete.title}"? This action cannot be undone.` : ''}
                onConfirm={handleDeleteTopic}
                onCancel={() => setTopicToDelete(null)}
            />
        </>
    );
};

export default TutorialManagement;
