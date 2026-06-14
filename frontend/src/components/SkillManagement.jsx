// src/components/SkillManagement.jsx
import React, { useState, useEffect } from 'react';
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

const SkillManagement = () => {
    const { currentUser, logout } = useAuth();
    const handleLogout = logout;

    const [skills, setSkills] = useState([]);
    const [newSkill, setNewSkill] = useState({ title: '', icon: '' });
    const [editingSkill, setEditingSkill] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [skillToDelete, setSkillToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

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

    useEffect(() => {
        fetchSkills();
    }, [currentUser]);

    const fetchSkills = async () => {
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
                handleLogout();
                setIsLoading(false);
                return;
            }

            if (response.ok) {
                setSkills(data);
                setFormMessage({ type: 'success', text: 'Skills loaded successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to fetch skills.' });
            }
        } catch (error) {
            console.error('Error fetching skills:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to fetch skills.' });
        } finally {
            setIsLoading(false);
        }
    };

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

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                handleLogout();
                setIsLoading(false);
                return;
            }

            if (response.ok) {
                setSkills([...skills, data]);
                setNewSkill({ title: '', icon: '' });
                setFormMessage({ type: 'success', text: 'Skill added successfully!' });
                setIsAddModalOpen(false); // Close Modal on success
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to add skill.' });
            }
        } catch (error) {
            console.error('Error adding skill:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to add skill.' });
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
        if (!editingSkill?._id) {
            setFormMessage({ type: 'error', text: 'Skill ID missing.' });
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/skills/${editingSkill._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(editingSkill),
            });
            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                handleLogout();
                setIsLoading(false);
                return;
            }

            if (response.ok) {
                setSkills(skills.map(s => (s._id === data._id ? data : s)));
                setIsEditModalOpen(false);
                setEditingSkill(null);
                setFormMessage({ type: 'success', text: 'Skill updated successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to update skill.' });
            }
        } catch (error) {
            console.error('Error updating skill:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to update skill.' });
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
        if (!skillToDelete) {
            setFormMessage({ type: 'error', text: 'Skill ID missing for deletion.' });
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/skills/${skillToDelete}`, {
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
                setSkillToDelete(null);
                return;
            }

            if (response.ok) {
                setSkills(skills.filter(s => s._id !== skillToDelete));
                setFormMessage({ type: 'success', text: data.msg || 'Skill deleted successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to delete skill.' });
            }
        } catch (error) {
            console.error('Error deleting skill:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to delete skill.' });
        } finally {
            setIsDeleting(false);
            setSkillToDelete(null);
            setIsLoading(false);
        }
    };

    return (
        <div className="p-1 md:p-3 space-y-6">
            <MessageBox type={formMessage.type} text={formMessage.text} />
            
            {/* Header section with Modal Trigger Button */}
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
                                <th className="admin-table-th">Icon</th>
                                <th className="admin-table-th rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {skills.map((skill) => (
                                <tr key={skill._id} className="admin-table-tr">
                                    <td className="admin-table-td" data-label="Title">{skill.title}</td>
                                    <td className="admin-table-td" data-label="Icon">
                                        {skill.icon.startsWith('http') || skill.icon.startsWith('data:image/') ?
                                            <img src={skill.icon} alt={skill.title} className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} /> :
                                            <i className={`${skill.icon} text-xl`}></i>
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
                                <label htmlFor="newSkillTitle" className="form-label">Title</label>
                                <input 
                                    type="text" 
                                    id="newSkillTitle" 
                                    name="title" 
                                    value={newSkill.title} 
                                    onChange={(e) => setNewSkill({ ...newSkill, title: e.target.value })} 
                                    required 
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="newSkillIcon" className="form-label">Icon (e.g., URL to image or icon font class)</label>
                                <input 
                                    type="text" 
                                    id="newSkillIcon" 
                                    name="icon" 
                                    value={newSkill.icon.startsWith('data:image/') ? '' : newSkill.icon} 
                                    onChange={(e) => setNewSkill({ ...newSkill, icon: e.target.value })} 
                                    required={!newSkill.icon} 
                                    placeholder="e.g., https://img.icons8.com/..., fab fa-js"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Or Upload Icon Image</label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => handleIconFileChange(e, false)} 
                                    className="form-input"
                                    style={{ padding: '0.35rem 0.5rem' }}
                                />
                                {newSkill.icon && newSkill.icon.startsWith('data:image/') && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">✓ Image Uploaded</span>
                                        <button type="button" onClick={() => setNewSkill(prev => ({ ...prev, icon: '' }))} className="text-xs font-semibold text-red-500 hover:text-red-700 underline">
                                            Clear File
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions-footer">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddModalOpen(false)} 
                                    className="modal-button-base modal-button-cancel"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isLoading} 
                                    className="modal-button-base admin-button-primary"
                                >
                                    {isLoading ? 'Adding...' : 'Add Skill'}
                                </button>
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
                                <label htmlFor="editSkillTitle" className="form-label">Title</label>
                                <input 
                                    type="text" 
                                    id="editSkillTitle" 
                                    name="title" 
                                    value={editingSkill.title} 
                                    onChange={handleEditChange} 
                                    required 
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="editSkillIcon" className="form-label">Icon</label>
                                <input 
                                    type="text" 
                                    id="editSkillIcon" 
                                    name="icon" 
                                    value={editingSkill.icon.startsWith('data:image/') ? '' : editingSkill.icon} 
                                    onChange={handleEditChange} 
                                    required={!editingSkill.icon} 
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Or Upload New Icon Image</label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => handleIconFileChange(e, true)} 
                                    className="form-input"
                                    style={{ padding: '0.35rem 0.5rem' }}
                                />
                                {editingSkill.icon && editingSkill.icon.startsWith('data:image/') && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">✓ Image Uploaded</span>
                                        <button type="button" onClick={() => setEditingSkill(prev => ({ ...prev, icon: '' }))} className="text-xs font-semibold text-red-500 hover:text-red-700 underline">
                                            Clear File
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions-footer">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditModalOpen(false)} 
                                    className="modal-button-base modal-button-cancel"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isLoading} 
                                    className="modal-button-base admin-button-primary"
                                >
                                    {isLoading ? 'Updating...' : 'Update Skill'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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
