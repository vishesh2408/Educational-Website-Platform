// src/components/SkillManagement.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // ✅ Import the useAuth hook
import './SkillManagement.css'; // Import your CSS styles

import {
    PlusCircle, Edit, Trash2, Info // Import necessary Lucide icons
} from 'lucide-react';

// Base URL for your backend API
// const API_BASE_URL = 'http://localhost:3001/api';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

// Reusable MessageBox Component (copied for self-containment)
const MessageBox = ({ type, text }) => {
    if (!text) return null;
    let Icon;
    let classes = 'message-box ';
    switch (type) {
        case 'info': Icon = Info; classes += 'message-info'; break;
        case 'success': Icon = CheckCircle; classes += 'message-success'; break;
        case 'error': Icon = AlertCircle; classes += 'message-error'; break;
        default: Icon = Info; classes += 'message-info';
    }
    return (
        <div className={classes}>
            {Icon && <Icon size={20} />}
            {text}
        </div>
    );
};

// Reusable ConfirmationModal Component (copied for self-containment)
const ConfirmationModal = ({ show, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', confirmButtonClass = 'button-danger' }) => {
    if (!show) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button onClick={onCancel} className="modal-close-button">
                        <X size={24} />
                    </button>
                </div>
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    <button onClick={onCancel} className="button-base button-cancel">
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} className={`button-base ${confirmButtonClass}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};


/**
 * SkillManagement Component
 * Handles CRUD operations for skills.
 */
const SkillManagement = () => {
    // ✅ Get auth data from context instead of props
    const { currentUser, logout } = useAuth();
    const handleLogout = logout;

    const [skills, setSkills] = useState([]);
    const [newSkill, setNewSkill] = useState({ title: '', icon: '' });
    const [editingSkill, setEditingSkill] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [skillToDelete, setSkillToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchSkills();
    }, [currentUser]); // ✅ Depend on currentUser instead of adminToken

    const fetchSkills = async () => {
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/admin/skills`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // ✅ Use cookie-based authentication
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
                credentials: 'include', // ✅ Use cookie-based authentication
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
                setNewSkill({ title: '', icon: '' }); // Reset form
                setFormMessage({ type: 'success', text: 'Skill added successfully!' });
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
                credentials: 'include', // ✅ Use cookie-based authentication
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
                credentials: 'include', // ✅ Use cookie-based authentication
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
        <>
            <MessageBox type={formMessage.type} text={formMessage.text} />
            <h3 className="admin-section-title">
                <PlusCircle size={20} /> Add New Skill
            </h3>
            <form onSubmit={handleAddSkill} className="form-container">
                <div className="form-group">
                    <label htmlFor="newSkillTitle" className="form-label">Title</label>
                    <input type="text" id="newSkillTitle" name="title" value={newSkill.title} onChange={(e) => setNewSkill({ ...newSkill, title: e.target.value })} required className="form-input" />
                </div>
                <div className="form-group">
                    <label htmlFor="newSkillIcon" className="form-label">Icon (e.g., URL to image or icon font class)</label>
                    <input type="text" id="newSkillIcon" name="icon" value={newSkill.icon} onChange={(e) => setNewSkill({ ...newSkill, icon: e.target.value })} required className="form-input" placeholder="e.g., https://img.icons8.com/..., fab fa-js" />
                </div>
                <button type="submit" disabled={isLoading} className="form-submit-button">
                    {isLoading ? 'Adding...' : <><PlusCircle size={20} className="icon-mr" /> Add Skill</>}
                </button>
            </form>

            <h3 className="admin-section-title">
                <Info size={20} /> Existing Skills
            </h3>
            {isLoading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Loading skills...</p>
            ) : skills.length === 0 ? (
                <p className="message-info">No skills found. Add a new skill above!</p>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead className="table-header">
                            <tr>
                                <th className="table-header-th rounded-tl-lg">Title</th>
                                <th className="table-header-th">Icon</th>
                                <th className="table-header-th rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {skills.map((skill) => (
                                <tr key={skill._id} className="table-row">
                                    <td className="table-cell" data-label="Title">{skill.title}</td>
                                    <td className="table-cell" data-label="Icon">
                                        {skill.icon.startsWith('http') ?
                                            <img src={skill.icon} alt={skill.title} className="skill-track-icon-image" onError={(e) => e.target.style.display = 'none'} /> :
                                            <i className={`${skill.icon} skill-track-icon-font`}></i>
                                        }
                                    </td>
                                    <td className="table-cell table-actions">
                                        <button onClick={() => startEditingSkill(skill)} title="Edit" className="button-action button-edit">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => confirmDeleteSkill(skill._id)} title="Delete" className="button-action button-delete">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {isEditModalOpen && editingSkill && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Skill</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateSkill}>
                            <div className="form-group">
                                <label htmlFor="editSkillTitle" className="form-label">Title</label>
                                <input type="text" id="editSkillTitle" name="title" value={editingSkill.title} onChange={handleEditChange} required className="form-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="editSkillIcon" className="form-label">Icon</label>
                                <input type="text" id="editSkillIcon" name="icon" value={editingSkill.icon} onChange={handleEditChange} required className="form-input" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="button-base button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading} className="button-base button-primary">
                                    {isLoading ? 'Updating...' : 'Update Skill'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationModal show={isDeleting} title="Confirm Deletion" message="Are you sure you want to delete this skill? This action cannot be undone." onConfirm={handleDeleteSkill} onCancel={() => setIsDeleting(false)} />
        </>
    );
};

export default SkillManagement;











