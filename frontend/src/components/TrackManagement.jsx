// src/components/TrackManagement.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X, PlusCircle, Edit, Trash2, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './TrackManagement.css'; // Import the CSS file for styles

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

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

const TrackManagement = () => {
    const { currentUser, logout } = useAuth();
    const handleLogout = logout;

    const [tracks, setTracks] = useState([]);
    const [newTrack, setNewTrack] = useState({ title: '', icon: '' });
    const [editingTrack, setEditingTrack] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [trackToDelete, setTrackToDelete] = useState(null);
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
                setEditingTrack(prev => ({ ...prev, icon: reader.result }));
            } else {
                setNewTrack(prev => ({ ...prev, icon: reader.result }));
            }
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        fetchTracks();
    }, [currentUser]);

    const fetchTracks = async () => {
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
                credentials: 'include',
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
                setIsAddModalOpen(false); // Close Modal on success
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
                credentials: 'include',
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
                credentials: 'include',
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
            
            {/* Header section with Modal Trigger Button */}
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
                <p className="message-info">No tracks found. Click 'Add New Track' to get started!</p>
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
                                        {track.icon.startsWith('http') || track.icon.startsWith('data:image/') ?
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
                                <label htmlFor="newTrackTitle" className="form-label">Title</label>
                                <input type="text" id="newTrackTitle" name="title" value={newTrack.title} onChange={(e) => setNewTrack({ ...newTrack, title: e.target.value })} required className="form-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="newTrackIcon" className="form-label">Icon (e.g., URL to image or icon font class)</label>
                                <input type="text" id="newTrackIcon" name="icon" value={newTrack.icon.startsWith('data:image/') ? '' : newTrack.icon} onChange={(e) => setNewTrack({ ...newTrack, icon: e.target.value })} required={!newTrack.icon} className="form-input" placeholder="e.g., https://img.icons8.com/..., fab fa-js" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Or Upload Icon Image</label>
                                <input type="file" accept="image/*" onChange={(e) => handleIconFileChange(e, false)} className="form-input" style={{ padding: '0.35rem 0.5rem' }} />
                                {newTrack.icon && newTrack.icon.startsWith('data:image/') && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">✓ Image Uploaded</span>
                                        <button type="button" onClick={() => setNewTrack(prev => ({ ...prev, icon: '' }))} className="text-xs font-semibold text-red-500 hover:text-red-700 underline">
                                            Clear File
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions-footer">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="modal-button-base modal-button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading} className="modal-button-base admin-button-primary">
                                    {isLoading ? 'Adding...' : 'Add Track'}
                                </button>
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
                                <label htmlFor="editTrackTitle" className="form-label">Title</label>
                                <input type="text" id="editTrackTitle" name="title" value={editingTrack.title} onChange={handleEditChange} required className="form-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="editTrackIcon" className="form-label">Icon</label>
                                <input type="text" id="editTrackIcon" name="icon" value={editingTrack.icon.startsWith('data:image/') ? '' : editingTrack.icon} onChange={handleEditChange} required={!editingTrack.icon} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Or Upload New Icon Image</label>
                                <input type="file" accept="image/*" onChange={(e) => handleIconFileChange(e, true)} className="form-input" style={{ padding: '0.35rem 0.5rem' }} />
                                {editingTrack.icon && editingTrack.icon.startsWith('data:image/') && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">✓ Image Uploaded</span>
                                        <button type="button" onClick={() => setEditingTrack(prev => ({ ...prev, icon: '' }))} className="text-xs font-semibold text-red-500 hover:text-red-700 underline">
                                            Clear File
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions-footer">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="modal-button-base modal-button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading} className="modal-button-base admin-button-primary">
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
