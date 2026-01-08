// src/components/SkillManagement.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // ✅ Import the useAuth hook

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
    let baseClasses = 'flex items-center gap-2 p-4 rounded-lg mb-4 border';
    let colorClasses = '';
    
    switch (type) {
        case 'info': 
            Icon = Info; 
            colorClasses = 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300'; 
            break;
        case 'success': 
            Icon = CheckCircle; 
            colorClasses = 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'; 
            break;
        case 'error': 
            Icon = AlertCircle; 
            colorClasses = 'bg-red-50 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'; 
            break;
        default: 
            Icon = Info; 
            colorClasses = 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300';
    }
    return (
        <div className={`${baseClasses} ${colorClasses}`}>
            {Icon && <Icon size={20} />}
            {text}
        </div>
    );
};

// Reusable ConfirmationModal Component (copied for self-containment)
const ConfirmationModal = ({ show, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', confirmButtonClass = 'button-danger' }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-sm w-full mx-4">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>
                <p className="p-6 text-gray-700 dark:text-gray-300">{message}</p>
                <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors">
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-white transition-colors ${confirmButtonClass === 'button-danger' ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'}`}>
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
        <div className="p-6">
            <MessageBox type={formMessage.type} text={formMessage.text} />
            
            {/* Add New Skill Section */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <PlusCircle size={24} className="text-blue-600 dark:text-blue-400" /> Add New Skill
            </h3>
            <form onSubmit={handleAddSkill} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
                <div className="mb-4">
                    <label htmlFor="newSkillTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                    <input 
                        type="text" 
                        id="newSkillTitle" 
                        name="title" 
                        value={newSkill.title} 
                        onChange={(e) => setNewSkill({ ...newSkill, title: e.target.value })} 
                        required 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="newSkillIcon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon (e.g., URL to image or icon font class)</label>
                    <input 
                        type="text" 
                        id="newSkillIcon" 
                        name="icon" 
                        value={newSkill.icon} 
                        onChange={(e) => setNewSkill({ ...newSkill, icon: e.target.value })} 
                        required 
                        placeholder="e.g., https://img.icons8.com/..., fab fa-js"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {isLoading ? 'Adding...' : <><PlusCircle size={20} /> Add Skill</>}
                </button>
            </form>

            {/* Existing Skills Section */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Info size={24} className="text-green-600 dark:text-green-400" /> Existing Skills
            </h3>
            {isLoading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Loading skills...</p>
            ) : skills.length === 0 ? (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-blue-50 border border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300">
                    <Info size={20} />
                    No skills found. Add a new skill above!
                </div>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                    <table className="w-full">
                        <thead className="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-gray-600">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Title</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Icon</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {skills.map((skill) => (
                                <tr key={skill._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                    <td className="px-6 py-4 text-gray-900 dark:text-white">{skill.title}</td>
                                    <td className="px-6 py-4">
                                        {skill.icon.startsWith('http') ?
                                            <img src={skill.icon} alt={skill.title} className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} /> :
                                            <i className={`${skill.icon} text-xl`}></i>
                                        }
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button 
                                            onClick={() => startEditingSkill(skill)} 
                                            title="Edit" 
                                            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button 
                                            onClick={() => confirmDeleteSkill(skill._id)} 
                                            title="Delete" 
                                            className="p-2 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors"
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

            {/* Edit Modal */}
            {isEditModalOpen && editingSkill && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Skill</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateSkill} className="p-6">
                            <div className="mb-4">
                                <label htmlFor="editSkillTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                                <input 
                                    type="text" 
                                    id="editSkillTitle" 
                                    name="title" 
                                    value={editingSkill.title} 
                                    onChange={handleEditChange} 
                                    required 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="editSkillIcon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                                <input 
                                    type="text" 
                                    id="editSkillIcon" 
                                    name="icon" 
                                    value={editingSkill.icon} 
                                    onChange={handleEditChange} 
                                    required 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditModalOpen(false)} 
                                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isLoading} 
                                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white transition-colors"
                                >
                                    {isLoading ? 'Updating...' : 'Update Skill'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
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












