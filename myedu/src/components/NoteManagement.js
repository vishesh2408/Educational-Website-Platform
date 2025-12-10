



// src/components/NoteManagement.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlusCircle, Edit, Trash2, X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css'; // Assuming you have a common CSS file for admin dashboard styles
import useUsersCache from '../hooks/useUsersCache';
import CourseEditor from './CourseEditor';


// const API_BASE_URL = 'http://localhost:3001/api';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

// let ReactQuill = window.ReactQuill;
// Note: Replaced Quill with a simple HTML textarea + preview editor `CourseEditor`.

const MessageBox = ({ type, text, actionLabel, actionNoteId, onAction }) => {
    if (!text) return null;
    let Icon;
    let variantClasses = 'bg-blue-50 text-blue-800';
    switch (type) {
        case 'info': Icon = Info; variantClasses = 'bg-blue-50 text-blue-800'; break;
        case 'success': Icon = CheckCircle; variantClasses = 'bg-green-50 text-green-800'; break;
        case 'error': Icon = AlertCircle; variantClasses = 'bg-red-50 text-red-800'; break;
        default: Icon = Info; variantClasses = 'bg-blue-50 text-blue-800';
    }
    return (
        <div className={`flex items-center gap-3 p-3 rounded-md ${variantClasses}`}> 
            {Icon && <Icon size={20} />}
            <div className="text-sm flex-1">{text}</div>
            {actionLabel && onAction && (
                <button onClick={() => onAction(actionNoteId)} className="text-sm text-blue-600 hover:underline ml-2">{actionLabel}</button>
            )}
        </div>
    );
};

