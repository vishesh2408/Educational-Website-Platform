// src/components/SkillManagement.jsx
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
const TopicEditorModal = ({ show, topic, onSave, onCancel, skillTitle, moduleTitle, isLoading, quizzes }) => {
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
                    <p>Skill: <span className="text-teal-600 dark:text-teal-400 font-bold">{skillTitle}</span></p>
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

const SkillManagement = () => {
    const { currentUser, logout } = useAuth();
    const [skills, setSkills] = useState([]);
    const [newSkill, setNewSkill] = useState({ title: '', description: '', type: 'free', price: 'Free', status: 'running', icon: '', rating: 0 });
    const [editingSkill, setEditingSkill] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [skillToDelete, setSkillToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Modal & Collapse States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isContentSectionOpen, setIsContentSectionOpen] = useState(true);
    const [expandedSkills, setExpandedSkills] = useState({});
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
                setEditingSkill(prev => ({ ...prev, icon: reader.result }));
            } else {
                setNewSkill(prev => ({ ...prev, icon: reader.result }));
            }
        };
        reader.readAsDataURL(file);
    };

    // Api Calls
    const fetchSkills = useCallback(async () => {
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/admin/skills`, {
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
                setSkills(data);
                // Also gather all modules flatly for easy indexing
                const allModules = [];
                data.forEach(s => {
                    if (s.modules) {
                        s.modules.forEach(m => {
                            allModules.push({ ...m, skillId: s._id });
                        });
                    }
                });
                setModules(allModules);
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to fetch skills.' });
            }
        } catch (error) {
            console.error('Error fetching skills:', error);
            setFormMessage({ type: 'error', text: 'Failed to fetch skills.' });
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
        fetchSkills();
        fetchQuizzesList();
    }, [currentUser, fetchSkills, fetchQuizzesList]);

    const handleAddSkill = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/skills`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(newSkill),
            });
            const data = await response.json();

            if (response.ok) {
                setSkills([...skills, data]);
                setNewSkill({ title: '', description: '', type: 'free', price: 'Free', status: 'running', icon: '', rating: 0 });
                setFormMessage({ type: 'success', text: 'Skill added successfully!' });
                setIsAddModalOpen(false);
                fetchSkills();
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to add skill.' });
            }
        } catch (error) {
            console.error('Error adding skill:', error);
            setFormMessage({ type: 'error', text: 'Failed to add skill.' });
        } finally {
            setIsLoading(false);
        }
    };

    const startEditingSkill = (skill) => {
        setEditingSkill({ ...skill });
        setIsEditModalOpen(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingSkill(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateSkill = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        if (!editingSkill?._id) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/skills/${editingSkill._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(editingSkill),
            });
            const data = await response.json();

            if (response.ok) {
                setSkills(skills.map(s => (s._id === data._id ? data : s)));
                setIsEditModalOpen(false);
                setEditingSkill(null);
                setFormMessage({ type: 'success', text: 'Skill updated successfully!' });
                fetchSkills();
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to update skill.' });
            }
        } catch (error) {
            console.error('Error updating skill:', error);
            setFormMessage({ type: 'error', text: 'Failed to update skill.' });
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDeleteSkill = (skillId) => {
        setSkillToDelete(skillId);
        setIsDeleting(true);
    };

    const handleDeleteSkill = async () => {
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        if (!skillToDelete) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/skills/${skillToDelete}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await response.json();

            if (response.ok) {
                setSkills(skills.filter(s => s._id !== skillToDelete));
                setFormMessage({ type: 'success', text: data.msg || 'Skill deleted.' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to delete skill.' });
            }
        } catch (error) {
            console.error('Error deleting skill:', error);
            setFormMessage({ type: 'error', text: 'Failed to delete skill.' });
        } finally {
            setIsDeleting(false);
            setSkillToDelete(null);
            setIsLoading(false);
        }
    };

    // --- Module CRUD Handlers ---
    const handleAddModule = async (skillId) => {
        const title = prompt("Enter new module title:");
        if (!title) return;

        setIsLoading(true);
        try {
            const targetSkill = skills.find(s => s._id === skillId);
            const newOrder = (targetSkill?.modules?.length || 0) + 1;

            const response = await fetch(`${API_BASE_URL}/admin/modules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ skillId, title, order: newOrder, topics: [] }),
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok) {
                const newModuleData = { ...data, topics: [] };
                setSkills(prev => prev.map(s => {
                    if (s._id === skillId) {
                        const updatedModules = [...(s.modules || []), newModuleData].sort((a, b) => a.order - b.order);
                        return { ...s, modules: updatedModules };
                    }
                    return s;
                }));
                setModules(prev => [...prev, newModuleData]);
                await fetchSkills(); 
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
            const skillId = skills.find(s => s.modules.some(m => m._id === moduleId))?._id;
            if (!skillId) throw new Error("Could not find parent skill for module.");

            const response = await fetch(`${API_BASE_URL}/admin/modules/${moduleId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                await fetchSkills(); 
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
                const skillId = currentModule.skillId;

                setModules(prev => prev.map(m => {
                    if (m._id === moduleId) {
                        const updatedTopics = [...m.topics, newTopicData].sort((a, b) => a.order - b.order);
                        return { ...m, topics: updatedTopics }; 
                    }
                    return m;
                }));

                setSkills(prev => prev.map(s => {
                    if (s._id === skillId) {
                        return { ...s, modules: s.modules.map(m => {
                            if (m._id === moduleId) {
                                const updatedTopics = [...m.topics, newTopicData].sort((a, b) => a.order - b.order);
                                return { ...m, topics: updatedTopics };
                            }
                            return m;
                        }) };
                    }
                    return s;
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
        const skillId = modules.find(m => m._id === moduleId)?.skillId; 

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

                setSkills(prev => prev.map(s => {
                    if (s._id === skillId) {
                        return { ...s, modules: s.modules.map(m => 
                            m._id === moduleId
                                ? { ...m, topics: m.topics.map(t => t._id === topicId ? data : t) }
                                : m
                        ) };
                    }
                    return s;
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
        const skillId = skills.find(s => s.modules.some(m => m._id === moduleId))?._id; 
    
        if (!skillId) {
            setFormMessage({ type: 'error', text: 'Parent skill link lost. Please refresh.' });
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

                setSkills(prev => prev.map(s => {
                    if (s._id === skillId) {
                        return { ...s, modules: (s.modules || []).map(m => 
                            m._id === moduleId
                                ? { ...m, topics: (m.topics || []).filter(t => t._id !== topicId) }
                                : m
                        ) };
                    }
                    return s;
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
    const [selectedSkillIdFilter, setSelectedSkillIdFilter] = useState(null);

    const filteredSkillsForContent = useMemo(() => {
        let listToFilter = skills;
        if (selectedSkillIdFilter) {
            listToFilter = skills.filter(s => s._id === selectedSkillIdFilter);
        }
        if (!contentSearchTerm) return listToFilter;
        
        const lowerCaseSearch = contentSearchTerm.toLowerCase();
        return listToFilter.filter(skill =>
            skill.title.toLowerCase().includes(lowerCaseSearch) ||
            (skill.modules || []).some(module =>
                module.title.toLowerCase().includes(lowerCaseSearch) ||
                (module.topics || []).some(topic => topic.title.toLowerCase().includes(lowerCaseSearch))
            )
        );
    }, [skills, contentSearchTerm, selectedSkillIdFilter]);

    const toggleSkillCollapse = (skillId) => {
        setExpandedSkills(prev => ({ ...prev, [skillId]: !prev[skillId] }));
    };

    const toggleModuleCollapse = (moduleId) => {
        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    const renderSkillContentManagement = () => (
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <div 
                onClick={() => setIsContentSectionOpen(!isContentSectionOpen)}
                className="flex justify-between items-center cursor-pointer select-none pb-3 border-b border-gray-250 dark:border-gray-700"
            >
                <h3 className="admin-section-title mb-0 border-b-0 pb-0 flex items-center gap-2">
                    <Layers size={20} /> Skill Structure & Content Management
                </h3>
                <div className={`text-gray-400 transition-transform duration-200 ${isContentSectionOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown size={20} />
                </div>
            </div>
            
            {isContentSectionOpen && (
                <div className="mt-4 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <select 
                            value={selectedSkillIdFilter || ''} 
                            onChange={(e) => setSelectedSkillIdFilter(e.target.value || null)}
                            className="form-select sm:w-64"
                        >
                            <option value="">Filter by Skill</option>
                            {skills.map(skill => (
                                <option key={skill._id} value={skill._id}>{skill.title}</option>
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
        
                    {filteredSkillsForContent.map(skill => {
                        const isSkillExpanded = !!expandedSkills[skill._id];
                        const totalTopicsCount = skill.modules?.reduce((acc, m) => acc + (m.topics?.length || 0), 0) || 0;
                        
                        return (
                            <div key={skill._id} className="border border-teal-500/30 dark:border-teal-700/50 rounded-xl overflow-hidden shadow-xs transition-all duration-200 bg-gray-50/10 dark:bg-gray-900/10">
                                <div 
                                    onClick={() => toggleSkillCollapse(skill._id)}
                                    className="p-4 bg-teal-500/5 dark:bg-teal-700/5 hover:bg-teal-500/10 dark:hover:bg-teal-700/10 cursor-pointer select-none flex items-center justify-between gap-4 transition-all duration-150"
                                >
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-base font-bold text-teal-600 dark:text-teal-400 truncate">{skill.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {skill.modules?.length || 0} Modules • {totalTopicsCount} Topics
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                            onClick={() => handleAddModule(skill._id)} 
                                            className="px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-800 bg-teal-50 dark:bg-teal-950/45 hover:bg-teal-100/80 rounded-lg border border-teal-200/50 dark:border-teal-900/35 flex items-center gap-1.5"
                                        >
                                            <PlusCircle size={14} /> Add Module
                                        </button>
                                        <div 
                                            onClick={() => toggleSkillCollapse(skill._id)}
                                            className={`text-teal-600 dark:text-teal-400 p-1 cursor-pointer transition-transform duration-200 ${isSkillExpanded ? 'rotate-180' : ''}`}
                                        >
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>
                                </div>
                                
                                {isSkillExpanded && (
                                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-teal-500/10 dark:border-teal-700/10 space-y-4">
                                        {(skill.modules || []).sort((a, b) => a.order - b.order).map(module => {
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
                                        {(skill.modules || []).length === 0 && (
                                            <p className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
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
                    <Info size={20} /> Existing Skills
                </h3>
                <button 
                    onClick={() => setIsAddModalOpen(true)} 
                    className="admin-button-primary flex items-center gap-2 self-start sm:self-auto"
                >
                    <PlusCircle size={18} /> Add New Skill
                </button>
            </div>

            {isLoading && skills.length === 0 ? (
                <p className="text-center text-gray-555 dark:text-gray-400">Loading skills...</p>
            ) : skills.length === 0 ? (
                <p className="message-info">No skills found. Click 'Add New Skill' to create one!</p>
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
                            {skills.map((skill) => (
                                <tr key={skill._id} className="admin-table-tr">
                                    <td className="admin-table-td font-semibold" data-label="Title">{skill.title}</td>
                                    <td className="admin-table-td" data-label="Type">{skill.type === 'paid' ? `Paid (${skill.price})` : 'Free'}</td>
                                    <td className="admin-table-td" data-label="Rating">{skill.rating} ★</td>
                                    <td className="admin-table-td" data-label="Icon">
                                        {skill.icon && (skill.icon.startsWith('http') || skill.icon.startsWith('data:image/')) ?
                                            <img src={skill.icon} alt={skill.title} className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} /> :
                                            <i className={`${skill.icon || 'fas fa-book'} text-xl`}></i>
                                        }
                                    </td>
                                    <td className="admin-table-td admin-table-actions">
                                        <button 
                                            onClick={() => startEditingSkill(skill)} 
                                            title="Edit" 
                                            className="admin-action-button edit-button"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button 
                                            onClick={() => confirmDeleteSkill(skill._id)} 
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
            {skills.length > 0 && renderSkillContentManagement()}

            {/* ADD SKILL MODAL */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3 className="modal-title flex items-center gap-2">
                                <PlusCircle size={22} className="text-teal-500" /> Add New Skill
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddSkill}>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input type="text" value={newSkill.title} onChange={(e) => setNewSkill({ ...newSkill, title: e.target.value })} required className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea value={newSkill.description} onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })} className="form-textarea" rows={3}></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select value={newSkill.type} onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value, price: e.target.value === 'free' ? 'Free' : newSkill.price })} className="form-select">
                                        <option value="free">Free</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Price</label>
                                    <input type="text" value={newSkill.price} onChange={(e) => setNewSkill({ ...newSkill, price: e.target.value })} disabled={newSkill.type === 'free'} className="form-input" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select value={newSkill.status} onChange={(e) => setNewSkill({ ...newSkill, status: e.target.value })} className="form-select">
                                        <option value="running">Running</option>
                                        <option value="upcoming">Upcoming</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Rating</label>
                                    <input type="number" min="0" max="5" step="0.1" value={newSkill.rating} onChange={(e) => setNewSkill({ ...newSkill, rating: parseFloat(e.target.value) || 0 })} className="form-input" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Icon Image URL</label>
                                <input 
                                    type="text" 
                                    value={newSkill.icon.startsWith('data:image/') ? '' : newSkill.icon} 
                                    onChange={(e) => setNewSkill({ ...newSkill, icon: e.target.value })} 
                                    placeholder="e.g., https://img.icons8.com/..., fab fa-js"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Or Upload Icon Image</label>
                                <input type="file" accept="image/*" onChange={(e) => handleIconFileChange(e, false)} className="form-input" style={{ padding: '0.35rem 0.5rem' }} />
                                {newSkill.icon && newSkill.icon.startsWith('data:image/') && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">✓ Image Uploaded</span>
                                        <button type="button" onClick={() => setNewSkill(prev => ({ ...prev, icon: '' }))} className="text-xs font-semibold text-red-500 hover:text-red-700 underline">Clear</button>
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions-footer">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="modal-button-base modal-button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading} className="modal-button-base admin-button-primary">{isLoading ? 'Adding...' : 'Add Skill'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT SKILL MODAL */}
            {isEditModalOpen && editingSkill && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Skill</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateSkill}>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input type="text" name="title" value={editingSkill.title} onChange={handleEditChange} required className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea name="description" value={editingSkill.description || ''} onChange={handleEditChange} className="form-textarea" rows={3}></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select name="type" value={editingSkill.type} onChange={(e) => setEditingSkill({ ...editingSkill, type: e.target.value, price: e.target.value === 'free' ? 'Free' : editingSkill.price })} className="form-select">
                                        <option value="free">Free</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Price</label>
                                    <input type="text" name="price" value={editingSkill.price} onChange={handleEditChange} disabled={editingSkill.type === 'free'} className="form-input" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select name="status" value={editingSkill.status || 'running'} onChange={handleEditChange} className="form-select">
                                        <option value="running">Running</option>
                                        <option value="upcoming">Upcoming</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Rating</label>
                                    <input type="number" min="0" max="5" step="0.1" name="rating" value={editingSkill.rating || 0} onChange={(e) => setEditingSkill({ ...editingSkill, rating: parseFloat(e.target.value) || 0 })} className="form-input" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Icon Image URL</label>
                                <input 
                                    type="text" 
                                    name="icon"
                                    value={editingSkill.icon.startsWith('data:image/') ? '' : editingSkill.icon} 
                                    onChange={handleEditChange} 
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Or Upload New Icon Image</label>
                                <input type="file" accept="image/*" onChange={(e) => handleIconFileChange(e, true)} className="form-input" style={{ padding: '0.35rem 0.5rem' }} />
                                {editingSkill.icon && editingSkill.icon.startsWith('data:image/') && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">✓ Image Uploaded</span>
                                        <button type="button" onClick={() => setEditingSkill(prev => ({ ...prev, icon: '' }))} className="text-xs font-semibold text-red-500 hover:text-red-700 underline">Clear</button>
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions-footer">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="modal-button-base modal-button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading} className="modal-button-base admin-button-primary">{isLoading ? 'Updating...' : 'Update Skill'}</button>
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
                    skillTitle={skills.find(s => s._id === moduleToEdit?.skillId)?.title || ''}
                    moduleTitle={moduleToEdit?.title || ''}
                    isLoading={isLoading}
                    quizzes={quizzes}
                />
            )}

            <ConfirmationModal 
                show={isDeleting} 
                title="Confirm Deletion" 
                message="Are you sure you want to delete this skill? This action cannot be undone." 
                onConfirm={handleDeleteSkill} 
                onCancel={() => setIsDeleting(false)} 
            />
        </div>
    );
};

export default SkillManagement;
