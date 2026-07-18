// src/components/TrackManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  X, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Info, 
  Layers, 
  ListTodo, 
  Clipboard, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import './AdminDashboard.css';
import CourseEditor from './CourseEditor';

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

// --- Topic Editor Modal Component ---
const TopicEditorModal = ({ show, topic, onSave, onCancel, trackTitle, moduleTitle, isLoading, quizzes }) => {
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
                    <p>Track: <span className="text-teal-600 dark:text-teal-400 font-bold">{trackTitle}</span></p>
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
                                        <CourseEditor initial={article.content || ''} onChange={(val) => updateArticle(index, { content: val })} />
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
                        Allocate video lessons directly to this topic.
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

const TrackManagement = () => {
    const { currentUser, logout } = useAuth();
    const [tracks, setTracks] = useState([]);
    const [newTrack, setNewTrack] = useState({ title: '', description: '', type: 'free', price: 'Free', status: 'running', icon: '', rating: 0 });
    const [editingTrack, setEditingTrack] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [trackToDelete, setTrackToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Modal & Collapse States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isContentSectionOpen, setIsContentSectionOpen] = useState(true);
    const [expandedTracks, setExpandedTracks] = useState({});
    const [expandedModules, setExpandedModules] = useState({});

    // Module/Topic Management States
    const [modules, setModules] = useState([]);
    const [moduleToEdit, setModuleToEdit] = useState(null);
    const [topicToEdit, setTopicToEdit] = useState(null);
    const [isTopicEditModalOpen, setIsTopicEditModalOpen] = useState(false);
    const [quizzes, setQuizzes] = useState([]);

    const handleIconFileChange = (e, isEdit = false) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setFormMessage({ type: 'error', text: 'Image size should be less than 2MB' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (isEdit) {
                setEditingTrack(prev => ({ ...prev, icon: reader.result }));
            } else {
                setNewTrack(prev => ({ ...prev, icon: reader.result }));
            }
        };
        reader.readAsDataURL(file);
    };

    // Api Calls
    const fetchTracks = useCallback(async () => {
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/admin/tracks`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                logout();
                setIsLoading(false);
                return;
            }

            if (response.ok) {
                setTracks(data);
                // Also gather all modules flatly for easy indexing
                const allModules = [];
                data.forEach(t => {
                    if (t.modules) {
                        t.modules.forEach(m => {
                            allModules.push({ ...m, trackId: t._id });
                        });
                    }
                });
                setModules(allModules);
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to fetch tracks.' });
            }
        } catch (error) {
            console.error('Error fetching tracks:', error);
            setFormMessage({ type: 'error', text: 'Failed to fetch tracks.' });
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    const fetchQuizzesList = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/quizzes`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                setQuizzes(data || []);
            }
        } catch (error) {
            console.error('Error fetching quizzes:', error);
        }
    }, []);

    useEffect(() => {
        fetchTracks();
        fetchQuizzesList();
    }, [currentUser, fetchTracks, fetchQuizzesList]);

    const handleAddTrack = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/tracks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(newTrack),
            });
            const data = await response.json();

            if (response.ok) {
                setTracks([...tracks, data]);
                setNewTrack({ title: '', description: '', type: 'free', price: 'Free', status: 'running', icon: '', rating: 0 });
                setFormMessage({ type: 'success', text: 'Track added successfully!' });
                setIsAddModalOpen(false);
                fetchTracks();
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to add track.' });
            }
        } catch (error) {
            console.error('Error adding track:', error);
            setFormMessage({ type: 'error', text: 'Failed to add track.' });
        } finally {
            setIsLoading(false);
        }
    };

    const startEditingTrack = (track) => {
        setEditingTrack({ ...track });
        setIsEditModalOpen(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingTrack(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateTrack = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        if (!editingTrack?._id) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/tracks/${editingTrack._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(editingTrack),
            });
            const data = await response.json();

            if (response.ok) {
                setTracks(tracks.map(t => (t._id === data._id ? data : t)));
                setIsEditModalOpen(false);
                setEditingTrack(null);
                setFormMessage({ type: 'success', text: 'Track updated successfully!' });
                fetchTracks();
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to update track.' });
            }
        } catch (error) {
            console.error('Error updating track:', error);
            setFormMessage({ type: 'error', text: 'Failed to update track.' });
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDeleteTrack = (trackId) => {
        setTrackToDelete(trackId);
        setIsDeleting(true);
    };

    const handleDeleteTrack = async () => {
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        if (!trackToDelete) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/tracks/${trackToDelete}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await response.json();

            if (response.ok) {
                setTracks(tracks.filter(t => t._id !== trackToDelete));
                setFormMessage({ type: 'success', text: data.msg || 'Track deleted.' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to delete track.' });
            }
        } catch (error) {
            console.error('Error deleting track:', error);
            setFormMessage({ type: 'error', text: 'Failed to delete track.' });
        } finally {
            setIsDeleting(false);
            setTrackToDelete(null);
            setIsLoading(false);
        }
    };

    // --- Module CRUD Handlers ---
    const handleAddModule = async (trackId) => {
        const title = prompt("Enter new module title:");
        if (!title) return;

        setIsLoading(true);
        try {
            const targetTrack = tracks.find(t => t._id === trackId);
            const newOrder = (targetTrack?.modules?.length || 0) + 1;

            const response = await fetch(`${API_BASE_URL}/admin/modules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ trackId, title, order: newOrder, topics: [] }),
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok) {
                const newModuleData = { ...data, topics: [] };
                setTracks(prev => prev.map(t => {
                    if (t._id === trackId) {
                        const updatedModules = [...(t.modules || []), newModuleData].sort((a, b) => a.order - b.order);
                        return { ...t, modules: updatedModules };
                    }
                    return t;
                }));
                setModules(prev => [...prev, newModuleData]);
                await fetchTracks(); 
                setFormMessage({ type: 'success', text: `Module '${title}' added.` });
            } else {
                throw new Error(data.msg || 'Failed to add module.');
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
            const trackId = tracks.find(t => t.modules.some(m => m._id === moduleId))?._id;
            if (!trackId) throw new Error("Could not find parent track for module.");

            const response = await fetch(`${API_BASE_URL}/api/admin/modules/${moduleId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                await fetchTracks(); 
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

    // --- Topic CRUD Handlers ---
    const handleAddTopic = async (moduleId) => {
        const title = prompt("Enter new topic title:");
        if (!title) return;

        setIsLoading(true);
        try {
            const currentModule = modules.find(m => m._id === moduleId);
            const newOrder = (currentModule?.topics.length || 0) + 1;
            
            const response = await fetch(`${API_BASE_URL}/admin/topics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ moduleId, title, order: newOrder, notes: '', videoURL: '', otherResources: [] }),
                credentials: 'include',
            });

            const data = await response.json();
            
            if (response.ok) {
                const newTopicData = { ...data }; 
                const trackId = currentModule.trackId;

                setModules(prev => prev.map(m => {
                    if (m._id === moduleId) {
                        const updatedTopics = [...m.topics, newTopicData].sort((a, b) => a.order - b.order);
                        return { ...m, topics: updatedTopics }; 
                    }
                    return m;
                }));

                setTracks(prev => prev.map(t => {
                    if (t._id === trackId) {
                        return { ...t, modules: t.modules.map(m => {
                            if (m._id === moduleId) {
                                const updatedTopics = [...m.topics, newTopicData].sort((a, b) => a.order - b.order);
                                return { ...m, topics: updatedTopics };
                            }
                            return m;
                        }) };
                    }
                    return t;
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
        const trackId = modules.find(m => m._id === moduleId)?.trackId; 

        setIsLoading(true);
        setFormMessage({ type: '', text: '' });
        
        try {
            const response = await fetch(`${API_BASE_URL}/admin/topics/${topicId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTopicData),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                setModules(prev => prev.map(m => 
                    m._id === moduleId 
                        ? { ...m, topics: m.topics.map(t => t._id === topicId ? data : t) } 
                        : m
                ));

                setTracks(prev => prev.map(t => {
                    if (t._id === trackId) {
                        return { ...t, modules: t.modules.map(m => 
                            m._id === moduleId
                                ? { ...m, topics: m.topics.map(t => t._id === topicId ? data : t) }
                                : m
                        ) };
                    }
                    return t;
                }));
               
                setFormMessage({ type: 'success', text: `Topic '${data.title}' updated.` });
                setIsTopicEditModalOpen(false);
            } else {
                throw new Error(data.msg || 'Failed to update topic.');
            }
        } catch (error) {
            setFormMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTopic = async (topicId, moduleId, title) => {
        if (!window.confirm(`Are you sure you want to delete topic: ${title}?`)) return;
        const trackId = tracks.find(t => t.modules.some(m => m._id === moduleId))?._id; 
    
        if (!trackId) {
            setFormMessage({ type: 'error', text: 'Parent track link lost. Please refresh.' });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/topics/${topicId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            
            if (response.ok) {
                setModules(prev => prev.map(m => 
                    m._id === moduleId 
                        ? { ...m, topics: (m.topics || []).filter(t => t._id !== topicId) } 
                        : m
                ));

                setTracks(prev => prev.map(t => {
                    if (t._id === trackId) {
                        return { ...t, modules: (t.modules || []).map(m => 
                            m._id === moduleId
                                ? { ...m, topics: (m.topics || []).filter(t => t._id !== topicId) }
                                : m
                        ) };
                    }
                    return t;
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

    // --- Search/Accordion Logic ---
    const [contentSearchTerm, setContentSearchTerm] = useState('');
    const [selectedTrackIdFilter, setSelectedTrackIdFilter] = useState(null);

    const filteredTracksForContent = useMemo(() => {
        let listToFilter = tracks;
        if (selectedTrackIdFilter) {
            listToFilter = tracks.filter(t => t._id === selectedTrackIdFilter);
        }
        if (!contentSearchTerm) return listToFilter;
        
        const lowerCaseSearch = contentSearchTerm.toLowerCase();
        return listToFilter.filter(track =>
            track.title.toLowerCase().includes(lowerCaseSearch) ||
            (track.modules || []).some(module =>
                module.title.toLowerCase().includes(lowerCaseSearch) ||
                (module.topics || []).some(topic => topic.title.toLowerCase().includes(lowerCaseSearch))
            )
        );
    }, [tracks, contentSearchTerm, selectedTrackIdFilter]);

    const toggleTrackCollapse = (trackId) => {
        setExpandedTracks(prev => ({ ...prev, [trackId]: !prev[trackId] }));
    };

    const toggleModuleCollapse = (moduleId) => {
        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    const renderTrackContentManagement = () => (
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <div 
                onClick={() => setIsContentSectionOpen(!isContentSectionOpen)}
                className="flex justify-between items-center cursor-pointer select-none pb-3 border-b border-gray-250 dark:border-gray-700"
            >
                <h3 className="admin-section-title mb-0 border-b-0 pb-0 flex items-center gap-2">
                    <Layers size={20} /> Track Structure & Content Management
                </h3>
                <div className={`text-gray-400 transition-transform duration-200 ${isContentSectionOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown size={20} />
                </div>
            </div>
            
            {isContentSectionOpen && (
                <div className="mt-4 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <select 
                            value={selectedTrackIdFilter || ''} 
                            onChange={(e) => setSelectedTrackIdFilter(e.target.value || null)}
                            className="form-select sm:w-64"
                        >
                            <option value="">Filter by Track</option>
                            {tracks.map(track => (
                                <option key={track._id} value={track._id}>{track.title}</option>
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
        
                    {filteredTracksForContent.map(track => {
                        const isTrackExpanded = !!expandedTracks[track._id];
                        const totalTopicsCount = track.modules?.reduce((acc, m) => acc + (m.topics?.length || 0), 0) || 0;
                        
                        return (
                            <div key={track._id} className="border border-teal-500/30 dark:border-teal-700/50 rounded-xl overflow-hidden shadow-xs transition-all duration-200 bg-gray-50/10 dark:bg-gray-900/10">
                                <div 
                                    onClick={() => toggleTrackCollapse(track._id)}
                                    className="p-4 bg-teal-500/5 dark:bg-teal-700/5 hover:bg-teal-500/10 dark:hover:bg-teal-700/10 cursor-pointer select-none flex items-center justify-between gap-4 transition-all duration-150"
                                >
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-base font-bold text-teal-600 dark:text-teal-400 truncate">{track.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {track.modules?.length || 0} Modules • {totalTopicsCount} Topics
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                            onClick={() => handleAddModule(track._id)} 
                                            className="px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-800 bg-teal-50 dark:bg-teal-950/45 hover:bg-teal-100/80 rounded-lg border border-teal-200/50 dark:border-teal-900/35 flex items-center gap-1.5"
                                        >
                                            <PlusCircle size={14} /> Add Module
                                        </button>
                                        <div 
                                            onClick={() => toggleTrackCollapse(track._id)}
                                            className={`text-teal-600 dark:text-teal-400 p-1 cursor-pointer transition-transform duration-200 ${isTrackExpanded ? 'rotate-180' : ''}`}
                                        >
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>
                                </div>
                                
                                {isTrackExpanded && (
                                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-teal-500/10 dark:border-teal-700/10 space-y-4">
                                        {(track.modules || []).sort((a, b) => a.order - b.order).map(module => {
                                            const isModExpanded = !!expandedModules[module._id];
                                            return (
                                                <div key={module._id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50/20 dark:bg-gray-800/20">
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
                                                                    No topics. Click '+ Topic' to add one.
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {(track.modules || []).length === 0 && (
                                            <p className="text-center py-4 text-xs text-gray-555 dark:text-gray-400">
                                                No modules created yet.
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
        <div className="p-1 md:p-3 space-y-6">
            <MessageBox type={formMessage.type} text={formMessage.text} />
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 className="admin-section-title mb-0 border-b-0 pb-0 flex items-center gap-2">
                    <Info size={20} /> Existing Tracks
                </h3>
                <button 
                    onClick={() => setIsAddModalOpen(true)} 
                    className="admin-button-primary flex items-center gap-2 self-start sm:self-auto"
                >
                    <PlusCircle size={18} /> Add New Track
                </button>
            </div>

            {isLoading && tracks.length === 0 ? (
                <p className="text-center text-gray-555 dark:text-gray-400">Loading tracks...</p>
            ) : tracks.length === 0 ? (
                <p className="message-info">No tracks found. Click 'Add New Track' to create one!</p>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-gray-150 dark:border-slate-800">
                    <table className="admin-table">
                        <thead className="admin-table-thead">
                            <tr>
                                <th className="admin-table-th rounded-tl-lg">Title</th>
                                <th className="admin-table-th">Type / Price</th>
                                <th className="admin-table-th">Rating</th>
                                <th className="admin-table-th">Icon</th>
                                <th className="admin-table-th rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tracks.map((track) => (
                                <tr key={track._id} className="admin-table-tr">
                                    <td className="admin-table-td font-semibold" data-label="Title">{track.title}</td>
                                    <td className="admin-table-td" data-label="Type">{track.type === 'paid' ? `Paid (${track.price})` : 'Free'}</td>
                                    <td className="admin-table-td" data-label="Rating">{track.rating} ★</td>
                                    <td className="admin-table-td" data-label="Icon">
                                        {track.icon && (track.icon.startsWith('http') || track.icon.startsWith('data:image/')) ?
                                            <img src={track.icon} alt={track.title} className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} /> :
                                            <i className={`${track.icon || 'fas fa-road'} text-xl`}></i>
                                        }
                                    </td>
                                    <td className="admin-table-td admin-table-actions">
                                        <button 
                                            onClick={() => startEditingTrack(track)} 
                                            title="Edit" 
                                            className="admin-action-button edit-button"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button 
                                            onClick={() => confirmDeleteTrack(track._id)} 
                                            title="Delete" 
                                            className="admin-action-button delete-button"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Structure Management accordion list */}
            {tracks.length > 0 && renderTrackContentManagement()}

            {/* ADD TRACK MODAL */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3 className="modal-title flex items-center gap-2">
                                <PlusCircle size={22} className="text-teal-500" /> Add New Track
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddTrack}>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input type="text" value={newTrack.title} onChange={(e) => setNewTrack({ ...newTrack, title: e.target.value })} required className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea value={newTrack.description} onChange={(e) => setNewTrack({ ...newTrack, description: e.target.value })} className="form-textarea" rows={3}></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select value={newTrack.type} onChange={(e) => setNewTrack({ ...newTrack, type: e.target.value, price: e.target.value === 'free' ? 'Free' : newTrack.price })} className="form-select">
                                        <option value="free">Free</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Price</label>
                                    <input type="text" value={newTrack.price} onChange={(e) => setNewTrack({ ...newTrack, price: e.target.value })} disabled={newTrack.type === 'free'} className="form-input" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select value={newTrack.status} onChange={(e) => setNewTrack({ ...newTrack, status: e.target.value })} className="form-select">
                                        <option value="running">Running</option>
                                        <option value="upcoming">Upcoming</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Rating</label>
                                    <input type="number" min="0" max="5" step="0.1" value={newTrack.rating} onChange={(e) => setNewTrack({ ...newTrack, rating: parseFloat(e.target.value) || 0 })} className="form-input" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Icon Image URL</label>
                                <input 
                                    type="text" 
                                    value={newTrack.icon.startsWith('data:image/') ? '' : newTrack.icon} 
                                    onChange={(e) => setNewTrack({ ...newTrack, icon: e.target.value })} 
                                    placeholder="e.g., https://img.icons8.com/..., fab fa-js"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Or Upload Icon Image</label>
                                <input type="file" accept="image/*" onChange={(e) => handleIconFileChange(e, false)} className="form-input" style={{ padding: '0.35rem 0.5rem' }} />
                                {newTrack.icon && newTrack.icon.startsWith('data:image/') && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">✓ Image Uploaded</span>
                                        <button type="button" onClick={() => setNewTrack(prev => ({ ...prev, icon: '' }))} className="text-xs font-semibold text-red-500 hover:text-red-700 underline">Clear</button>
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions-footer">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="modal-button-base modal-button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading} className="modal-button-base admin-button-primary">{isLoading ? 'Adding...' : 'Add Track'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT TRACK MODAL */}
            {isEditModalOpen && editingTrack && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Track</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateTrack}>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input type="text" name="title" value={editingTrack.title} onChange={handleEditChange} required className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea name="description" value={editingTrack.description || ''} onChange={handleEditChange} className="form-textarea" rows={3}></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select name="type" value={editingTrack.type} onChange={(e) => setEditingTrack({ ...editingTrack, type: e.target.value, price: e.target.value === 'free' ? 'Free' : editingTrack.price })} className="form-select">
                                        <option value="free">Free</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Price</label>
                                    <input type="text" name="price" value={editingTrack.price} onChange={handleEditChange} disabled={editingTrack.type === 'free'} className="form-input" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select name="status" value={editingTrack.status || 'running'} onChange={handleEditChange} className="form-select">
                                        <option value="running">Running</option>
                                        <option value="upcoming">Upcoming</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Rating</label>
                                    <input type="number" min="0" max="5" step="0.1" name="rating" value={editingTrack.rating || 0} onChange={(e) => setEditingTrack({ ...editingTrack, rating: parseFloat(e.target.value) || 0 })} className="form-input" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Icon Image URL</label>
                                <input 
                                    type="text" 
                                    name="icon"
                                    value={editingTrack.icon.startsWith('data:image/') ? '' : editingTrack.icon} 
                                    onChange={handleEditChange} 
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Or Upload New Icon Image</label>
                                <input type="file" accept="image/*" onChange={(e) => handleIconFileChange(e, true)} className="form-input" style={{ padding: '0.35rem 0.5rem' }} />
                                {editingTrack.icon && editingTrack.icon.startsWith('data:image/') && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">✓ Image Uploaded</span>
                                        <button type="button" onClick={() => setEditingTrack(prev => ({ ...prev, icon: '' }))} className="text-xs font-semibold text-red-500 hover:text-red-700 underline">Clear</button>
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions-footer">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="modal-button-base modal-button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading} className="modal-button-base admin-button-primary">{isLoading ? 'Updating...' : 'Update Track'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TOPIC EDITOR MODAL */}
            {isTopicEditModalOpen && topicToEdit && (
                <TopicEditorModal
                    show={isTopicEditModalOpen}
                    topic={topicToEdit}
                    onSave={handleSaveTopicContent}
                    onCancel={() => setIsTopicEditModalOpen(false)}
                    trackTitle={tracks.find(t => t._id === moduleToEdit?.trackId)?.title || ''}
                    moduleTitle={moduleToEdit?.title || ''}
                    isLoading={isLoading}
                    quizzes={quizzes}
                />
            )}

            <ConfirmationModal 
                show={isDeleting} 
                title="Confirm Deletion" 
                message="Are you sure you want to delete this track? This action cannot be undone." 
                onConfirm={handleDeleteTrack} 
                onCancel={() => setIsDeleting(false)} 
            />
        </div>
    );
};

export default TrackManagement;
