



// src/components/NoteManagement.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlusCircle, Edit, Trash2, X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css'; // Assuming you have a common CSS file for admin dashboard styles
import useUsersCache from '../hooks/useUsersCache';
import QuillNoteEditor from './QuillNoteEditor';
import MarkdownIt from 'markdown-it';
import mdHighlight from 'markdown-it-highlightjs';


// const API_BASE_URL = 'http://localhost:3001/api';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

const mdRenderer = new MarkdownIt({ html: false, linkify: true, breaks: true }).use(mdHighlight);

// Wrap fenced code blocks in a card with a copy button.
(() => {
    const defaultFence = mdRenderer.renderer.rules.fence;
    mdRenderer.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const info = (token.info || '').trim();
        const lang = info ? info.split(/\s+/)[0] : '';
        const inner = defaultFence ? defaultFence(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options);
        return `\n<div class="md-code-card" data-md-code-card="1">\n  <div class="md-code-card__header">\n    <div class="md-code-card__lang">${mdRenderer.utils.escapeHtml(lang || 'code')}</div>\n    <button type="button" class="md-code-card__copy" data-md-copy-btn="1">Copy</button>\n  </div>\n  <div class="md-code-card__body">${inner}</div>\n</div>`;
    };
})();

const renderMarkdownHtml = (markdown) => {
    try {
        return mdRenderer.render(String(markdown || ''));
    } catch (e) {
        return String(markdown || '');
    }
};

