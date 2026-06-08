// src/components/ContestManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Edit, Trash2, X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import './AdminDashboard.css';

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

const ContestManagement = () => {
    const { currentUser, logout } = useAuth();
    // const adminToken = currentUser?.token;
    const [contests, setContests] = useState([]);
    const [newContest, setNewContest] = useState({
        title: '', category: 'Programming', status: 'Upcoming', startTime: '', endTime: '',
        participants: 0, prize: '$0', description: '', difficulty: 'Easy', isFeatured: false, winner: ''
    });
    const [editingContest, setEditingContest] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [contestToDelete, setContestToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const { openModal } = useModal();

    // Define standard options to send cookies
    const fetchOptions = {
        method: 'GET', // Will be overridden in specific calls
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 🎯 FIX: Tell the browser to send the HTTP-only cookie
    };

    const fetchContests = useCallback(async () => {
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });

        // if (!adminToken) {
        //     setFormMessage({ type: 'error', text: 'Authentication token missing.' });
        //     setIsLoading(false);
        //     return;
        // }
        try {
            // const response = await fetch(`${API_BASE_URL}/admin/contests`, { 
            //     headers: { 'x-auth-token': adminToken } });
            const response = await fetch(`${API_BASE_URL}/api/admin/contests`, {
                ...fetchOptions,
                method: 'GET',
            });

            if (response.status === 401 || response.status === 403) {
            setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
            logout(); // Clears session and redirects
            setIsLoading(false);
            return;
           }

            const data = await response.json();

            if (!response.ok) {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to fetch contests.' });
                throw new Error(data.msg || 'Fetch failed');
            }

            // if (response.ok) {
                const parsedData = data.map(contest => ({
                    ...contest,
                    startTime: contest.startTime ? new Date(contest.startTime) : null,
                    endTime: contest.endTime ? new Date(contest.endTime) : null,
                }));
                
                setContests(parsedData);
                setFormMessage({ type: 'success', text: 'Contests loaded successfully!' });
           
            // else {
            //     setFormMessage({ type: 'error', text: data.msg || 'Failed to fetch contests.' });
            //     if (response.status === 401 || response.status === 403) logout();
            // }
        } catch (error) {
            console.error('Error fetching contests:', error);
            if (!formMessage.text.includes('Authentication failed')) {
                setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to fetch contests.' });
            }
        } finally {
            setIsLoading(false);
        }
    }, [logout, openModal]);

    useEffect(() => {
        fetchContests();
    }, [fetchContests]);

    const handleAddContest = async (e) => {

        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);

        // if (!adminToken) {
        //     setFormMessage({ type: 'error', text: 'Authentication token missing.' });
        //     setIsLoading(false);
        //     return;
        // }

        
        try {
            const contestData = {
                ...newContest,
                startTime: newContest.startTime ? new Date(newContest.startTime).toISOString() : null,
                endTime: newContest.endTime ? new Date(newContest.endTime).toISOString() : null,
                participants: parseInt(newContest.participants) || 0,
            };
            const response = await fetch(`${API_BASE_URL}/api/admin/contests`, { method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify(contestData), credentials: 'include' });

            if (response.status === 401 || response.status === 403) {
                 setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                 logout(); 
                 setIsLoading(false);
                 return;
            }

            const data = await response.json();

            if (response.ok) {
                setContests([...contests, { ...data, startTime: data.startTime ? new Date(data.startTime) : null, endTime: data.endTime ? new Date(data.endTime) : null }]);
                setNewContest({ title: '', category: 'Programming', status: 'Upcoming', startTime: '', endTime: '', participants: 0, prize: '$0', description: '', difficulty: 'Easy', isFeatured: false, winner: '' });
                setFormMessage({ type: 'success', text: 'Contest added successfully!' });
            } 
            
            else {
                // setFormMessage({ type: 'error', text: data.msg || 'Failed to add contest.' });
                // if (response.status === 401 || response.status === 403) logout();

                const errorData = await response.json(); // Handle validation errors from express-validator
                const errorMsg = errorData.errors ? errorData.errors.map(e => e.msg).join('. ') : (errorData.msg || 'Failed to add contest.');
                setFormMessage({ type: 'error', text: errorMsg });
            }
        } catch (error) {
            console.error('Error adding contest:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to add contest.' });
        } finally {
            setIsLoading(false);
        }
    };

    const startEditingContest = (contest) => {
        setEditingContest({ ...contest, startTime: contest.startTime ? contest.startTime.toISOString().substring(0, 16) : '', endTime: contest.endTime ? contest.endTime.toISOString().substring(0, 16) : '' });
        setIsEditModalOpen(true);
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditingContest(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (name === 'participants' ? parseInt(value) || 0 : value) }));
    };

    const handleUpdateContest = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        // if (!adminToken || !editingContest?._id) {
        //     setFormMessage({ type: 'error', text: 'Authentication token or contest ID missing.' });
        //     setIsLoading(false);
        //     return;
        // }

        try {
            const contestData = { ...editingContest, startTime: editingContest.startTime ? new Date(editingContest.startTime).toISOString() : null, endTime: editingContest.endTime ? new Date(editingContest.endTime).toISOString() : null };
            const response = await fetch(`${API_BASE_URL}/api/admin/contests/${editingContest._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify(contestData), credentials: 'include', });
            
            if (response.status === 401 || response.status === 403) {
                 setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                 logout(); 
                 setIsLoading(false);
                 setIsEditModalOpen(false);
                 return;
            }


            const data = await response.json();
            if (response.ok) {
                setContests(contests.map(c => (c._id === data._id ? { ...data, startTime: data.startTime ? new Date(data.startTime) : null, endTime: data.endTime ? new Date(data.endTime) : null } : c)));
                setIsEditModalOpen(false);
                setEditingContest(null);
                setFormMessage({ type: 'success', text: 'Contest updated successfully!' });
            } else {
                // setFormMessage({ type: 'error', text: data.msg || 'Failed to update contest.' });
                // if (response.status === 401 || response.status === 403) logout();

                const errorData = await response.json();
                const errorMsg = errorData.msg || 'Failed to update contest.';
                setFormMessage({ type: 'error', text: errorMsg });
            }
        } catch (error) {
            console.error('Error updating contest:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to update contest.' });
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDeleteContest = (contestId) => {
        setContestToDelete(contestId);
        setIsDeleting(true);
    };

    const handleDeleteContest = async () => {
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        // if (!adminToken || !contestToDelete) {
        //     setFormMessage({ type: 'error', text: 'Authentication token or contest ID missing for deletion.' });
        //     setIsLoading(false);
        //     return;
        // }
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/contests/${contestToDelete}`, { method: 'DELETE',
                credentials: 'include',
                // headers: { 'x-auth-token': adminToken } 
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
                setContests(contests.filter(c => c._id !== contestToDelete));
                setFormMessage({ type: 'success', text: data.msg || 'Contest deleted successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to delete contest.' });
                if (response.status === 401 || response.status === 403) logout();
            }
        } catch (error) {
            console.error('Error deleting contest:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to delete contest.' });
        } finally {
            setIsDeleting(false);
            setContestToDelete(null);
            setIsLoading(false);
        }
    };

    return (
        <>
            <MessageBox type={formMessage.type} text={formMessage.text} />
            <h3 className="admin-section-title"><PlusCircle size={20} /> Add New Contest</h3>
            <form onSubmit={handleAddContest} className="admin-form-container">
                <div className="form-group"><label htmlFor="newContestTitle" className="form-label">Title</label><input type="text" id="newContestTitle" name="title" value={newContest.title} onChange={(e) => setNewContest({ ...newContest, title: e.target.value })} required className="form-input" /></div>
                <div className="form-group"><label htmlFor="newContestDescription" className="form-label">Description</label><textarea id="newContestDescription" name="description" value={newContest.description} onChange={(e) => setNewContest({ ...newContest, description: e.target.value })} rows="3" required className="form-textarea"></textarea></div>
                <div className="form-group"><label htmlFor="newContestCategory" className="form-label">Category</label><input type="text" id="newContestCategory" name="category" value={newContest.category} onChange={(e) => setNewContest({ ...newContest, category: e.target.value })} required className="form-input" /></div>
                <div className="form-group"><label htmlFor="newContestDifficulty" className="form-label">Difficulty</label><select id="newContestDifficulty" name="difficulty" value={newContest.difficulty} onChange={(e) => setNewContest({ ...newContest, difficulty: e.target.value })} className="form-select"><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select></div>
                <div className="form-group"><label htmlFor="newContestStatus" className="form-label">Status</label><select id="newContestStatus" name="status" value={newContest.status} onChange={(e) => setNewContest({ ...newContest, status: e.target.value })} className="form-select"><option value="Upcoming">Upcoming</option><option value="Live">Live</option><option value="Past">Past</option></select></div>
                <div className="form-group"><label htmlFor="newContestStartTime" className="form-label">Start Time</label><input type="datetime-local" id="newContestStartTime" name="startTime" value={newContest.startTime} onChange={(e) => setNewContest({ ...newContest, startTime: e.target.value })} className="form-input" /></div>
                <div className="form-group"><label htmlFor="newContestEndTime" className="form-label">End Time</label><input type="datetime-local" id="newContestEndTime" name="endTime" value={newContest.endTime} onChange={(e) => setNewContest({ ...newContest, endTime: e.target.value })} className="form-input" /></div>
                <div className="form-group"><label htmlFor="newContestParticipants" className="form-label">Participants</label><input type="number" id="newContestParticipants" name="participants" value={newContest.participants} onChange={(e) => setNewContest({ ...newContest, participants: parseInt(e.target.value) || 0 })} className="form-input" /></div>
                <div className="form-group"><label htmlFor="newContestPrize" className="form-label">Prize (e.g., $5,000)</label><input type="text" id="newContestPrize" name="prize" value={newContest.prize} onChange={(e) => setNewContest({ ...newContest, prize: e.target.value })} className="form-input" /></div>
                <div className="form-group flex items-center gap-2">
                    <input type="checkbox" id="newContestFeatured" name="isFeatured" checked={newContest.isFeatured} onChange={(e) => setNewContest({ ...newContest, isFeatured: e.target.checked })} className="form-checkbox" />
                    <label htmlFor="newContestFeatured" className="form-label mb-0">Featured Contest</label>
                </div>
                {newContest.status === 'Past' && (<div className="form-group"><label htmlFor="newContestWinner" className="form-label">Winner (for Past contests)</label><input type="text" id="newContestWinner" name="winner" value={newContest.winner} onChange={(e) => setNewContest({ ...newContest, winner: e.target.value })} className="form-input" /></div>)}
                <button type="submit" disabled={isLoading} className="form-submit-button">{isLoading ? 'Adding...' : <><PlusCircle size={20} className="icon-mr" /> Add Contest</>}</button>
            </form>
            <h3 className="admin-section-title"><Info size={20} /> Existing Contests</h3>
            {isLoading ? (<p className="text-center text-gray-500 dark:text-gray-400">Loading contests...</p>) : contests.length === 0 ? (<p className="admin-message-info">No contests found. Add a new contest above!</p>) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead className="admin-table-thead">
                            <tr>
                                <th className="admin-table-th rounded-tl-lg">Title</th>
                                <th className="admin-table-th">Category</th>
                                <th className="admin-table-th">Status</th>
                                <th className="admin-table-th">Difficulty</th>
                                <th className="admin-table-th">Start/End</th>
                                <th className="admin-table-th rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contests.map((contest) => (
                                <tr key={contest._id} className="admin-table-tr">
                                    <td className="admin-table-td" data-label="Title">{contest.title}</td>
                                    <td className="admin-table-td" data-label="Category">{contest.category}</td>
                                    <td className="admin-table-td" data-label="Status">{contest.status}</td>
                                    <td className="admin-table-td" data-label="Difficulty">{contest.difficulty}</td>
                                    <td className="admin-table-td" data-label="Start/End">{contest.startTime ? contest.startTime.toLocaleString() : 'N/A'} - <br />{contest.endTime ? contest.endTime.toLocaleString() : 'N/A'}</td>
                                    <td className="admin-table-td admin-table-actions">
                                        <button onClick={() => startEditingContest(contest)} title="Edit" className="admin-action-button edit-button"><Edit size={18} /></button>
                                        <button onClick={() => confirmDeleteContest(contest._id)} title="Delete" className="admin-action-button delete-button"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {isEditModalOpen && editingContest && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header"><h3 className="modal-title">Edit Contest</h3><button onClick={() => setIsEditModalOpen(false)} className="modal-close-button"><X size={24} /></button></div>
                        <form onSubmit={handleUpdateContest}>
                            <div className="form-group"><label htmlFor="editContestTitle" className="form-label">Title</label><input type="text" id="editContestTitle" name="title" value={editingContest.title} onChange={handleEditChange} required className="form-input" /></div>
                            <div className="form-group"><label htmlFor="editContestDescription" className="form-label">Description</label><textarea id="editContestDescription" name="description" value={editingContest.description} onChange={handleEditChange} rows="3" required className="form-textarea"></textarea></div>
                            <div className="form-group"><label htmlFor="editContestCategory" className="form-label">Category</label><input type="text" id="editContestCategory" name="category" value={editingContest.category} onChange={handleEditChange} required className="form-input" /></div>
                            <div className="form-group"><label htmlFor="editContestDifficulty" className="form-label">Difficulty</label><select id="editContestDifficulty" name="difficulty" value={editingContest.difficulty} onChange={handleEditChange} className="form-select"><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select></div>
                            <div className="form-group"><label htmlFor="editContestStatus" className="form-label">Status</label><select id="editContestStatus" name="status" value={editingContest.status} onChange={handleEditChange} className="form-select"><option value="Upcoming">Upcoming</option><option value="Live">Live</option><option value="Past">Past</option></select></div>
                            <div className="form-group"><label htmlFor="editContestStartTime" className="form-label">Start Time</label><input type="datetime-local" id="editContestStartTime" name="startTime" value={editingContest.startTime} onChange={handleEditChange} className="form-input" /></div>
                            <div className="form-group"><label htmlFor="editContestEndTime" className="form-label">End Time</label><input type="datetime-local" id="editContestEndTime" name="endTime" value={editingContest.endTime} onChange={handleEditChange} className="form-input" /></div>
                            <div className="form-group"><label htmlFor="editContestParticipants" className="form-label">Participants</label><input type="number" id="editContestParticipants" name="participants" value={editingContest.participants} onChange={(e) => handleEditChange({ target: { name: 'participants', value: parseInt(e.target.value) || 0 } })} className="form-input" /></div>
                            <div className="form-group"><label htmlFor="editContestPrize" className="form-label">Prize (e.g., $5,000)</label><input type="text" id="editContestPrize" name="prize" value={editingContest.prize} onChange={handleEditChange} className="form-input" /></div>
                            <div className="form-group flex items-center gap-2"><input type="checkbox" id="editContestFeatured" name="isFeatured" checked={editingContest.isFeatured} onChange={handleEditChange} className="form-checkbox" /><label htmlFor="editContestFeatured" className="form-label mb-0">Featured Contest</label></div>
                            {editingContest.status === 'Past' && (<div className="form-group"><label htmlFor="editContestWinner" className="form-label">Winner (for Past contests)</label><input type="text" id="editContestWinner" name="winner" value={editingContest.winner} onChange={handleEditChange} className="form-input" /></div>)}
                            <div className="modal-actions-footer"><button type="button" onClick={() => setIsEditModalOpen(false)} className="modal-button-base modal-button-cancel">Cancel</button><button type="submit" disabled={isLoading} className="modal-button-base admin-button-primary">{isLoading ? 'Updating...' : 'Update Contest'}</button></div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationModal show={isDeleting} title="Confirm Deletion" message="Are you sure you want to delete this contest? This action cannot be undone." onConfirm={handleDeleteContest} onCancel={() => setIsDeleting(false)} />
        </>
    );
};

export default ContestManagement;