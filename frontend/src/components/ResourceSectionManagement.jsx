import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, PlusCircle, Edit, Trash2, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

const MessageBox = ({ type, text }) => {
    if (!text) return null;
    let Icon;
    let baseClasses = 'flex items-start gap-3 p-4 rounded-xl mb-4 border shadow-sm text-sm font-medium';
    let colorClasses = '';
    
    switch (type) {
        case 'info':
            Icon = Info;
            colorClasses = 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-900/30 dark:border-sky-700/80 dark:text-sky-100';
            break;
        case 'success':
            Icon = CheckCircle;
            colorClasses = 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700/80 dark:text-emerald-100';
            break;
        case 'error':
            Icon = AlertCircle;
            colorClasses = 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/30 dark:border-rose-700/80 dark:text-rose-100';
            break;
        default:
            Icon = Info;
            colorClasses = 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-900/30 dark:border-sky-700/80 dark:text-sky-100';
    }
    return (
        <div className={`${baseClasses} ${colorClasses}`}>
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

const ResourceSectionManagement = () => {
    const { logout } = useAuth();
    const handleLogout = logout;

    const [sections, setSections] = useState([]);
    const [filterType, setFilterType] = useState('all');
    const [newSection, setNewSection] = useState({ title: '', description: '', imageUrl: '', type: 'roadmap' });
    const [editingSection, setEditingSection] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [sectionToDelete, setSectionToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const authFetchOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        }
    };

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
                setEditingSection(prev => ({ ...prev, imageUrl: reader.result }));
            } else {
                setNewSection(prev => ({ ...prev, imageUrl: reader.result }));
            }
        };
        reader.readAsDataURL(file);
    };

    const fetchSections = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/sections`, {
                ...authFetchOptions,
                method: 'GET'
            });
            if (response.status === 401 || response.status === 403) {
                handleLogout();
                return;
            }
            if (response.ok) {
                const data = await response.json();
                setSections(data || []);
            } else {
                setFormMessage({ type: 'error', text: 'Failed to fetch resource sections.' });
            }
        } catch (err) {
            console.error('Fetch sections error:', err);
            setFormMessage({ type: 'error', text: 'Failed to load sections. Server offline.' });
        } finally {
            setIsLoading(false);
        }
    }, [handleLogout]);

    useEffect(() => {
        fetchSections();
    }, [fetchSections]);

    const handleAddSection = async (e) => {
        e.preventDefault();
        if (!newSection.title.trim()) {
            setFormMessage({ type: 'error', text: 'Title is required.' });
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/sections`, {
                ...authFetchOptions,
                method: 'POST',
                body: JSON.stringify(newSection)
            });
            if (response.status === 401 || response.status === 403) {
                handleLogout();
                return;
            }
            const data = await response.json();
            if (response.ok) {
                setSections([...sections, data]);
                setNewSection({ title: '', description: '', imageUrl: '', type: 'roadmap' });
                setIsAddModalOpen(false);
                setFormMessage({ type: 'success', text: 'Resource section added successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to add resource section.' });
            }
        } catch (err) {
            console.error('Add section error:', err);
            setFormMessage({ type: 'error', text: 'Server error. Failed to add section.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateSection = async (e) => {
        e.preventDefault();
        if (!editingSection.title.trim()) {
            setFormMessage({ type: 'error', text: 'Title is required.' });
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/sections/${editingSection._id}`, {
                ...authFetchOptions,
                method: 'PUT',
                body: JSON.stringify(editingSection)
            });
            if (response.status === 401 || response.status === 403) {
                handleLogout();
                return;
            }
            const data = await response.json();
            if (response.ok) {
                setSections(sections.map(s => s._id === data._id ? data : s));
                setIsEditModalOpen(false);
                setEditingSection(null);
                setFormMessage({ type: 'success', text: 'Resource section updated successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to update resource section.' });
            }
        } catch (err) {
            console.error('Update section error:', err);
            setFormMessage({ type: 'error', text: 'Server error. Failed to update section.' });
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDeleteSection = (sectionId) => {
        setSectionToDelete(sectionId);
        setIsDeleting(true);
    };

    const handleDeleteSection = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/sections/${sectionToDelete}`, {
                ...authFetchOptions,
                method: 'DELETE'
            });
            if (response.status === 401 || response.status === 403) {
                handleLogout();
                return;
            }
            if (response.ok) {
                setSections(sections.filter(s => s._id !== sectionToDelete));
                setFormMessage({ type: 'success', text: 'Resource section deleted successfully.' });
            } else {
                setFormMessage({ type: 'error', text: 'Failed to delete resource section.' });
            }
        } catch (err) {
            console.error('Delete section error:', err);
            setFormMessage({ type: 'error', text: 'Server error. Failed to delete section.' });
        } finally {
            setIsDeleting(false);
            setSectionToDelete(null);
            setIsLoading(false);
        }
    };

    const getFilteredSections = () => {
        if (filterType === 'all') return sections;
        return sections.filter(s => s.type === filterType);
    };

    const formatType = (type) => {
        switch (type) {
            case 'roadmap': return 'Roadmap';
            case 'interview': return 'Interview Prep';
            case 'placement': return 'Placement Prep';
            case 'software_tool': return 'Software & Tools';
            case 'miscellaneous': return 'Miscellaneous';
            default: return type;
        }
    };

    return (
        <div className="admin-management-container">
            <MessageBox type={formMessage.type} text={formMessage.text} />

            <div className="admin-actions-bar">
                <div className="filter-controls">
                    <button 
                        className={`admin-button-secondary ${filterType === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterType('all')}
                    >
                        All
                    </button>
                    <button 
                        className={`admin-button-secondary ${filterType === 'roadmap' ? 'active' : ''}`}
                        onClick={() => setFilterType('roadmap')}
                    >
                        Roadmaps
                    </button>
                    <button 
                        className={`admin-button-secondary ${filterType === 'interview' ? 'active' : ''}`}
                        onClick={() => setFilterType('interview')}
                    >
                        Interviews
                    </button>
                    <button 
                        className={`admin-button-secondary ${filterType === 'placement' ? 'active' : ''}`}
                        onClick={() => setFilterType('placement')}
                    >
                        Placement
                    </button>
                    <button 
                        className={`admin-button-secondary ${filterType === 'software_tool' ? 'active' : ''}`}
                        onClick={() => setFilterType('software_tool')}
                    >
                        Software/Tools
                    </button>
                    <button 
                        className={`admin-button-secondary ${filterType === 'miscellaneous' ? 'active' : ''}`}
                        onClick={() => setFilterType('miscellaneous')}
                    >
                        Miscellaneous
                    </button>
                </div>

                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="admin-button-primary flex items-center gap-2"
                >
                    <PlusCircle size={18} /> Add New Resource Section
                </button>
            </div>

            {isLoading && sections.length === 0 ? (
                <div className="admin-empty-state">Loading resource sections...</div>
            ) : getFilteredSections().length === 0 ? (
                <div className="admin-empty-state">No resource sections found matching this category.</div>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr className="admin-table-tr">
                                <th className="admin-table-th">Image</th>
                                <th className="admin-table-th">Title</th>
                                <th className="admin-table-th">Type</th>
                                <th className="admin-table-th">Description</th>
                                <th className="admin-table-th">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getFilteredSections().map(sec => (
                                <tr key={sec._id} className="admin-table-tr">
                                    <td className="admin-table-td" data-label="Image">
                                        {sec.imageUrl ? (
                                            <img src={sec.imageUrl} alt={sec.title} className="admin-table-image" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                        ) : (
                                            <span className="text-gray-400">N/A</span>
                                        )}
                                    </td>
                                    <td className="admin-table-td font-semibold" data-label="Title">{sec.title}</td>
                                    <td className="admin-table-td" data-label="Type">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white`}>
                                            {formatType(sec.type)}
                                        </span>
                                    </td>
                                    <td className="admin-table-td admin-table-td-description" data-label="Description">
                                        {sec.description || 'No description provided.'}
                                    </td>
                                    <td className="admin-table-td admin-table-actions">
                                        <button 
                                            onClick={() => { setEditingSection(sec); setIsEditModalOpen(true); }}
                                            className="admin-action-button edit-button"
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => confirmDeleteSection(sec._id)}
                                            className="admin-action-button delete-button"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3 className="modal-title">Add Resource Section</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddSection}>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input 
                                    type="text" 
                                    value={newSection.title}
                                    onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                                    required 
                                    className="form-input" 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category Type</label>
                                <select 
                                    value={newSection.type}
                                    onChange={(e) => setNewSection({ ...newSection, type: e.target.value })}
                                    className="form-input"
                                >
                                    <option value="roadmap">Roadmap</option>
                                    <option value="interview">Interview Prep</option>
                                    <option value="placement">Placement Prep</option>
                                    <option value="software_tool">Software & Tools</option>
                                    <option value="miscellaneous">Miscellaneous</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea 
                                    value={newSection.description}
                                    onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                                    className="form-input"
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Banner Image (Optional)</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => handleImageFileChange(e, false)}
                                    className="form-input text-sm"
                                />
                                <div className="text-xs text-gray-400 mt-1">Or enter image URL:</div>
                                <input 
                                    type="text"
                                    value={newSection.imageUrl}
                                    onChange={(e) => setNewSection({ ...newSection, imageUrl: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                    className="form-input mt-1"
                                />
                            </div>
                            <div className="modal-actions-footer">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="modal-button-base modal-button-cancel">
                                    Cancel
                                </button>
                                <button type="submit" className="modal-button-base admin-button-primary">
                                    Add Section
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingSection && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Resource Section</h3>
                            <button onClick={() => { setIsEditModalOpen(false); setEditingSection(null); }} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateSection}>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input 
                                    type="text" 
                                    value={editingSection.title}
                                    onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                                    required 
                                    className="form-input" 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category Type</label>
                                <select 
                                    value={editingSection.type}
                                    onChange={(e) => setEditingSection({ ...editingSection, type: e.target.value })}
                                    className="form-input"
                                >
                                    <option value="roadmap">Roadmap</option>
                                    <option value="interview">Interview Prep</option>
                                    <option value="placement">Placement Prep</option>
                                    <option value="software_tool">Software & Tools</option>
                                    <option value="miscellaneous">Miscellaneous</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea 
                                    value={editingSection.description}
                                    onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })}
                                    className="form-input"
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Banner Image (Optional)</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => handleImageFileChange(e, true)}
                                    className="form-input text-sm"
                                />
                                <div className="text-xs text-gray-400 mt-1">Or enter image URL:</div>
                                <input 
                                    type="text"
                                    value={editingSection.imageUrl}
                                    onChange={(e) => setEditingSection({ ...editingSection, imageUrl: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                    className="form-input mt-1"
                                />
                            </div>
                            <div className="modal-actions-footer">
                                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingSection(null); }} className="modal-button-base modal-button-cancel">
                                    Cancel
                                </button>
                                <button type="submit" className="modal-button-base admin-button-primary">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal 
                show={isDeleting}
                title="Delete Resource Section"
                message="Are you sure you want to delete this resource section? Any notes attached to this section will remain in the database but will lose their section link."
                onConfirm={handleDeleteSection}
                onCancel={() => { setIsDeleting(false); setSectionToDelete(null); }}
            />
        </div>
    );
};

export default ResourceSectionManagement;