const ConfirmationModal = ({ show, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', confirmButtonClass = 'admin-button-danger' }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onCancel} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
                </div>
                <p className="text-sm text-gray-700">{message}</p>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onCancel} className="px-3 py-1 rounded border">{cancelText}</button>
                    <button onClick={onConfirm} className="px-3 py-1 rounded bg-red-600 text-white">{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

    const SnapshotModal = ({ show, onCreate, onCancel, defaultLabel = '', defaultReason = '', previewHtml = '' }) => {
    const [label, setLabel] = useState(defaultLabel);
    const [reason, setReason] = useState(defaultReason);
    const [creating, setCreating] = useState(false);
    useEffect(() => { if (show) { setLabel(defaultLabel || ''); setReason(defaultReason || ''); setCreating(false); } }, [show, defaultLabel, defaultReason]);
    if (!show) return null;
    const labelTooLong = label && label.length > 100;
    const reasonTooLong = reason && reason.length > 250;
    const canCreate = !labelTooLong && !reasonTooLong && !creating;
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Create Snapshot</h3>
                    <button onClick={onCancel} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
                </div>
                <div className="space-y-3">
                    <div className="mb-2">
                        <label className="block text-sm font-medium mb-1">Label (optional)</label>
                        <input className="w-full border rounded px-2 py-1" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="eg. Pre-publish backup" maxLength={200} />
                    </div>
                    <div className="mb-2">
                        <label className="block text-sm font-medium mb-1">Reason (optional)</label>
                        <input className="w-full border rounded px-2 py-1" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="eg. final edits" maxLength={500} />
                    </div>
                    <div className="text-sm text-gray-500">Label max 100 chars — Reason max 250 chars</div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Sanitized preview</label>
                        <div className="max-h-60 overflow-auto border rounded p-2 bg-gray-50" dangerouslySetInnerHTML={{ __html: previewHtml || '<em>No content available for preview</em>' }}></div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button className="px-3 py-1 rounded border" onClick={onCancel} disabled={creating}>Cancel</button>
                    <button className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={async () => { if (!canCreate) return; setCreating(true); await onCreate({ label: label || null, reason: reason || null }); setCreating(false); }} disabled={!canCreate}>{creating ? 'Creating...' : 'Create Snapshot'}</button>
                </div>
            </div>
        </div>
    );
};

const NoteManagement = () => {
    const { currentUser, logout } = useAuth();
    // const adminToken = currentUser?.token;
    const [notes, setNotes] = useState([]);
    const [notesPage, setNotesPage] = useState(1);
    const [notesTotalPages, setNotesTotalPages] = useState(null);
    const [notesLoadingMore, setNotesLoadingMore] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', subject: '', content: '', imageUrl: '' });
    const [coursesList, setCoursesList] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [selectedTopicId, setSelectedTopicId] = useState('');
    const [editingNote, setEditingNote] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editSelectedCourseId, setEditSelectedCourseId] = useState('');
    const [editSelectedModuleId, setEditSelectedModuleId] = useState('');
    const [editSelectedTopicId, setEditSelectedTopicId] = useState('');
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [content, setContent] = useState('');
    const [draftId, setDraftId] = useState(null);
    const [editDraftId, setEditDraftId] = useState(null);
    const [autosaveEnabled, setAutosaveEnabled] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [versionsModalOpen, setVersionsModalOpen] = useState(false);
    const [versionsList, setVersionsList] = useState([]);
    const [versionsLoading, setVersionsLoading] = useState(false);
    const [versionsNoteId, setVersionsNoteId] = useState(null);
    const [editIsDraft, setEditIsDraft] = useState(false);
    const { getUser, usersCache } = useUsersCache();
    const [previewHtml, setPreviewHtml] = useState('');
    const [templates, setTemplates] = useState([]);
    const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
    const [publishCreateSnapshot, setPublishCreateSnapshot] = useState(true);
    const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
    const [snapshotNoteId, setSnapshotNoteId] = useState(null);
    const [snapshotIsForPublish, setSnapshotIsForPublish] = useState(false);
    const [snapshotOnDone, setSnapshotOnDone] = useState(null);
    const [snapshotDefaultLabel, setSnapshotDefaultLabel] = useState('');
    const [snapshotDefaultReason, setSnapshotDefaultReason] = useState('');
    const [snapshotPreviewHtml, setSnapshotPreviewHtml] = useState('');
    const [highlightVersionIndex, setHighlightVersionIndex] = useState(null);
    const [highlightNoteId, setHighlightNoteId] = useState(null);
    const versionRefs = useRef([]);


    const authFetchOptions = {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 🎯 FIX: Tell browser to send the cookie
    };

    const fetchNotes = useCallback(async (page = 1, append = false) => {
        if (page === 1) setIsLoading(true); else setNotesLoadingMore(true);
        setFormMessage({ type: '', text: '' });
        // if (!adminToken) { setFormMessage({ type: 'error', text: 'Authentication token missing.' }); setIsLoading(false); return; }
        try {
            const limit = 15;
            const response = await fetch(`${API_BASE_URL}/admin/notes?page=${page}&limit=${limit}&snippet=1`, { ...authFetchOptions, method: 'GET' });

            if (response.status === 401 || response.status === 403) {
                 setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                 logout(); 
                 setIsLoading(false); 
                 return;
            }

            const data = await response.json();
            if (response.ok) {
                // paginated response returns { items, total, page, totalPages }
                if (data.items) {
                    setNotes(prev => (append ? [...prev, ...data.items] : data.items));
                    setNotesPage(data.page || page);
                    setNotesTotalPages(data.totalPages || null);
                } else {
                    setNotes(data);
                }
                setFormMessage({ type: 'success', text: 'Notes loaded successfully!' });
            } else { setFormMessage({ type: 'error', text: data.msg || 'Failed to fetch notes.' }); 
            //if (response.status === 401 || response.status === 403) logout();
         }
        } catch (error) { console.error('Error fetching notes:', error); setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to fetch notes.' }); } finally { setIsLoading(false); setNotesLoadingMore(false); }
    }, [logout]);

    // Fetch admin courses (populated with modules and topics)
    const fetchAdminCourses = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/courses`, { ...authFetchOptions, method: 'GET' });
            if (res.ok) {
                const data = await res.json();
                setCoursesList(data || []);
            } else {
                console.warn('Failed to fetch admin courses for notes selector');
            }
        } catch (err) {
            console.error('Error fetching admin courses:', err);
        }
    }, []);

    // Load any persisted draft id/content from localStorage for new note
    useEffect(() => {
        try {
            const stored = localStorage.getItem('admin_note_draft');
            if (stored) {
                const obj = JSON.parse(stored);
                if (obj && obj.content) setContent(obj.content);
                if (obj && obj.draftId) setDraftId(obj.draftId);
                if (obj && obj.title) setNewNote(prev => ({ ...prev, title: obj.title }));
            }
        } catch (e) { /* ignore */ }
    }, []);

    // Load autosave preference (persisted)
    useEffect(() => {
        try {
            const v = localStorage.getItem('admin_note_autosave_enabled');
            if (v !== null) setAutosaveEnabled(v === '1');
        } catch (e) { /* ignore */ }
    }, []);


    // Debounced autosave for creating new notes (draft)
    useEffect(() => {
        if (!autosaveEnabled) return; // autosave disabled by user
        const timer = setTimeout(async () => {
            // Only autosave if there's content
            if (!content || content.trim().length === 0) return;
            try {
                const payload = { ...newNote, content: content, isDraft: true, topicId: selectedTopicId || null };
                let currentDraftId = draftId;
                if (currentDraftId) {
                    // Try updating the existing draft. If the server responds 404
                    // it means the draft was removed or doesn't exist anymore; create a new draft.
                    try {
                        const res = await fetch(`${API_BASE_URL}/admin/notes/${currentDraftId}`, { headers: { 'Content-Type': 'application/json' }, credentials: 'include', method: 'PUT', body: JSON.stringify(payload) });
                        if (res.status === 404) {
                            // Draft not found on server; create a new one
                            const createRes = await fetch(`${API_BASE_URL}/admin/notes`, { headers: { 'Content-Type': 'application/json' }, credentials: 'include', method: 'POST', body: JSON.stringify(payload) });
                            if (createRes.ok) {
                                const data = await createRes.json();
                                currentDraftId = data._id;
                                setDraftId(currentDraftId);
                            } else {
                                // If creation also failed, clear draft tracking to avoid loops
                                setDraftId(null);
                                localStorage.removeItem('admin_note_draft');
                                currentDraftId = null;
                            }
                        }
                    } catch (err) {
                        // network error; keep existing draftId for retry later
                        console.warn('Autosave update failed', err);
                    }
                } else {
                    const res = await fetch(`${API_BASE_URL}/admin/notes`, { headers: { 'Content-Type': 'application/json' }, credentials: 'include', method: 'POST', body: JSON.stringify(payload) });
                    if (res.ok) {
                        const data = await res.json();
                        currentDraftId = data._id;
                        setDraftId(currentDraftId);
                    }
                }

                // persist local copy (use the resolved currentDraftId)
                if (currentDraftId) {
                    localStorage.setItem('admin_note_draft', JSON.stringify({ draftId: currentDraftId, content: content, title: newNote.title }));
                } else {
                    try { localStorage.removeItem('admin_note_draft'); } catch(_) { /* ignore */ }
                }
            } catch (err) {
                console.warn('Autosave draft failed', err);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [content, newNote.title, selectedTopicId]);

    // Debounced autosave for editing note (in modal)
    useEffect(() => {
        if (!editingNote) return;
        if (!autosaveEnabled) return; // autosave disabled by user
        const timer = setTimeout(async () => {
            try {
                const payload = { ...editingNote, content: content, isDraft: true, topicId: editSelectedTopicId || editingNote.topicId || null };
                // update existing note as draft
                try {
                    const res = await fetch(`${API_BASE_URL}/admin/notes/${editingNote._id}`, { headers: { 'Content-Type': 'application/json' }, credentials: 'include', method: 'PUT', body: JSON.stringify(payload) });
                    if (res.status === 404) {
                        setFormMessage({ type: 'error', text: 'The note you were editing was not found (it may have been deleted).' });
                        setEditingNote(null);
                        setIsEditModalOpen(false);
                    }
                } catch (err) {
                    console.warn('Autosave edit failed', err);
                }
            } catch (err) { console.warn('Autosave edit failed', err); }
        }, 1500);
        return () => clearTimeout(timer);
    }, [content, editingNote, editSelectedTopicId]);

    useEffect(() => { fetchNotes(1, false); }, [fetchNotes]);
    useEffect(() => { fetchAdminCourses(); }, [fetchAdminCourses]);

    // Load saved templates
    useEffect(() => {
        try {
            const t = localStorage.getItem('admin_note_templates');
            if (t) setTemplates(JSON.parse(t));
        } catch (e) { /* ignore */ }
    }, []);

    const saveAsTemplate = (name) => {
        const tpl = { name: name || `Template ${templates.length + 1}`, content: content || '' };
        const next = [...(templates || []), tpl];
        setTemplates(next);
        localStorage.setItem('admin_note_templates', JSON.stringify(next));
    };
    const insertTemplate = (idx) => {
        if (!templates || !templates[idx]) return;
        setContent(prev => (prev || '') + '\n' + templates[idx].content);
    };

  

    const handleAddNote = async (e) => {
        e.preventDefault(); setIsLoading(true);
        //if (!adminToken) { setFormMessage({ type: 'error', text: 'Authentication token missing.' }); setIsLoading(false); return; }
        if (!newNote.title.trim() || !content.trim()) { setFormMessage({ type: 'error', text: 'Title and content are required for a new note.' }); setIsLoading(false); return; }
        try {
            let response;
            // If we have an autosaved draft, update it and publish (isDraft: false)
            if (draftId) {
                response = await fetch(`${API_BASE_URL}/admin/notes/${draftId}`, { ...authFetchOptions, method: 'PUT',  body: JSON.stringify({ ...newNote, content: content, topicId: selectedTopicId || null, isDraft: false }) });
            } else {
                response = await fetch(`${API_BASE_URL}/admin/notes`, { ...authFetchOptions, method: 'POST',  body: JSON.stringify({ ...newNote, content: content, topicId: selectedTopicId || null, isDraft: false }) });
            }
            
            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                logout(); 
                setIsLoading(false); 
                return;
            }

            const data = await response.json();
            
            if (response.ok) {
                // If we updated an existing draft, replace it in notes list; otherwise append
                if (draftId) {
                    setNotes(notes.map(n => (n._id === data._id ? data : n)));
                    // clear draft local state
                    setDraftId(null);
                    localStorage.removeItem('admin_note_draft');
                } else {
                    setNotes([...notes, data]);
                }
                setNewNote({ title: '', subject: '', content: '', imageUrl: '' });
                setContent('');
                setFormMessage({ type: 'success', text: 'Note added successfully!' });

                // Backend will attach note to topic when `topicId` is provided on create/update. Keep fallback for safety.
                if (selectedTopicId && !data.topicId) {
                    try {
                        const attachRes = await fetch(`${API_BASE_URL}/admin/topics/${selectedTopicId}`, {
                            ...authFetchOptions,
                            method: 'PUT',
                            body: JSON.stringify({ notes: data.content, updatedAt: new Date() }),
                        });
                        if (!attachRes.ok) {
                            console.warn('Failed to attach note to topic', await attachRes.text());
                            setFormMessage({ type: 'warn', text: 'Note created but failed to attach to topic.' });
                        } else {
                            setFormMessage({ type: 'success', text: 'Note created and attached to topic.' });
                        }
                    } catch (err) {
                        console.error('Error attaching note to topic:', err);
                    }
                }
            }
            
            else { setFormMessage({ type: 'error', text: data.msg || 'Failed to add note.' }); 
            //if (response.status === 401 || response.status === 403) logout(); 
        }
        } catch (error) { console.error('Error adding note:', error); setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to add note.' }); } finally { setIsLoading(false); }
    };

    const fetchSanitizedPreview = async (html) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/util/sanitize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ html }) });
            if (res.ok) {
                const d = await res.json();
                return d.html;
            }
        } catch (err) { console.warn('Preview sanitize failed', err); }
        return html;
    };

    // Open a full-page sanitized preview in a new tab/window.
    const openFullPagePreview = async (html) => {
        try {
            const sanitized = await fetchSanitizedPreview(html || '');
            const w = window.open('', '_blank');
            if (!w) {
                setFormMessage({ type: 'error', text: 'Popup blocked. Allow popups to view full preview.' });
                return;
            }
            const baseStyles = `
                body { font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding: 24px; background: #fff; color: #111827; }
                img { max-width: 100%; height: auto; }
                pre { white-space: pre-wrap; word-wrap: break-word; }
            `;
            // Write a minimal HTML document into the new window
            w.document.open();
            w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Note Preview</title><style>${baseStyles}</style></head><body>${sanitized}</body></html>`);
            w.document.close();
        } catch (err) {
            console.error('Failed to open full preview', err);
            setFormMessage({ type: 'error', text: 'Failed to open full preview.' });
        }
    };

    const startEditingNote = (note) => {
        // Lazy-load full note content when opening edit modal to avoid loading heavy HTML in table
        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/admin/notes/${note._id}`, { ...authFetchOptions, method: 'GET' });
                if (res.ok) {
                    const full = await res.json();
                    setEditingNote({ ...full });
                    setContent(full.content || '');
                    setEditIsDraft(!!full.isDraft);
                } else {
                    // fallback to provided note
                    setEditingNote({ ...note });
                    setContent(note.content || '');
                    setEditIsDraft(!!note.isDraft);
                }
            } catch (err) {
                console.warn('Failed to load full note, opening with provided note', err);
                setEditingNote({ ...note });
                setContent(note.content || '');
                setEditIsDraft(!!note.isDraft);
            }
        })();
        setEditIsDraft(!!note.isDraft);
        // If the note already has a deterministic topicId, use it to pre-select Course/Module/Topic
        if (note.topicId) {
            let found = false;
            for (const course of coursesList || []) {
                if (!course.modules) continue;
                for (const mod of course.modules) {
                    if (!mod.topics) continue;
                    for (const topic of mod.topics) {
                        if (String(topic._id) === String(note.topicId)) {
                            setEditSelectedCourseId(course._id);
                            setEditSelectedModuleId(mod._id);
                            setEditSelectedTopicId(topic._id);
                            found = true; break;
                        }
                    }
                    if (found) break;
                }
                if (found) break;
            }
            if (!found) {
                // fallback to heuristic detection
                const detected = autoDetectTopicForNote(note.content);
                if (detected) {
                    setEditSelectedCourseId(detected.courseId);
                    setEditSelectedModuleId(detected.moduleId);
                    setEditSelectedTopicId(detected.topicId);
                } else {
                    setEditSelectedCourseId(''); setEditSelectedModuleId(''); setEditSelectedTopicId('');
                }
            }
        } else {
            // Try to auto-detect attached topic based on content
            const detected = autoDetectTopicForNote(note.content);
            if (detected) {
                setEditSelectedCourseId(detected.courseId);
                setEditSelectedModuleId(detected.moduleId);
                setEditSelectedTopicId(detected.topicId);
            } else {
                // reset edit selectors; admin can choose where to attach
                setEditSelectedCourseId('');
                setEditSelectedModuleId('');
                setEditSelectedTopicId('');
            }
        }
        setIsEditModalOpen(true);
    };

    // Attempt to auto-detect which topic a note belongs to by matching content
    const autoDetectTopicForNote = (noteContent) => {
        if (!noteContent) return null;
        const normalized = (noteContent || '').replace(/\s+/g, ' ').trim();
        for (const course of coursesList || []) {
            if (!course.modules) continue;
            for (const mod of course.modules) {
                if (!mod.topics) continue;
                for (const topic of mod.topics) {
                    const tNotes = (topic.notes || '').replace(/\s+/g, ' ').trim();
                    if (!tNotes) continue;
                    // Exact match or substring match (use short snippet)
                    if (tNotes === normalized) return { courseId: course._id, moduleId: mod._id, topicId: topic._id };
                    const snippet = normalized.slice(0, 200);
                    if (tNotes.includes(snippet) || snippet.includes(tNotes.slice(0,200))) return { courseId: course._id, moduleId: mod._id, topicId: topic._id };
                }
            }
        }
        return null;
    };
    const handleEditChange = (e) => { const { name, value } = e.target; setEditingNote(prev => ({ ...prev, [name]: value })); };
    const handleContentChange = (next) => { setContent(next); };

    const handleUpdateNote = async (e) => {
        e.preventDefault(); setIsLoading(true);
        //if (!adminToken || !editingNote?._id) { setFormMessage({ type: 'error', text: 'Authentication token or note ID missing.' }); setIsLoading(false); return; }
        if (!editingNote.title.trim() || !content.trim()) { setFormMessage({ type: 'error', text: 'Title and content are required for the note.' }); setIsLoading(false); return; }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/notes/${editingNote._id}`, { ...authFetchOptions, method: 'PUT', body: JSON.stringify({ ...editingNote, content: content, topicId: editSelectedTopicId || editingNote.topicId || null, isDraft: !!editIsDraft }) });
            
            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                logout(); 
                setIsLoading(false); 
                setIsEditModalOpen(false);
                return;
            }

            const data = await response.json();
            if (response.ok) {
                setNotes(notes.map(n => (n._id === data._id ? data : n)));
                setIsEditModalOpen(false);
                setEditingNote(null);
                setContent('');
                setFormMessage({ type: 'success', text: 'Note updated successfully!' });

                // If admin selected a topic in edit modal, attach note content to that topic
                if (editSelectedTopicId) {
                    try {
                        const attachRes = await fetch(`${API_BASE_URL}/admin/topics/${editSelectedTopicId}`, {
                            ...authFetchOptions,
                            method: 'PUT',
                            body: JSON.stringify({ notes: data.content, updatedAt: new Date() }),
                        });
                        if (!attachRes.ok) {
                            console.warn('Failed to attach updated note to topic', await attachRes.text());
                            setFormMessage({ type: 'warn', text: 'Note updated but failed to attach to topic.' });
                        } else {
                            setFormMessage({ type: 'success', text: 'Note updated and attached to topic.' });
                        }
                    } catch (err) {
                        console.error('Error attaching updated note to topic:', err);
                    }
                }
            }
            else { setFormMessage({ type: 'error', text: data.msg || 'Failed to update note.' }); 
            //if (response.status === 401 || response.status === 403) logout(); 
        }
        } catch (error) { console.error('Error updating note:', error); setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to update note.' }); } finally { setIsLoading(false); }
    };

    const confirmDeleteNote = (noteId) => { setNoteToDelete(noteId); setIsDeleting(true); };
    const handleDeleteNote = async () => {
        setIsLoading(true); setFormMessage({ type: '', text: '' });
        //if (!adminToken || !noteToDelete) { setFormMessage({ type: 'error', text: 'Authentication token or note ID missing for deletion.' }); setIsLoading(false); return; }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/notes/${noteToDelete}`, { ...authFetchOptions, method: 'DELETE' });

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                logout(); 
                setIsLoading(false); 
                setIsDeleting(false);
                return;
            }

            const data = await response.json();
            if (response.ok) { setNotes(notes.filter(n => n._id !== noteToDelete)); setFormMessage({ type: 'success', text: data.msg || 'Note deleted successfully!' }); }
            else { setFormMessage({ type: 'error', text: data.msg || 'Failed to delete note.' }); 
            //if (response.status === 401 || response.status === 403) logout(); 
        }
        } catch (error) { console.error('Error deleting note:', error); setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to delete note.' }); } finally { setIsDeleting(false); setNoteToDelete(null); setIsLoading(false); }
    };

    // Versions modal helpers
    const openVersionsModal = async (note) => {
        setVersionsNoteId(note._id);
        setVersionsModalOpen(true);
        setVersionsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/notes/${note._id}/versions`, { ...authFetchOptions, method: 'GET' });
            if (res.ok) {
                const data = await res.json();
                const versions = data || [];
                // Resolve createdBy IDs to usernames (use cache and fetch missing)
                const ids = Array.from(new Set(versions.map(v => v.createdBy).filter(Boolean)));
                if (ids.length > 0) {
                    const missing = ids.filter(id => !usersCache[id]);
                    try {
                        if (missing.length > 0) {
                            const fetched = await Promise.all(missing.map(id => getUser(id)));
                            const combined = { ...usersCache };
                            missing.forEach((id, idx) => { if (fetched[idx]) combined[id] = fetched[idx]; });
                            const mapped = versions.map(v => ({ ...v, createdByDisplay: v.createdBy ? ((combined[v.createdBy] && (combined[v.createdBy].username || combined[v.createdBy].email)) || v.createdBy) : null }));
                            setVersionsList(mapped);
                        } else {
                            const mapped = versions.map(v => ({ ...v, createdByDisplay: v.createdBy ? ((usersCache[v.createdBy] && (usersCache[v.createdBy].username || usersCache[v.createdBy].email)) || v.createdBy) : null }));
                            setVersionsList(mapped);
                        }
                    } catch (err) {
                        console.warn('Failed to resolve version authors', err);
                        setVersionsList(versions);
                    }
                } else {
                    setVersionsList(versions);
                }
            } else {
                setFormMessage({ type: 'error', text: 'Failed to load versions.' });
            }
        } catch (err) {
            console.error('Error fetching versions:', err);
            setFormMessage({ type: 'error', text: 'Network error while fetching versions.' });
        } finally {
            setVersionsLoading(false);
        }
    };

    // When versions modal opens and we have a highlight index for this note, scroll it into view
    useEffect(() => {
        if (versionsModalOpen && versionsList && highlightVersionIndex != null && highlightNoteId && versionsNoteId === highlightNoteId) {
            const el = versionRefs.current[highlightVersionIndex];
            if (el && typeof el.scrollIntoView === 'function') {
                try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { try { el.scrollIntoView(); } catch (_) { /* ignore */ } }
            }
        }
    }, [versionsModalOpen, versionsList, highlightVersionIndex, highlightNoteId, versionsNoteId]);

    const closeVersionsModal = () => {
        setVersionsModalOpen(false);
        setVersionsList([]);
        setVersionsNoteId(null);
    };

    const openVersionsModalById = (id) => {
        if (!id) return;
        openVersionsModal({ _id: id });
    };

    const handleRevertVersion = async (versionIndex) => {
        if (!versionsNoteId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/notes/${versionsNoteId}/revert`, { ...authFetchOptions, method: 'POST', body: JSON.stringify({ versionIndex }) });
            const data = await res.json();
            if (res.ok) {
                // update notes list in UI
                setNotes(notes.map(n => (n._id === data._id ? data : n)));
                setFormMessage({ type: 'success', text: 'Note reverted to selected version.' });
                closeVersionsModal();
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to revert version.' });
            }
        } catch (err) {
            console.error('Error reverting version:', err);
            setFormMessage({ type: 'error', text: 'Network error while reverting version.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteVersion = async (versionIndex) => {
        if (!versionsNoteId) return;
        if (!confirm('Delete this version? This action cannot be undone.')) return;
        setIsLoading(true);
        // First, ensure the note still exists to avoid 404 on versions endpoints
        try {
            const check = await fetch(`${API_BASE_URL}/admin/notes/${versionsNoteId}`, { ...authFetchOptions, method: 'GET' });
            if (!check.ok) {
                // Try to capture response body for diagnostics (trimmed)
                let bodySnippet = '';
                try { bodySnippet = (await check.text()).slice(0, 300); } catch (e) { bodySnippet = '<could not read body>'; }
                console.debug('Note existence check failed', { status: check.status, bodySnippet });
                setFormMessage({ type: 'error', text: `Note not found or server error (${check.status}).` });
                setIsLoading(false);
                // refresh parent list and close modal
                fetchNotes(1, false);
                closeVersionsModal();
                return;
            } else {
                try { const noteJson = await check.json(); console.debug('Note exists for versions check', noteJson && noteJson._id); } catch (_) { /* ignore */ }
            }
        } catch (err) {
            console.error('Note existence check failed:', err);
            setFormMessage({ type: 'error', text: 'Unable to verify note existence before delete.' });
            setIsLoading(false);
            return;
        }

        // Helper to parse response once based on Content-Type
        const readResponse = async (res) => {
            const ct = (res.headers.get('content-type') || '').toLowerCase();
            if (ct.includes('application/json')) {
                return await res.json();
            }
            const text = await res.text();
            return { msg: text ? text.slice(0, 200) : '' };
        };

        try {
            const res = await fetch(`${API_BASE_URL}/admin/notes/${versionsNoteId}/versions/${versionIndex}`, { ...authFetchOptions, method: 'DELETE' });
            const data = await readResponse(res);
            if (res.ok) {
                setFormMessage({ type: 'success', text: data.msg || 'Version deleted.' });
                // refresh list
                openVersionsModal({ _id: versionsNoteId });
            } else if (res.status === 404) {
                setFormMessage({ type: 'error', text: data.msg || 'Version or note not found (404).' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || `Failed to delete version (status ${res.status})` });
            }
        } catch (err) {
            console.error('Error deleting version:', err);
            setFormMessage({ type: 'error', text: 'Network error or server not available while deleting version.' });
        } finally { setIsLoading(false); }
    };

    const handleDeleteAllVersions = async () => {
        if (!versionsNoteId) return;
        if (!confirm('Delete ALL versions for this note? This cannot be undone.')) return;
        setIsLoading(true);
        // Ensure note still exists
        try {
            const check = await fetch(`${API_BASE_URL}/admin/notes/${versionsNoteId}`, { ...authFetchOptions, method: 'GET' });
            if (check.status === 404) {
                setFormMessage({ type: 'error', text: 'Note not found. It may have been deleted.' });
                setIsLoading(false);
                fetchNotes(1, false);
                closeVersionsModal();
                return;
            }
        } catch (err) {
            console.error('Note existence check failed:', err);
            setFormMessage({ type: 'error', text: 'Unable to verify note existence before clearing versions.' });
            setIsLoading(false);
            return;
        }

        const readResponse = async (res) => {
            const ct = (res.headers.get('content-type') || '').toLowerCase();
            if (ct.includes('application/json')) {
                return await res.json();
            }
            const text = await res.text();
            return { msg: text ? text.slice(0,200) : '' };
        };

        try {
            const res = await fetch(`${API_BASE_URL}/admin/notes/${versionsNoteId}/versions`, { ...authFetchOptions, method: 'DELETE' });
            const data = await readResponse(res);
            if (res.ok) {
                setFormMessage({ type: 'success', text: data.msg || 'All versions cleared.' });
                openVersionsModal({ _id: versionsNoteId });
            } else if (res.status === 404) {
                setFormMessage({ type: 'error', text: data.msg || 'Note not found (404).' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || `Failed to clear versions (status ${res.status})` });
            }
        } catch (err) {
            console.error('Error clearing versions:', err);
            setFormMessage({ type: 'error', text: 'Network error or server not available while clearing versions.' });
        } finally { setIsLoading(false); }
    };

    const handlePublishEdit = async () => {
        if (!editingNote || !editingNote._id) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/notes/${editingNote._id}`, { ...authFetchOptions, method: 'PUT', body: JSON.stringify({ ...editingNote, content: editingNote.content, topicId: editSelectedTopicId || editingNote.topicId || null, isDraft: false }) });
            const data = await res.json();
            if (res.ok) {
                setNotes(notes.map(n => (n._id === data._id ? data : n)));
                setFormMessage({ type: 'success', text: 'Note published.' });
                setIsEditModalOpen(false);
                setEditingNote(null);
                setContent('');
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to publish note.' });
            }
        } catch (err) {
            console.error('Error publishing note:', err);
            setFormMessage({ type: 'error', text: 'Network error while publishing note.' });
        } finally { setIsLoading(false); }
    };

    const openPublishConfirm = () => {
        setPublishCreateSnapshot(true);
        setPublishConfirmOpen(true);
    };

    const confirmPublish = async () => {
        if (!editingNote || !editingNote._id) return;
        setIsLoading(true);
        try {
            if (publishCreateSnapshot) {
                // Open snapshot modal and continue publish after snapshot created
                setSnapshotNoteId(editingNote._id);
                setSnapshotIsForPublish(true);
                setSnapshotDefaultLabel('Pre-publish snapshot');
                setSnapshotDefaultReason('pre-publish');
                setSnapshotOnDone(async (_snapData) => {
                    // continue publishing regardless of snapshot result
                    try { await handlePublishEdit(); } catch (e) { console.error('Error continuing publish after snapshot:', e); }
                });
                setSnapshotModalOpen(true);
            } else {
                await handlePublishEdit();
            }
        } catch (err) {
            console.error('Error during publish confirm:', err);
            setFormMessage({ type: 'error', text: 'Network error while publishing.' });
        } finally {
            setPublishConfirmOpen(false);
            setIsLoading(false);
        }
    };

    // Open snapshot modal to create a snapshot (or to create + continue publish)
    const createSnapshot = (noteId) => {
        if (!noteId) return;
        setSnapshotNoteId(noteId);
        setSnapshotIsForPublish(false);
        setSnapshotDefaultLabel('Manual snapshot');
        setSnapshotDefaultReason('manual');
        // prepare sanitized preview for this note
        const note = notes.find(n => String(n._id) === String(noteId)) || (editingNote && String(editingNote._id) === String(noteId) ? { ...editingNote, content: editingNote.content } : null);
        if (note) {
            fetchSanitizedPreview(note.content).then(html => setSnapshotPreviewHtml(html)).catch(() => setSnapshotPreviewHtml(note.content || ''));
        } else {
            setSnapshotPreviewHtml('');
        }
        setSnapshotOnDone((data) => {
            if (!data) return;
            setFormMessage({ type: 'success', text: `Snapshot created (index ${data.snapshotIndex})${data.snapshot && data.snapshot.label ? ` — ${data.snapshot.label}` : ''}`, actionLabel: 'View versions', actionNoteId: noteId });
            // open versions modal and highlight
            openVersionsModal({ _id: noteId });
            setHighlightVersionIndex(data.snapshotIndex);
            setHighlightNoteId(noteId);
            // clear highlight after 8s
            setTimeout(() => { setHighlightVersionIndex(null); setHighlightNoteId(null); }, 8000);
        });
        setSnapshotModalOpen(true);
    };

    return (
        <>
            <MessageBox type={formMessage.type} text={formMessage.text} actionLabel={formMessage.actionLabel} actionNoteId={formMessage.actionNoteId} onAction={openVersionsModalById} />
            <h3 className="admin-section-title"><PlusCircle size={20} /> Add New Note</h3>

            <form onSubmit={handleAddNote} className="admin-form-container">
                            <div className="form-group"><label htmlFor="newNoteTitle" className="form-label">Title</label><input type="text" id="newNoteTitle" name="title" value={newNote.title} onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} required className="form-input" /></div>
                            <div className="form-group"><label className="form-label">Attach to (optional)</label>
                                <div className="flex gap-2">
                                    <select value={selectedCourseId} onChange={(e)=>{ setSelectedCourseId(e.target.value); setSelectedModuleId(''); setSelectedTopicId(''); }} className="form-input">
                                        <option value="">Select course</option>
                                        {coursesList.map(c => (<option key={c._id} value={c._id}>{c.title}</option>))}
                                    </select>
                                    <select value={selectedModuleId} onChange={(e)=>{ setSelectedModuleId(e.target.value); setSelectedTopicId(''); }} className="form-input">
                                        <option value="">Select module</option>
                                        {(coursesList.find(c=>c._id===selectedCourseId)?.modules || []).map(m => (<option key={m._id} value={m._id}>{m.title}</option>))}
                                    </select>
                                    <select value={selectedTopicId} onChange={(e)=>setSelectedTopicId(e.target.value)} className="form-input">
                                        <option value="">Select topic</option>
                                        {(() => {
                                            const course = coursesList.find(c=>c._id===selectedCourseId);
                                            const mod = course ? (course.modules || []).find(mm=>mm._id===selectedModuleId) : null;
                                            return (mod?.topics || []).map(t => (<option key={t._id} value={t._id}>{t.title}</option>));
                                        })()}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group"><label htmlFor="newNoteSubject" className="form-label">Subject</label><input type="text" id="newNoteSubject" name="subject" value={newNote.subject} onChange={(e) => setNewNote({ ...newNote, subject: e.target.value })} className="form-input" /></div>
                            <div className="form-group"><label htmlFor="newNoteContent" className="form-label">Content</label>
                                <div className="flex items-center gap-2 mb-2">
                                    <select className="form-input" onChange={(e)=>{ if (e.target.value) insertTemplate(Number(e.target.value)); e.target.selectedIndex = 0; }}>
                                        <option value="">Insert template...</option>
                                        {(templates || []).map((t, i) => (<option key={i} value={i}>{t.name}</option>))}
                                    </select>
                                    <button type="button" className="admin-button-secondary" onClick={() => {
                                        const name = prompt('Template name (optional)');
                                        saveAsTemplate(name);
                                    }}>Save as template</button>
                                    <label style={{ marginLeft: 8 }} className="text-sm flex items-center"><input type="checkbox" checked={autosaveEnabled} onChange={(e) => {
                                        const enable = !!e.target.checked;
                                        setAutosaveEnabled(enable);
                                        try { localStorage.setItem('admin_note_autosave_enabled', enable ? '1' : '0'); } catch (_) {}
                                        if (!enable) {
                                            try { localStorage.removeItem('admin_note_draft'); } catch (_) {}
                                            setDraftId(null);
                                            setFormMessage({ type: 'info', text: 'Autosave disabled and local draft cleared.' });
                                        } else {
                                            setFormMessage({ type: 'success', text: 'Autosave enabled.' });
                                        }
                                    }} /> <span style={{ marginLeft: 6 }}>Autosave</span></label>
                                </div>
                                <CourseEditor initial={content} onChange={setContent} />
                                <div className="mt-2 flex items-center gap-2">
                                    <button type="button" className="admin-button-secondary" onClick={async () => {
                                        setIsPreviewOpen(p => !p);
                                        if (!isPreviewOpen) {
                                            const sanitized = await fetchSanitizedPreview(content);
                                            setPreviewHtml(sanitized);
                                        }
                                    }}>{isPreviewOpen ? 'Hide Preview' : 'Preview'}</button>
                                    <button type="button" className="admin-button-secondary" onClick={async () => { await openFullPagePreview(content); }}>Full Page</button>
                                    {draftId ? (<>
                                        <span className="text-sm text-gray-500">Draft saved</span>
                                        <button type="button" className="admin-button-primary" onClick={async () => {
                                            // Publish the draft explicitly
                                            if (!draftId) return;
                                            setIsLoading(true);
                                            try {
                                                const res = await fetch(`${API_BASE_URL}/admin/notes/${draftId}`, { headers: { 'Content-Type': 'application/json' }, credentials: 'include', method: 'PUT', body: JSON.stringify({ ...newNote, content: content, isDraft: false, topicId: selectedTopicId || null }) });
                                                if (res.ok) {
                                                    const d = await res.json();
                                                    setNotes(notes.map(n => (n._id === d._id ? d : n)));
                                                    setDraftId(null); localStorage.removeItem('admin_note_draft');
                                                    setFormMessage({ type: 'success', text: 'Draft published.' });
                                                } else {
                                                    const err = await res.json(); setFormMessage({ type: 'error', text: err.msg || 'Failed to publish draft.' });
                                                }
                                            } catch (err) { console.error('Publish draft failed', err); setFormMessage({ type: 'error', text: 'Network error publishing draft.' }); }
                                            finally { setIsLoading(false); }
                                        }}>Publish Draft</button>
                                    </>) : (<span className="text-sm text-gray-400">Autosave inactive until content present</span>)}
                                </div>
                                {isPreviewOpen && (
                                    <div className="scroll-snap-card preview-panel border rounded">
                                        <div className="slide">
                                            <div className="admin-note-preview" dangerouslySetInnerHTML={{ __html: previewHtml || content }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="form-group"><label htmlFor="newNoteImageUrl" className="form-label">Image URL (Optional)</label><input type="text" id="newNoteImageUrl" name="imageUrl" value={newNote.imageUrl} onChange={(e) => setNewNote({ ...newNote, imageUrl: e.target.value })} className="form-input" placeholder="https://example.com/note-image.jpg" /></div>
                            <button type="submit" disabled={isLoading} className="form-submit-button">{isLoading ? 'Adding...' : <><PlusCircle size={20} className="icon-mr" /> Add Note</>}</button>
                        </form>

            <h3 className="admin-section-title"><Info size={20} /> Existing Notes</h3>
            {isLoading ? (<p className="text-center text-gray-500 dark:text-gray-400">Loading notes...</p>) : notes.length === 0 ? (<p className="admin-message-info">No notes found. Add a new note above!</p>) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead className="admin-table-thead">
                            <tr>
                                <th className="admin-table-th rounded-tl-lg">Title</th>
                                <th className="admin-table-th">Subject</th>
                                <th className="admin-table-th">Content</th>
                                <th className="admin-table-th">Image</th>
                                <th className="admin-table-th">Last Updated</th>
                                <th className="admin-table-th rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notes.map((note) => (
                                <tr key={note._id} className="admin-table-tr">
                                    <td className="admin-table-td" data-label="Title">{note.title}</td>
                                    <td className="admin-table-td" data-label="Subject">{note.subject || 'N/A'}</td>
                                                            <td className="admin-table-td admin-table-td-description" data-label="Content">{(note.snippet ? (note.snippet.slice(0, 120) + (note.snippet.length > 120 ? '...' : '')) : (note.content ? (note.content.slice(0, 120) + '...') : ''))}</td>
                                    <td className="admin-table-td" data-label="Image">{note.imageUrl ? <img src={(note.imageUrl && (note.imageUrl.startsWith('http://') || note.imageUrl.startsWith('https://'))) ? `${API_BASE_URL}/admin/util/proxy?url=${encodeURIComponent(note.imageUrl)}` : note.imageUrl} alt="Note" className="admin-table-image" /> : 'N/A'}</td>
                                    <td className="admin-table-td" data-label="Last Updated">{new Date(note.updatedAt).toLocaleString()}</td>
                                    <td className="admin-table-td admin-table-actions">
                                        <button onClick={() => startEditingNote(note)} onMouseEnter={() => { import('./CourseEditorEditorPanel'); }} title="Edit" className="admin-action-button edit-button"><Edit size={18} /></button>
                                        <button onClick={() => openVersionsModal(note)} title="Versions" className="admin-action-button info-button">V</button>
                                        <button onClick={() => confirmDeleteNote(note._id)} title="Delete" className="admin-action-button delete-button"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {isEditModalOpen && editingNote && (
                <div className="modal-overlay modal-overlay-overflow">
                    <div className="modal-content-box modal-content-box-lg">
                        <div className="modal-header"><h3 className="modal-title">Edit Note</h3><button onClick={() => setIsEditModalOpen(false)} className="modal-close-button"><X size={24} /></button></div>
                        <form onSubmit={handleUpdateNote}>
                            <div className="form-group"><label htmlFor="editNoteTitle" className="form-label">Title</label><input type="text" id="editNoteTitle" name="title" value={editingNote.title} onChange={handleEditChange} required className="form-input" /></div>
                            <div className="form-group"><label htmlFor="editNoteSubject" className="form-label">Subject</label><input type="text" id="editNoteSubject" name="subject" value={editingNote.subject || ''} onChange={handleEditChange} className="form-input" /></div>
                            <div className="form-group"><label htmlFor="editNoteContent" className="form-label">Content</label>
                                <div className="flex items-center gap-2 mb-2">
                                    <select className="form-input" onChange={(e)=>{ if (e.target.value) insertTemplate(Number(e.target.value)); e.target.selectedIndex = 0; }}>
                                        <option value="">Insert template...</option>
                                        {(templates || []).map((t, i) => (<option key={i} value={i}>{t.name}</option>))}
                                    </select>
                                    <button type="button" className="admin-button-secondary" onClick={() => {
                                        const name = prompt('Template name (optional)');
                                        saveAsTemplate(name);
                                    }}>Save as template</button>
                                </div>
                                <CourseEditor initial={editingNote.content || ''} onChange={(val) => setEditingNote(prev => ({ ...prev, content: val }))} />
                                <div className="mt-2 flex items-center gap-2">
                                    <button type="button" className="admin-button-secondary" onClick={async () => {
                                        setIsPreviewOpen(p => !p);
                                        if (!isPreviewOpen) {
                                            const sanitized = await fetchSanitizedPreview(editingNote.content || '');
                                            setPreviewHtml(sanitized);
                                        }
                                    }}>{isPreviewOpen ? 'Hide Preview' : 'Preview'}</button>
                                    <button type="button" className="admin-button-secondary" onClick={async () => { await openFullPagePreview(editingNote.content || content || ''); }}>Full Page</button>
                                    <span className="text-sm text-gray-400">Autosaves while editing</span>
                                </div>
                                {isPreviewOpen && (
                                    <div className="scroll-snap-card preview-panel border rounded">
                                        <div className="slide">
                                            <div className="admin-note-preview" dangerouslySetInnerHTML={{ __html: previewHtml || (editingNote.content || '') }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="form-group"><label className="form-label">Attach to (optional)</label>
                                <div className="flex gap-2">
                                    <select value={editSelectedCourseId} onChange={(e)=>{ setEditSelectedCourseId(e.target.value); setEditSelectedModuleId(''); setEditSelectedTopicId(''); }} className="form-input">
                                        <option value="">Select course</option>
                                        {coursesList.map(c => (<option key={c._id} value={c._id}>{c.title}</option>))}
                                    </select>
                                    <select value={editSelectedModuleId} onChange={(e)=>{ setEditSelectedModuleId(e.target.value); setEditSelectedTopicId(''); }} className="form-input">
                                        <option value="">Select module</option>
                                        {(coursesList.find(c=>c._id===editSelectedCourseId)?.modules || []).map(m => (<option key={m._id} value={m._id}>{m.title}</option>))}
                                    </select>
                                    <select value={editSelectedTopicId} onChange={(e)=>setEditSelectedTopicId(e.target.value)} className="form-input">
                                        <option value="">Select topic</option>
                                        {(() => {
                                            const course = coursesList.find(c=>c._id===editSelectedCourseId);
                                            const mod = course ? (course.modules || []).find(mm=>mm._id===editSelectedModuleId) : null;
                                            return (mod?.topics || []).map(t => (<option key={t._id} value={t._id}>{t.title}</option>));
                                        })()}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group"><label htmlFor="editNoteImageUrl" className="form-label">Image URL (Optional)</label><input type="text" id="editNoteImageUrl" name="imageUrl" value={editingNote.imageUrl || ''} onChange={handleEditChange} className="form-input" /></div>
                            <div className="form-group flex items-center gap-3"><label className="form-label"><input type="checkbox" checked={editIsDraft} onChange={(e) => setEditIsDraft(e.target.checked)} /> <span className="ml-2">Mark as draft</span></label></div>
                            <div className="modal-actions-footer">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="modal-button-base modal-button-cancel">Cancel</button>
                                <button type="button" disabled={isLoading} onClick={openPublishConfirm} className="modal-button-base admin-button-success">Publish</button>
                                <button type="button" disabled={isLoading} onClick={() => createSnapshot(editingNote._id)} className="modal-button-base admin-button-secondary">Create Snapshot</button>
                                <button type="submit" disabled={isLoading} className="modal-button-base admin-button-primary">{isLoading ? 'Updating...' : 'Update Note'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmationModal show={isDeleting} title="Confirm Deletion" message="Are you sure you want to delete this note? This action cannot be undone." onConfirm={handleDeleteNote} onCancel={() => setIsDeleting(false)} />
            {versionsModalOpen && (
                <div className="modal-overlay modal-overlay-overflow">
                    <div className="modal-content-box modal-content-box-lg">
                        <div className="modal-header"><h3 className="modal-title">Versions</h3><button onClick={closeVersionsModal} className="modal-close-button"><X size={24} /></button></div>
                        <div className="modal-body">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="text-sm text-gray-600">Versions for note</div>
                                <div>
                                    <button className="px-2 py-1 rounded bg-red-600 text-white" onClick={handleDeleteAllVersions} disabled={versionsLoading || !versionsList || versionsList.length===0}>Delete all versions</button>
                                </div>
                            </div>
                            {versionsLoading ? (<p>Loading versions...</p>) : !versionsList || versionsList.length === 0 ? (<p className="text-sm text-gray-500">No versions available for this note.</p>) : (
                                                <div className="space-y-2">
                                                    {versionsList.map((v, idx) => {
                                                        const isHighlight = highlightNoteId && versionsNoteId === highlightNoteId && highlightVersionIndex === idx;
                                                        const itemBase = 'p-3 rounded border';
                                                        const itemHighlight = 'bg-yellow-50 ring-2 ring-yellow-300 animate-pulse';
                                                        return (
                                                            <div key={idx} ref={el => versionRefs.current[idx] = el} className={`${itemBase} ${isHighlight ? itemHighlight : ''}`}>
                                                                <div className="text-sm font-medium mb-1"><strong>Version {idx}</strong> — {new Date(v.createdAt).toLocaleString()} {v.createdByDisplay ? `by ${v.createdByDisplay}` : (v.createdBy ? `by ${v.createdBy}` : '')} {v.label ? ` — ${v.label}` : ''} {v.reason ? ` (${v.reason})` : ''}</div>
                                                                <div className="text-sm mb-2" dangerouslySetInnerHTML={{ __html: (v.content || '').slice(0, 500) }}></div>
                                                                <div className="flex items-center gap-2">
                                                                    <button className="px-2 py-1 rounded bg-blue-600 text-white" onClick={() => { if (confirm('Revert to this version? This will save the current state to versions.')) handleRevertVersion(idx); }}>Revert</button>
                                                                    <button className="px-2 py-1 rounded bg-red-600 text-white" onClick={() => { if (confirm('Delete this version? This action cannot be undone.')) handleDeleteVersion(idx); }}>Delete</button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    
                                                </div>
                                            )}
                        </div>
                    </div>
                </div>
            )}
            {publishConfirmOpen && (
                <div className="modal-overlay">
                    <div className="modal-content-box">
                        <div className="modal-header"><h3 className="modal-title">Confirm Publish</h3><button onClick={() => setPublishConfirmOpen(false)} className="modal-close-button"><X size={24} /></button></div>
                        <div className="modal-body">
                            <p>Publishing this note will mark it as published and (server-side) save the previous state into versions. Would you like to continue?</p>
                            <div className="form-group"><label><input type="checkbox" checked={publishCreateSnapshot} onChange={(e)=>setPublishCreateSnapshot(e.target.checked)} /> <span className="ml-2">Create explicit snapshot before publishing</span></label></div>
                        </div>
                        <div className="modal-actions-footer">
                            <button className="modal-button-base modal-button-cancel" onClick={() => setPublishConfirmOpen(false)}>Cancel</button>
                            <button className="modal-button-base admin-button-primary" onClick={confirmPublish}>Confirm Publish</button>
                        </div>
                    </div>
                </div>
            )}
            {/** Snapshot modal for label/reason collection */}
            {snapshotModalOpen && (
                <SnapshotModal
                    show={snapshotModalOpen}
                    defaultLabel={snapshotDefaultLabel}
                    defaultReason={snapshotDefaultReason}
                    onCancel={() => { setSnapshotModalOpen(false); setSnapshotNoteId(null); setSnapshotOnDone(null); setSnapshotIsForPublish(false); }}
                    onCreate={async ({ label, reason }) => {
                        setSnapshotModalOpen(false);
                        if (!snapshotNoteId) return;
                        setIsLoading(true);
                        try {
                            const res = await fetch(`${API_BASE_URL}/admin/util/notes/${snapshotNoteId}/snapshot`, { ...authFetchOptions, method: 'POST', body: JSON.stringify({ label, reason }) });
                            const data = await res.json();
                            if (res.ok) {
                                // set a message with a quick action to view versions
                                setFormMessage({ type: 'success', text: `Snapshot created (index ${data.snapshotIndex})${data.snapshot && data.snapshot.label ? ` — ${data.snapshot.label}` : ''}`, actionLabel: 'View versions', actionNoteId: snapshotNoteId });
                                if (snapshotOnDone) snapshotOnDone(data);
                                // if versions modal open for same note, refresh
                                if (versionsModalOpen && versionsNoteId === snapshotNoteId) openVersionsModal({ _id: snapshotNoteId });
                            } else {
                                setFormMessage({ type: 'error', text: data.msg || 'Failed to create snapshot.' });
                                if (snapshotOnDone) snapshotOnDone(null);
                            }
                        } catch (err) {
                            console.error('Error creating snapshot:', err);
                            setFormMessage({ type: 'error', text: 'Network error while creating snapshot.' });
                            if (snapshotOnDone) snapshotOnDone(null);
                        } finally {
                            setIsLoading(false);
                            // reset snapshot modal context
                            setSnapshotNoteId(null);
                            setSnapshotOnDone(null);
                            setSnapshotIsForPublish(false);
                        }
                    }}
                />
            )}
        </>
    );
};

export default NoteManagement;