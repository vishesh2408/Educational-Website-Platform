// src/components/TrackManagement.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import './TrackManagement.css'; // Import the CSS file for styles

import {
    PlusCircle, Edit, Trash2, Info // Import necessary Lucide icons
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext'; // ✅ Import the useAuth hook

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
 * TrackManagement Component
 * Handles CRUD operations for tracks.
 */
const TrackManagement = () => {
    // ✅ Get auth data from context instead of props
    const { currentUser, logout } = useAuth();
    const handleLogout = logout;

    const [tracks, setTracks] = useState([]);
    const [newTrack, setNewTrack] = useState({ title: '', icon: '' });
    const [editingTrack, setEditingTrack] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [trackToDelete, setTrackToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // ✅ Depend on currentUser instead of adminToken
    useEffect(() => {
        fetchTracks();
    }, [currentUser]);

    const fetchTracks = async () => {
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/admin/tracks`, {
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
                setTracks(data);
                setFormMessage({ type: 'success', text: 'Tracks loaded successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to fetch tracks.' });
            }
        } catch (error) {
            console.error('Error fetching tracks:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to fetch tracks.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTrack = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/tracks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // ✅ Use cookie-based authentication
                body: JSON.stringify(newTrack),
            });
            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                handleLogout();
                setIsLoading(false);
                return;
            }

            if (response.ok) {
                setTracks([...tracks, data]);
                setNewTrack({ title: '', icon: '' });
                setFormMessage({ type: 'success', text: 'Track added successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to add track.' });
            }
        } catch (error) {
            console.error('Error adding track:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to add track.' });
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
        if (!editingTrack?._id) {
            setFormMessage({ type: 'error', text: 'Track ID missing.' });
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/tracks/${editingTrack._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // ✅ Use cookie-based authentication
                body: JSON.stringify(editingTrack),
            });
            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                handleLogout();
                setIsLoading(false);
                return;
            }

            if (response.ok) {
                setTracks(tracks.map(t => (t._id === data._id ? data : t)));
                setIsEditModalOpen(false);
                setEditingTrack(null);
                setFormMessage({ type: 'success', text: 'Track updated successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to update track.' });
            }
        } catch (error) {
            console.error('Error updating track:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to update track.' });
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
        if (!trackToDelete) {
            setFormMessage({ type: 'error', text: 'Track ID missing for deletion.' });
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/tracks/${trackToDelete}`, {
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
                setTrackToDelete(null);
                return;
            }

            if (response.ok) {
                setTracks(tracks.filter(t => t._id !== trackToDelete));
                setFormMessage({ type: 'success', text: data.msg || 'Track deleted successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to delete track.' });
            }
        } catch (error) {
            console.error('Error deleting track:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to delete track.' });
        } finally {
            setIsDeleting(false);
            setTrackToDelete(null);
            setIsLoading(false);
        }
    };

    return (
        <>
            <MessageBox type={formMessage.type} text={formMessage.text} />
            <h3 className="admin-section-title">
                <PlusCircle size={20} /> Add New Track
            </h3>
            <form onSubmit={handleAddTrack} className="form-container">
                <div className="form-group">
                    <label htmlFor="newTrackTitle" className="form-label">Title</label>
                    <input type="text" id="newTrackTitle" name="title" value={newTrack.title} onChange={(e) => setNewTrack({ ...newTrack, title: e.target.value })} required className="form-input" />
                </div>
                <div className="form-group">
                    <label htmlFor="newTrackIcon" className="form-label">Icon (e.g., URL to image or icon font class)</label>
                    <input type="text" id="newTrackIcon" name="icon" value={newTrack.icon} onChange={(e) => setNewTrack({ ...newTrack, icon: e.target.value })} required className="form-input" placeholder="e.g., https://img.icons8.com/..., fab fa-js" />
                </div>
                <button type="submit" disabled={isLoading} className="form-submit-button">
                    {isLoading ? 'Adding...' : <><PlusCircle size={20} className="icon-mr" /> Add Track</>}
                </button>
            </form>

            <h3 className="admin-section-title">
                <Info size={20} /> Existing Tracks
            </h3>
            {isLoading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Loading tracks...</p>
            ) : tracks.length === 0 ? (
                <p className="message-info">No tracks found. Add a new track above!</p>
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
                            {tracks.map((track) => (
                                <tr key={track._id} className="table-row">
                                    <td className="table-cell" data-label="Title">{track.title}</td>
                                    <td className="table-cell" data-label="Icon">
                                        {track.icon.startsWith('http') ?
                                            <img src={track.icon} alt={track.title} className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} /> :
                                            <i className={`${track.icon} text-2xl`}></i>
                                        }
                                    </td>
                                    <td className="table-cell table-actions">
                                        <button onClick={() => startEditingTrack(track)} title="Edit" className="button-action button-edit">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => confirmDeleteTrack(track._id)} title="Delete" className="button-action button-delete">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {isEditModalOpen && editingTrack && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Track</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateTrack}>
                            <div className="form-group">
                                <label htmlFor="editTrackTitle" className="form-label">Title</label>
                                <input type="text" id="editTrackTitle" name="title" value={editingTrack.title} onChange={handleEditChange} required className="form-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="editTrackIcon" className="form-label">Icon</label>
                                <input type="text" id="editTrackIcon" name="icon" value={editingTrack.icon} onChange={handleEditChange} required className="form-input" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="button-base button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading} className="button-base button-primary">
                                    {isLoading ? 'Updating...' : 'Update Track'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationModal show={isDeleting} title="Confirm Deletion" message="Are you sure you want to delete this track? This action cannot be undone." onConfirm={handleDeleteTrack} onCancel={() => setIsDeleting(false)} />
        </>
    );
};

export default TrackManagement;







