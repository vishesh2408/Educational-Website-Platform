
// src/components/ForumPostManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    PlusCircle, Edit, Trash2, X, AlertCircle, CheckCircle, Info,
    MessageSquare, Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // ✅ Import the useAuth hook
import './ForumPostManagement.css';

// Base URL for your backend API
// const API_BASE_URL = 'http://localhost:3001/api';
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;
// Reusable MessageBox Component
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

// Reusable ConfirmationModal Component
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
 * ForumPostManagement Component
 * Handles CRUD operations for forum posts.
 */
const ForumPostManagement = () => {
    // ✅ Get auth data from context instead of props
    const { currentUser, logout } = useAuth();
    //const adminToken = currentUser?.token;
    const handleLogout = logout;

    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState({ title: '', content: '', category: 'discussion', tags: '', imageUrl: '' });
    const [editingPost, setEditingPost] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const simulateImageUpload = async (imageUrl) => {
        if (!imageUrl || !imageUrl.startsWith('http')) return null;
        setIsUploadingImage(true);
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(imageUrl);
                setIsUploadingImage(false);
            }, 500);
        });
    };

    const fetchForumPosts = useCallback(async () => {
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });

        // if (!adminToken) {
        //     setFormMessage({ type: 'error', text: 'Authentication token missing.' });
        //     setIsLoading(false);
        //     return;
        // }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/forum-posts`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json'},
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
                setPosts(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
                setFormMessage({ type: 'success', text: 'Forum posts loaded.' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to fetch forum posts.' });
                //if (response.status === 401 || response.status === 403) handleLogout();
            }
        } catch (error) {
            console.error('Error fetching forum posts:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to fetch forum posts.' });
        } finally {
            setIsLoading(false);
        }
    }, [handleLogout]);

    useEffect(() => {
        fetchForumPosts();
    }, [fetchForumPosts]);

    const handleAddPost = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        //if (!adminToken) { setFormMessage({ type: 'error', text: 'Authentication token missing.' }); setIsLoading(false); return; }

        if (!newPost.title.trim() || !newPost.content.trim()) { setFormMessage({ type: 'error', text: 'Title and content are required for new posts.' }); setIsLoading(false); return; }

        let uploadedImageUrl = null;
        const imageToProcess = newPost.imageUrl;

        if (imageToProcess) {
            uploadedImageUrl = await simulateImageUpload(imageToProcess);
            if (!uploadedImageUrl) {
                setIsLoading(false);
                return;
            }
        }

        const tagsArray = newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

        const postData = {
            title: newPost.title.trim(),
            content: newPost.content.trim(),
            userId: 'admin_user_id',
            imageUrl: uploadedImageUrl,
            category: newPost.category,
            tags: tagsArray,
            parentId: null,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/admin/forum-posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'x-auth-token': adminToken,
                },
                body: JSON.stringify(postData),
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
                fetchForumPosts();
                setNewPost({ title: '', content: '', category: 'discussion', tags: '', imageUrl: '' });
                setFormMessage({ type: 'success', text: 'Post added successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to add post.' });
                //if (response.status === 401 || response.status === 403) handleLogout();
            }
        } catch (error) {
            console.error(`Error adding post:`, error);
            setFormMessage({ type: 'error', text: `Network error or server unavailable. Failed to add post.` });
        } finally {
            setIsLoading(false);
            setIsUploadingImage(false);
        }
    };


    const startEditingPost = (post) => {
        setEditingPost({ ...post, tags: post.tags.join(', ') });
        setIsEditModalOpen(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingPost(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdatePost = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        //if (!adminToken || !editingPost?._id) { setFormMessage({ type: 'error', text: 'Authentication token or post ID missing.' }); setIsLoading(false); return; }

        let uploadedImageUrl = editingPost.imageUrl;
        const imageToProcess = editingPost.imageUrl;

        if (imageToProcess && typeof imageToProcess === 'string' && imageToProcess.startsWith('http')) {
            uploadedImageUrl = imageToProcess;
        } else if (imageToProcess) {
            uploadedImageUrl = imageToProcess;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/forum-posts/${editingPost._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // 'x-auth-token': adminToken,
                    
                },
                body: JSON.stringify({
                    ...editingPost,
                    tags: editingPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                    imageUrl: uploadedImageUrl,
                }),
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                handleLogout(); 
                setIsLoading(false);
                return;
            }


            const data = await response.json();

            if (response.ok) {
                fetchForumPosts();
                setIsEditModalOpen(false);
                setEditingPost(null);
                setFormMessage({ type: 'success', text: 'Forum post updated successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to update forum post.' });
                //if (response.status === 401 || response.status === 403) handleLogout();
            }
        } catch (error) {
            console.error('Error updating forum post:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to update forum post.' });
        } finally {
            setIsLoading(false);
            setIsUploadingImage(false);
        }
    };


    const confirmDeletePost = (postId) => {
        setPostToDelete(postId);
        setIsDeleting(true);
    };

    const handleDeletePost = async () => {
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        //if (!adminToken || !postToDelete) { setFormMessage({ type: 'error', text: 'Authentication token or post ID missing for deletion.' }); setIsLoading(false); return; }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/forum-posts/${postToDelete}`, {
                method: 'DELETE',
                // headers: {
                //     'x-auth-token': adminToken,
                // },
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                handleLogout(); 
                setIsLoading(false);
                return;
            }

            const data = await response.json();

            if (response.ok) {
                fetchForumPosts();
                setFormMessage({ type: 'success', text: data.msg || 'Forum post deleted successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to delete forum post.' });
                //if (response.status === 401 || response.status === 403) handleLogout();
            }
        } catch (error) {
            console.error('Error deleting forum post:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to delete forum post.' });
        } finally {
            setIsDeleting(false);
            setPostToDelete(null);
            setIsLoading(false);
        }
    };

    const handleLike = async (postId) => {
        setFormMessage({ type: '', text: '' });
        // if (!adminToken) {
        //     setFormMessage({ type: 'error', text: 'Authentication token missing for like action.' });
        //     return;
        // }

        try {
            const response = await fetch(`${API_BASE_URL}/forum-posts/like/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // 'x-auth-token': adminToken,
                },
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                setFormMessage({ type: 'success', text: data.msg });
                fetchForumPosts();
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to update like status.' });
                if (response.status === 401 || response.status === 403) handleLogout();
            }
        } catch (error) {
            console.error('Like API error:', error);
            setFormMessage({ type: 'error', text: 'Network error liking post.' });
        }
    };

    const handleMarkAsSolution = async (parentPostId, replyId) => {
        setFormMessage({ type: '', text: '' });
        // if (!adminToken) {
        //     setFormMessage({ type: 'error', text: 'Authentication token missing for mark solution action.' });
        //     return;
        // }

        try {
            const response = await fetch(`${API_BASE_URL}/forum-posts/mark-solution/${parentPostId}/${replyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // 'x-auth-token': adminToken,
                },
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                setFormMessage({ type: 'success', text: data.msg });
                fetchForumPosts();
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to mark solution.' });
                if (response.status === 401 || response.status === 403) handleLogout();
            }
        } catch (error) {
            console.error('Mark solution API error:', error);
            setFormMessage({ type: 'error', text: 'Network error marking solution.' });
        }
    };


    const renderPostRow = (post) => (
        <tr className="table-row" key={post._id}>
            <td className="table-cell table-cell-title">
                <span className="font-semibold">{post.title || `Reply to: ${posts.find(p => p._id === post.parentId)?.title?.substring(0, 30) || '...'}`}</span>
                {post.parentId && <span className="badge badge-blue">Reply</span>}
                {post.solutionId && <span className="badge badge-green">Solution</span>}
            </td>
            <td className="table-cell table-cell-description">{post.content.substring(0, 70)}...</td>
            <td className="table-cell">{post.userId}</td>
            <td className="table-cell">{post.category}</td>
            <td className="table-cell">{post.likes}</td>
            <td className="table-cell">{new Date(post.createdAt).toLocaleString()}</td>
            <td className="table-cell table-actions">
                <button onClick={() => startEditingPost(post)} title="Edit" className="button-action button-edit">
                    <Edit size={18} />
                </button>
                <button onClick={() => confirmDeletePost(post._id)} title="Delete" className="button-action button-delete">
                    <Trash2 size={18} />
                </button>
                <button onClick={() => handleLike(post._id)} title="Toggle Like" className="button-action button-info">
                    <Info size={18} />
                </button>
                {post.parentId && (
                    <button onClick={() => handleMarkAsSolution(post.parentId, post._id)} title="Mark as Solution" className="button-action button-success">
                        <CheckCircle size={18} />
                    </button>
                )}
            </td>
        </tr>
    );


    return (
        <>
            <MessageBox type={formMessage.type} text={formMessage.text} />
            <h3 className="admin-section-title">
                <PlusCircle size={20} /> Add New Forum Post / Reply
            </h3>
            <form onSubmit={handleAddPost} className="form-container">
                <div className="form-group">
                    <label htmlFor="newPostTitle" className="form-label">Title (for new posts)</label>
                    <input type="text" id="newPostTitle" name="title" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} className="form-input" />
                </div>
                <div className="form-group">
                    <label htmlFor="newPostContent" className="form-label">Content</label>
                    <textarea id="newPostContent" name="content" value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} rows="5" required className="form-textarea"></textarea>
                </div>
                <div className="admin-form-grid">
                    <div className="form-group">
                        <label htmlFor="newPostCategory" className="form-label">Category (for new posts)</label>
                        <select id="newPostCategory" name="category" value={newPost.category} onChange={(e) => setNewPost({ ...newPost, category: e.target.value })} className="form-select">
                            <option value="discussion">Discussion</option>
                            <option value="question">Question</option>
                            <option value="bug">Bug</option>
                            <option value="feature">Feature</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="newPostTags" className="form-label">Tags (comma-separated)</label>
                        <input type="text" id="newPostTags" name="tags" value={newPost.tags} onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })} className="form-input" />
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="newPostImageUrl" className="form-label">Image URL (Optional)</label>
                    <input type="text" id="newPostImageUrl" name="imageUrl" value={newPost.imageUrl} onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })} className="form-input" placeholder="https://example.com/image.jpg" />
                </div>
                <button type="submit" disabled={isLoading || isUploadingImage} className="form-submit-button">
                    {isLoading || isUploadingImage ? 'Processing...' : <><PlusCircle size={20} className="icon-mr" /> Add Post</>}
                </button>
            </form>

            <h3 className="admin-section-title">
                <Info size={20} /> Existing Forum Posts & Replies
            </h3>
            {isLoading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Loading forum posts...</p>
            ) : posts.length === 0 ? (
                <p className="message-info">No forum posts found. Add a new one above!</p>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead className="table-header">
                            <tr>
                                <th className="table-header-th rounded-tl-lg">Title</th>
                                <th className="table-header-th">Content</th>
                                <th className="table-header-th">User ID</th>
                                <th className="table-header-th">Category</th>
                                <th className="table-header-th">Likes</th>
                                <th className="table-header-th">Date</th>
                                <th className="table-header-th rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map(renderPostRow)}
                        </tbody>
                    </table>
                </div>
            )}
            {isEditModalOpen && editingPost && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Forum Post / Reply</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdatePost}>
                            <div className="form-group">
                                <label htmlFor="editPostTitle" className="form-label">Title (for posts)</label>
                                <input type="text" id="editPostTitle" name="title" value={editingPost.title || ''} onChange={handleEditChange} className="form-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="editPostContent" className="form-label">Content</label>
                                <textarea id="editPostContent" name="content" value={editingPost.content} onChange={handleEditChange} rows="5" required className="form-textarea"></textarea>
                            </div>
                            {!editingPost.parentId && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="editPostCategory" className="form-label">Category</label>
                                        <select id="editPostCategory" name="category" value={editingPost.category} onChange={handleEditChange} className="form-select">
                                            <option value="discussion">Discussion</option>
                                            <option value="question">Question</option>
                                            <option value="bug">Bug</option>
                                            <option value="feature">Feature</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="editPostTags" className="form-label">Tags (comma-separated)</label>
                                        <input type="text" id="editPostTags" name="tags" value={editingPost.tags || ''} onChange={handleEditChange} className="form-input" />
                                    </div>
                                </>
                            )}
                            <div className="form-group">
                                <label htmlFor="editPostImageUrl" className="form-label">Image URL (Optional)</label>
                                <input type="text" id="editPostImageUrl" name="imageUrl" value={editingPost.imageUrl || ''} onChange={handleEditChange} className="form-input" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="button-base button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading || isUploadingImage} className="button-base button-primary">
                                    {isLoading || isUploadingImage ? 'Updating...' : 'Update Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationModal show={isDeleting} title="Confirm Deletion" message="Are you sure you want to delete this forum post (and its replies)? This action cannot be undone." onConfirm={handleDeletePost} onCancel={() => setIsDeleting(false)} />
        </>
    );
};

export default ForumPostManagement;