const markdownToPlainText = (markdown) => {
    if (!markdown) return '';
    let text = String(markdown);
    // Remove fenced code blocks entirely
    text = text.replace(/```[\s\S]*?```/g, ' ');
    // Remove inline code backticks
    text = text.replace(/`([^`]+)`/g, '$1');
    // Images: ![alt](url) -> alt
    text = text.replace(/!\[([^\]]*)\]\([^\)]*\)/g, '$1');
    // Links: [text](url) -> text
    text = text.replace(/\[([^\]]+)\]\([^\)]*\)/g, '$1');
    // Headings/blockquote/list markers
    text = text.replace(/^\s{0,3}#{1,6}\s+/gm, '');
    text = text.replace(/^\s*>\s?/gm, '');
    text = text.replace(/^\s*([-*+]\s+)/gm, '');
    text = text.replace(/^\s*(\d+\.)\s+/gm, '');
    // Emphasis markers
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/\*([^*]+)\*/g, '$1');
    text = text.replace(/__([^_]+)__/g, '$1');
    text = text.replace(/_([^_]+)_/g, '$1');
    // Collapse whitespace
    text = text.replace(/\s+/g, ' ').trim();
    return text;
};

const htmlToPlainText = (html) => {
    if (!html) return '';
    try {
        const el = document.createElement('div');
        el.innerHTML = String(html);
        return (el.textContent || el.innerText || '').replace(/\s+/g, ' ').trim();
    } catch (e) {
        return String(html);
    }
};

const escapeHtml = (value) => {
    const s = String(value ?? '');
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const renderLegacyHtmlAsText = (html) => {
    const escaped = escapeHtml(html || '');
    return `<pre style="white-space:pre-wrap;word-wrap:break-word;">${escaped}</pre>`;
};

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
    const [tutorialsList, setTutorialsList] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedTutorialId, setSelectedTutorialId] = useState('');
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [selectedTopicId, setSelectedTopicId] = useState('');
    const [attachType, setAttachType] = useState(''); // 'course', 'tutorial', or ''
    const [editingNote, setEditingNote] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editSelectedCourseId, setEditSelectedCourseId] = useState('');
    const [editSelectedTutorialId, setEditSelectedTutorialId] = useState('');
    const [editSelectedModuleId, setEditSelectedModuleId] = useState('');
    const [editSelectedTopicId, setEditSelectedTopicId] = useState('');
    const [editAttachType, setEditAttachType] = useState(''); // 'course', 'tutorial', or ''
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [content, setContent] = useState('');
    const [versionsModalOpen, setVersionsModalOpen] = useState(false);
    const [versionsList, setVersionsList] = useState([]);
    const [versionsLoading, setVersionsLoading] = useState(false);
    const [versionsNoteId, setVersionsNoteId] = useState(null);
    const { getUser, usersCache } = useUsersCache();
    const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
    const [snapshotNoteId, setSnapshotNoteId] = useState(null);
    const [snapshotOnDone, setSnapshotOnDone] = useState(null);
    const [snapshotDefaultLabel, setSnapshotDefaultLabel] = useState('');
    const [snapshotDefaultReason, setSnapshotDefaultReason] = useState('');
    const [snapshotPreviewHtml, setSnapshotPreviewHtml] = useState('');
    const [highlightVersionIndex, setHighlightVersionIndex] = useState(null);
    const [highlightNoteId, setHighlightNoteId] = useState(null);
    const versionRefs = useRef([]);
    const handleAttachTypeChange = (type) => {
        setAttachType(type);
        setSelectedCourseId('');
        setSelectedTutorialId('');
        setSelectedModuleId('');
        setSelectedTopicId('');
    };

    const handleModuleChange = (moduleId) => {
        setSelectedModuleId(moduleId);
        if (!moduleId) {
            setSelectedTopicId('');
            return;
        }
        if (typeCheckIsCourse(attachType)) {
            const course = coursesList.find(c => c._id === selectedCourseId);
            const mod = course ? (course.modules || []).find(m => m._id === moduleId) : null;
            const firstTopic = mod && mod.topics && mod.topics[0] ? mod.topics[0]._id : '';
            setSelectedTopicId(firstTopic);
        } else {
            const tutorial = tutorialsList.find(t => t._id === selectedTutorialId);
            const mod = tutorial ? (tutorial.modules || []).find(m => m._id === moduleId) : null;
            const firstTopic = mod && mod.topics && mod.topics[0] ? mod.topics[0]._id : '';
            setSelectedTopicId(firstTopic);
        }
    };

    const handleEditAttachTypeChange = (type) => {
        setEditAttachType(type);
        setEditSelectedCourseId('');
        setEditSelectedTutorialId('');
        setEditSelectedModuleId('');
        setEditSelectedTopicId('');
    };

    const handleEditModuleChange = (moduleId) => {
        setEditSelectedModuleId(moduleId);
        if (!moduleId) {
            setEditSelectedTopicId('');
            return;
        }
        if (typeCheckIsCourse(editAttachType)) {
            const course = coursesList.find(c => c._id === editSelectedCourseId);
            const mod = course ? (course.modules || []).find(m => m._id === moduleId) : null;
            const firstTopic = mod && mod.topics && mod.topics[0] ? mod.topics[0]._id : '';
            setEditSelectedTopicId(firstTopic);
        } else {
            const tutorial = tutorialsList.find(t => t._id === editSelectedTutorialId);
            const mod = tutorial ? (tutorial.modules || []).find(m => m._id === moduleId) : null;
            const firstTopic = mod && mod.topics && mod.topics[0] ? mod.topics[0]._id : '';
            setEditSelectedTopicId(firstTopic);
        }
    };

    const typeCheckIsCourse = (t) => t === 'course';


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

    // Fetch admin tutorials (populated with modules and topics)
    const fetchAdminTutorials = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/tutorials`, { ...authFetchOptions, method: 'GET' });
            if (res.ok) {
                const data = await res.json();
                setTutorialsList(data || []);
            } else {
                console.warn('Failed to fetch admin tutorials for notes selector');
            }
        } catch (err) {
            console.error('Error fetching admin tutorials:', err);
        }
    }, []);


    useEffect(() => { fetchNotes(1, false); }, [fetchNotes]);
    useEffect(() => { fetchAdminCourses(); fetchAdminTutorials(); }, [fetchAdminCourses, fetchAdminTutorials]);

    const fetchSanitizedPreview = async (html) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/util/sanitize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ html })
            });
            if (res.ok) {
                const d = await res.json();
                return d.html;
            }
        } catch (err) {
            console.warn('Preview sanitize failed', err);
        }
        return html;
    };

    const handleAddNote = async (e) => {
        e.preventDefault(); setIsLoading(true);
        //if (!adminToken) { setFormMessage({ type: 'error', text: 'Authentication token missing.' }); setIsLoading(false); return; }
        if (!newNote.title.trim() || !content.trim()) { setFormMessage({ type: 'error', text: 'Title and content are required for a new note.' }); setIsLoading(false); return; }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/notes`, { ...authFetchOptions, method: 'POST',  body: JSON.stringify({ ...newNote, content: content, format: 'html', topicId: selectedTopicId || null }) });
            
            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                logout(); 
                setIsLoading(false); 
                return;
            }

            const data = await response.json();
            
            if (response.ok) {
                setNotes([...notes, data]);
                setNewNote({ title: '', subject: '', content: '', imageUrl: '' });
                setContent('');
                setSelectedCourseId('');
                setSelectedTutorialId('');
                setSelectedModuleId('');
                setSelectedTopicId('');
                setAttachType('');
                setFormMessage({ type: 'success', text: 'Note added successfully!' });
            }
            
            else { setFormMessage({ type: 'error', text: data.msg || 'Failed to add note.' }); 
            //if (response.status === 401 || response.status === 403) logout(); 
        }
        } catch (error) { console.error('Error adding note:', error); setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to add note.' }); } finally { setIsLoading(false); }
    };

    // Open a full-page preview in a new tab/window.
    const openFullPagePreview = async (html) => {
        try {
            const rendered = await fetchSanitizedPreview(html || '');
            const w = window.open('', '_blank');
            if (!w) {
                setFormMessage({ type: 'error', text: 'Popup blocked. Allow popups to view full preview.' });
                return;
            }
            const baseStyles = `
                body { font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding: 24px; background: #fff; color: #111827; }
                img { max-width: 100%; height: auto; }
                pre { white-space: pre-wrap; word-wrap: break-word; }
                .md-code-card{border:1px solid rgba(0,0,0,.10);border-radius:10px;overflow:hidden;margin:10px 0}
                .md-code-card__header{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid rgba(0,0,0,.10);font-size:12px}
                .md-code-card__copy{padding:4px 8px;border-radius:8px;border:1px solid rgba(0,0,0,.14);background:transparent;cursor:pointer}
            `;
            const copyScript = `
                document.addEventListener('click', (e) => {
                  const btn = e.target && e.target.closest ? e.target.closest('[data-md-copy-btn="1"]') : null;
                  if (!btn) return;
                  const card = btn.closest('[data-md-code-card="1"]');
                  const codeEl = card ? card.querySelector('pre code') : null;
                  const text = codeEl ? codeEl.textContent : '';
                  if (!text || !navigator.clipboard) return;
                  navigator.clipboard.writeText(text).then(() => {
                    const prev = btn.textContent;
                    btn.textContent = 'Copied';
                    setTimeout(() => { btn.textContent = prev; }, 900);
                  }).catch(() => {});
                });
            `;
            // Write a minimal HTML document into the new window
            w.document.open();
            w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Note Preview</title><style>${baseStyles}</style></head><body>${rendered}<script>${copyScript}</script></body></html>`);
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
                    setEditingNote({ ...full, format: full.format || 'html' });
                    setContent(full.content || '');
                } else {
                    // fallback to provided note
                    setEditingNote({ ...note, format: note.format || 'html' });
                    setContent(note.content || '');
                }
            } catch (err) {
                console.warn('Failed to load full note, opening with provided note', err);
                setEditingNote({ ...note, format: note.format || 'html' });
                setContent(note.content || '');
            }
        })();
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
                            setEditSelectedTutorialId('');
                            setEditSelectedModuleId(mod._id);
                            setEditSelectedTopicId(topic._id);
                            setEditAttachType('course');
                            found = true; break;
                        }
                    }
                    if (found) break;
                }
                if (found) break;
            }
            if (!found) {
                for (const tutorial of tutorialsList || []) {
                    if (!tutorial.modules) continue;
                    for (const mod of tutorial.modules) {
                        if (!mod.topics) continue;
                        for (const topic of mod.topics) {
                            if (String(topic._id) === String(note.topicId)) {
                                setEditSelectedTutorialId(tutorial._id);
                                setEditSelectedCourseId('');
                                setEditSelectedModuleId(mod._id);
                                setEditSelectedTopicId(topic._id);
                                setEditAttachType('tutorial');
                                found = true; break;
                            }
                        }
                        if (found) break;
                    }
                    if (found) break;
                }
            }
            if (!found) {
                // fallback to heuristic detection
                const detected = autoDetectTopicForNote(note.content);
                if (detected) {
                    if (detected.courseId) {
                        setEditSelectedCourseId(detected.courseId);
                        setEditSelectedTutorialId('');
                        setEditAttachType('course');
                    } else if (detected.tutorialId) {
                        setEditSelectedTutorialId(detected.tutorialId);
                        setEditSelectedCourseId('');
                        setEditAttachType('tutorial');
                    }
                    setEditSelectedModuleId(detected.moduleId);
                    setEditSelectedTopicId(detected.topicId);
                } else {
                    setEditSelectedCourseId(''); setEditSelectedTutorialId(''); setEditSelectedModuleId(''); setEditSelectedTopicId('');
                    setEditAttachType('');
                }
            }
        } else {
            // Try to auto-detect attached topic based on content
            const detected = autoDetectTopicForNote(note.content);
            if (detected) {
                if (detected.courseId) {
                    setEditSelectedCourseId(detected.courseId);
                    setEditSelectedTutorialId('');
                    setEditAttachType('course');
                } else if (detected.tutorialId) {
                    setEditSelectedTutorialId(detected.tutorialId);
                    setEditSelectedCourseId('');
                    setEditAttachType('tutorial');
                }
                setEditSelectedModuleId(detected.moduleId);
                setEditSelectedTopicId(detected.topicId);
            } else {
                // reset edit selectors; admin can choose where to attach
                setEditSelectedCourseId('');
                setEditSelectedTutorialId('');
                setEditSelectedModuleId('');
                setEditSelectedTopicId('');
                setEditAttachType('');
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
                    const tNotes = (Array.isArray(topic.articles)
                        ? topic.articles.map(a => (a && a.content) ? String(a.content) : '').join('\n\n')
                        : '')
                        .replace(/\s+/g, ' ')
                        .trim();
                    if (!tNotes) continue;
                    // Exact match or substring match (use short snippet)
                    if (tNotes === normalized) return { courseId: course._id, moduleId: mod._id, topicId: topic._id };
                    const snippet = normalized.slice(0, 200);
                    if (tNotes.includes(snippet) || snippet.includes(tNotes.slice(0,200))) return { courseId: course._id, moduleId: mod._id, topicId: topic._id };
                }
            }
        }
        for (const tutorial of tutorialsList || []) {
            if (!tutorial.modules) continue;
            for (const mod of tutorial.modules) {
                if (!mod.topics) continue;
                for (const topic of mod.topics) {
                    const tNotes = (Array.isArray(topic.articles)
                        ? topic.articles.map(a => (a && a.content) ? String(a.content) : '').join('\n\n')
                        : '')
                        .replace(/\s+/g, ' ')
                        .trim();
                    if (!tNotes) continue;
                    // Exact match or substring match (use short snippet)
                    if (tNotes === normalized) return { tutorialId: tutorial._id, moduleId: mod._id, topicId: topic._id };
                    const snippet = normalized.slice(0, 200);
                    if (tNotes.includes(snippet) || snippet.includes(tNotes.slice(0,200))) return { tutorialId: tutorial._id, moduleId: mod._id, topicId: topic._id };
                }
            }
        }
        return null;
    };
    const handleImageFileChange = (e, target) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setFormMessage({ type: 'error', text: 'Please select an image file.' });
            return;
        }

        if (file.size > 4 * 1024 * 1024) {
            setFormMessage({ type: 'error', text: 'Image file size should be less than 4MB.' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (target === 'new') {
                setNewNote(prev => ({ ...prev, imageUrl: reader.result }));
            } else if (target === 'edit') {
                setEditingNote(prev => ({ ...prev, imageUrl: reader.result }));
            }
        };
        reader.readAsDataURL(file);
    };
    const handleEditChange = (e) => { const { name, value } = e.target; setEditingNote(prev => ({ ...prev, [name]: value })); };
    const handleContentChange = (next) => { setContent(next); };

    const handleUpdateNote = async (e) => {
        e.preventDefault(); setIsLoading(true);
        //if (!adminToken || !editingNote?._id) { setFormMessage({ type: 'error', text: 'Authentication token or note ID missing.' }); setIsLoading(false); return; }
        if (!editingNote.title.trim() || !String(editingNote.content || '').trim()) { setFormMessage({ type: 'error', text: 'Title and content are required for the note.' }); setIsLoading(false); return; }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/notes/${editingNote._id}`, { ...authFetchOptions, method: 'PUT', body: JSON.stringify({ ...editingNote, content: editingNote.content, format: 'html', topicId: editSelectedTopicId || editingNote.topicId || null }) });
            
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


    // Open snapshot modal to create a snapshot (or to create + continue publish)
    const createSnapshot = (noteId) => {
        if (!noteId) return;
        setSnapshotNoteId(noteId);
        setSnapshotDefaultLabel('Manual snapshot');
        setSnapshotDefaultReason('manual');
        // prepare sanitized preview for this note
        const note = notes.find(n => String(n._id) === String(noteId)) || (editingNote && String(editingNote._id) === String(noteId) ? { ...editingNote, content: editingNote.content } : null);
        if (note) {
            const fmt = (note.format || 'html');
            if (fmt === 'markdown') {
                setSnapshotPreviewHtml(renderMarkdownHtml(note.content || ''));
            } else {
                fetchSanitizedPreview(note.content || '').then(html => setSnapshotPreviewHtml(html)).catch(() => setSnapshotPreviewHtml(note.content || ''));
            }
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Row 1 Left: Select Course or Tutorial */}
                                    <div>
                                        <select value={attachType} onChange={(e)=>handleAttachTypeChange(e.target.value)} className="form-input w-full">
                                            <option value="">Select Course or Tutorial</option>
                                            <option value="course">Course</option>
                                            <option value="tutorial">Tutorial</option>
                                        </select>
                                    </div>

                                    {/* Row 1 Right: Select Course or Tutorial Item */}
                                    <div>
                                        {attachType === 'course' ? (
                                            <select value={selectedCourseId} onChange={(e)=>{ setSelectedCourseId(e.target.value); setSelectedTutorialId(''); setSelectedModuleId(''); setSelectedTopicId(''); }} className="form-input w-full">
                                                <option value="">Select Course</option>
                                                {coursesList.map(c => (<option key={c._id} value={c._id}>{c.title}</option>))}
                                            </select>
                                        ) : attachType === 'tutorial' ? (
                                            <select value={selectedTutorialId} onChange={(e)=>{ setSelectedTutorialId(e.target.value); setSelectedCourseId(''); setSelectedModuleId(''); setSelectedTopicId(''); }} className="form-input w-full">
                                                <option value="">Select Tutorial</option>
                                                {tutorialsList.map(t => (<option key={t._id} value={t._id}>{t.title}</option>))}
                                            </select>
                                        ) : (
                                            <select disabled className="form-input w-full cursor-not-allowed opacity-50">
                                                <option value="">Select Item</option>
                                            </select>
                                        )}
                                    </div>

                                    {/* Row 2 Left: Select Module */}
                                    <div>
                                        {attachType === 'course' && selectedCourseId ? (
                                            <select value={selectedModuleId} onChange={(e)=>handleModuleChange(e.target.value)} className="form-input w-full">
                                                <option value="">Select Course Module</option>
                                                {(coursesList.find(c=>c._id===selectedCourseId)?.modules || []).map(m => (<option key={m._id} value={m._id}>{m.title}</option>))}
                                            </select>
                                        ) : attachType === 'tutorial' && selectedTutorialId ? (
                                            <select value={selectedModuleId} onChange={(e)=>handleModuleChange(e.target.value)} className="form-input w-full">
                                                <option value="">Select Tutorial Module</option>
                                                {(tutorialsList.find(t=>t._id===selectedTutorialId)?.modules || []).map(m => (<option key={m._id} value={m._id}>{m.title}</option>))}
                                            </select>
                                        ) : (
                                            <select disabled className="form-input w-full cursor-not-allowed opacity-50">
                                                <option value="">Select Module</option>
                                            </select>
                                        )}
                                    </div>

                                    {/* Row 2 Right: Empty Spacer */}
                                    <div></div>
                                </div>
                            </div>
                            <div className="form-group"><label htmlFor="newNoteSubject" className="form-label">Subject</label><input type="text" id="newNoteSubject" name="subject" value={newNote.subject} onChange={(e) => setNewNote({ ...newNote, subject: e.target.value })} className="form-input" /></div>
                            <div className="form-group"><label htmlFor="newNoteContent" className="form-label">Content</label>
                                <QuillNoteEditor value={content} onChange={setContent} />
                                <div className="mt-2 flex items-center gap-2">
                                    <button type="button" className="admin-button-secondary" onClick={async () => { await openFullPagePreview(content); }}>Full Page</button>
                                    <span className="text-sm text-gray-400">Use Add Note to save</span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Note Image (Optional)</label>
                                <div className="flex flex-col gap-2">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => handleImageFileChange(e, 'new')} 
                                        className="form-input text-sm" 
                                    />
                                    <div className="text-center text-xs text-gray-400 font-semibold">— OR —</div>
                                    <input 
                                        type="text" 
                                        id="newNoteImageUrl" 
                                        name="imageUrl" 
                                        value={newNote.imageUrl.startsWith('data:image/') ? '' : newNote.imageUrl} 
                                        onChange={(e) => setNewNote({ ...newNote, imageUrl: e.target.value })} 
                                        className="form-input" 
                                        placeholder="Enter Image URL (e.g. https://example.com/image.jpg)" 
                                    />
                                </div>
                                {newNote.imageUrl && (
                                    <div className="mt-2 flex items-center gap-3 bg-gray-50 dark:bg-slate-900 p-2 rounded border border-dashed border-gray-300 dark:border-gray-700">
                                        <img 
                                            src={newNote.imageUrl} 
                                            alt="Preview" 
                                            className="w-16 h-16 object-cover rounded border" 
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {newNote.imageUrl.startsWith('data:image/') ? 'Uploaded Base64 Image' : newNote.imageUrl}
                                            </p>
                                            <button 
                                                type="button" 
                                                onClick={() => setNewNote(prev => ({ ...prev, imageUrl: '' }))} 
                                                className="text-xs text-red-650 dark:text-red-400 hover:underline font-bold mt-1"
                                            >
                                                Remove Image
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
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
                                                            <td className="admin-table-td admin-table-td-description" data-label="Content">{(() => {
                                                                const raw = note.snippet || note.content || '';
                                                                const isMd = (note.format === 'markdown');
                                                                const readable = isMd ? markdownToPlainText(raw) : htmlToPlainText(raw);
                                                                if (!readable) return '';
                                                                const short = readable.slice(0, 120);
                                                                return short + (readable.length > 120 ? '...' : '');
                                                            })()}</td>
                                    <td className="admin-table-td" data-label="Image">{note.imageUrl ? <img src={(note.imageUrl && (note.imageUrl.startsWith('http://') || note.imageUrl.startsWith('https://'))) ? `${API_BASE_URL}/admin/util/proxy?url=${encodeURIComponent(note.imageUrl)}` : note.imageUrl} alt="Note" className="admin-table-image" /> : 'N/A'}</td>
                                    <td className="admin-table-td" data-label="Last Updated">{new Date(note.updatedAt).toLocaleString()}</td>
                                    <td className="admin-table-td admin-table-actions">
                                        <button onClick={() => startEditingNote(note)} title="Edit" className="admin-action-button edit-button"><Edit size={18} /></button>
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
                                <QuillNoteEditor value={editingNote.content || ''} onChange={(val) => setEditingNote(prev => ({ ...prev, content: val }))} />
                                <div className="mt-2 flex items-center gap-2">
                                    <button type="button" className="admin-button-secondary" onClick={async () => { await openFullPagePreview(editingNote.content || ''); }}>Full Page</button>
                                    <span className="text-sm text-gray-400">Use Update Note to save</span>
                                </div>
                            </div>
                            <div className="form-group"><label className="form-label">Attach to (optional)</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Row 1 Left: Select Course or Tutorial */}
                                    <div>
                                        <select value={editAttachType} onChange={(e)=>handleEditAttachTypeChange(e.target.value)} className="form-input w-full">
                                            <option value="">Select Course or Tutorial</option>
                                            <option value="course">Course</option>
                                            <option value="tutorial">Tutorial</option>
                                        </select>
                                    </div>

                                    {/* Row 1 Right: Select Course or Tutorial Item */}
                                    <div>
                                        {editAttachType === 'course' ? (
                                            <select value={editSelectedCourseId} onChange={(e)=>{ setEditSelectedCourseId(e.target.value); setEditSelectedTutorialId(''); setEditSelectedModuleId(''); setEditSelectedTopicId(''); }} className="form-input w-full">
                                                <option value="">Select Course</option>
                                                {coursesList.map(c => (<option key={c._id} value={c._id}>{c.title}</option>))}
                                            </select>
                                        ) : editAttachType === 'tutorial' ? (
                                            <select value={editSelectedTutorialId} onChange={(e)=>{ setEditSelectedTutorialId(e.target.value); setEditSelectedCourseId(''); setEditSelectedModuleId(''); setEditSelectedTopicId(''); }} className="form-input w-full">
                                                <option value="">Select Tutorial</option>
                                                {tutorialsList.map(t => (<option key={t._id} value={t._id}>{t.title}</option>))}
                                            </select>
                                        ) : (
                                            <select disabled className="form-input w-full cursor-not-allowed opacity-50">
                                                <option value="">Select Item</option>
                                            </select>
                                        )}
                                    </div>

                                    {/* Row 2 Left: Select Module */}
                                    <div>
                                        {editAttachType === 'course' && editSelectedCourseId ? (
                                            <select value={editSelectedModuleId} onChange={(e)=>handleEditModuleChange(e.target.value)} className="form-input w-full">
                                                <option value="">Select Course Module</option>
                                                {(coursesList.find(c=>c._id===editSelectedCourseId)?.modules || []).map(m => (<option key={m._id} value={m._id}>{m.title}</option>))}
                                            </select>
                                        ) : editAttachType === 'tutorial' && editSelectedTutorialId ? (
                                            <select value={editSelectedModuleId} onChange={(e)=>handleEditModuleChange(e.target.value)} className="form-input w-full">
                                                <option value="">Select Tutorial Module</option>
                                                {(tutorialsList.find(t=>t._id===editSelectedTutorialId)?.modules || []).map(m => (<option key={m._id} value={m._id}>{m.title}</option>))}
                                            </select>
                                        ) : (
                                            <select disabled className="form-input w-full cursor-not-allowed opacity-50">
                                                <option value="">Select Module</option>
                                            </select>
                                        )}
                                    </div>

                                    {/* Row 2 Right: Empty Spacer */}
                                    <div></div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Note Image (Optional)</label>
                                <div className="flex flex-col gap-2">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => handleImageFileChange(e, 'edit')} 
                                        className="form-input text-sm" 
                                    />
                                    <div className="text-center text-xs text-gray-400 font-semibold">— OR —</div>
                                    <input 
                                        type="text" 
                                        id="editNoteImageUrl" 
                                        name="imageUrl" 
                                        value={editingNote.imageUrl && editingNote.imageUrl.startsWith('data:image/') ? '' : (editingNote.imageUrl || '')} 
                                        onChange={handleEditChange} 
                                        className="form-input" 
                                        placeholder="Enter Image URL (e.g. https://example.com/image.jpg)"
                                    />
                                </div>
                                {editingNote.imageUrl && (
                                    <div className="mt-2 flex items-center gap-3 bg-gray-50 dark:bg-slate-900 p-2 rounded border border-dashed border-gray-300 dark:border-gray-700">
                                        <img 
                                            src={editingNote.imageUrl} 
                                            alt="Preview" 
                                            className="w-16 h-16 object-cover rounded border" 
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {editingNote.imageUrl.startsWith('data:image/') ? 'Uploaded Base64 Image' : editingNote.imageUrl}
                                            </p>
                                            <button 
                                                type="button" 
                                                onClick={() => setEditingNote(prev => ({ ...prev, imageUrl: '' }))} 
                                                className="text-xs text-red-650 dark:text-red-400 hover:underline font-bold mt-1"
                                            >
                                                Remove Image
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="modal-actions-footer">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="modal-button-base modal-button-cancel">Cancel</button>
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
                        <div
                            className="modal-body"
                            onClick={(e) => {
                                const btn = e.target && e.target.closest ? e.target.closest('[data-md-copy-btn="1"]') : null;
                                if (!btn) return;
                                const card = btn.closest('[data-md-code-card="1"]');
                                const codeEl = card ? card.querySelector('pre code') : null;
                                const text = codeEl ? codeEl.textContent : '';
                                if (!text) return;
                                if (!navigator.clipboard) return;
                                navigator.clipboard.writeText(text).then(() => {
                                    const prev = btn.textContent;
                                    btn.textContent = 'Copied';
                                    setTimeout(() => { btn.textContent = prev; }, 900);
                                }).catch(() => {});
                            }}
                        >
                            <style>{`
                                .md-code-card{border:1px solid rgba(0,0,0,.10);border-radius:10px;overflow:hidden;margin:10px 0}
                                .md-code-card__header{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid rgba(0,0,0,.10);font-size:12px}
                                .md-code-card__lang{opacity:.8}
                                .md-code-card__copy{padding:4px 8px;border-radius:8px;border:1px solid rgba(0,0,0,.14);background:transparent;cursor:pointer}
                                .md-code-card__body pre{margin:0}
                            `}</style>
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
                                                                <div
                                                                    className="text-sm mb-2"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: (v && v.format === 'html')
                                                                            ? renderLegacyHtmlAsText((v.content || '').slice(0, 1500))
                                                                            : renderMarkdownHtml((() => {
                                                                                const raw = String(v.content || '');
                                                                                const short = raw.length > 1500 ? (raw.slice(0, 1500) + '\n\n…') : raw;
                                                                                return short;
                                                                            })()),
                                                                    }}
                                                                />
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
            {/** Snapshot modal for label/reason collection */}
            {snapshotModalOpen && (
                <SnapshotModal
                    show={snapshotModalOpen}
                    defaultLabel={snapshotDefaultLabel}
                    defaultReason={snapshotDefaultReason}
                    onCancel={() => { setSnapshotModalOpen(false); setSnapshotNoteId(null); setSnapshotOnDone(null); }}
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
                        }
                    }}
                />
            )}
        </>
    );
};

export default NoteManagement;