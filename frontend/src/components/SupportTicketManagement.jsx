import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Clock, CheckCircle, AlertCircle, Eye, X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import './AdminDashboard.css';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

export default function SupportTicketManagement() {
    const showToast = useToast();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTickets, setTotalTickets] = useState(0);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [resolvingId, setResolvingId] = useState(null);

    const limit = 10;

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/support-tickets?page=${page}&limit=${limit}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            const data = await response.json();
            if (response.ok) {
                setTickets(data.tickets || []);
                setTotalPages(data.totalPages || 1);
                setTotalTickets(data.totalTickets || 0);
            } else {
                setError(data.msg || 'Failed to load support tickets.');
            }
        } catch (err) {
            console.error('Error fetching support tickets:', err);
            setError('Connection error. Could not retrieve support tickets.');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleResolve = async (ticketId) => {
        if (resolvingId) return;
        setResolvingId(ticketId);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/support-tickets/${ticketId}/resolve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            const data = await response.json();
            if (response.ok) {
                showToast('Ticket marked as resolved successfully!', 'success');
                // Update local ticket state
                setTickets(prevTickets =>
                    prevTickets.map(t =>
                        t._id === ticketId ? { ...t, status: 'resolved', resolvedAt: data.ticket.resolvedAt } : t
                    )
                );
                // Also update selectedTicket modal state if it's currently open
                if (selectedTicket && selectedTicket._id === ticketId) {
                    setSelectedTicket(prev => ({ ...prev, status: 'resolved', resolvedAt: data.ticket.resolvedAt }));
                }
            } else {
                showToast(data.msg || 'Failed to resolve support ticket.', 'error');
            }
        } catch (err) {
            console.error('Error resolving ticket:', err);
            showToast('Connection error. Failed to resolve ticket.', 'error');
        } finally {
            setResolvingId(null);
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }) + ' ' + date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="support-tickets-management">
            <h3 className="admin-section-title">
                <HelpCircle size={20} /> Support Tickets Management
            </h3>

            {error && (
                <div className="admin-message-box admin-message-error mb-4">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                    Loading support tickets...
                </div>
            ) : tickets.length === 0 ? (
                <div className="admin-message-info p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    No support tickets found.
                </div>
            ) : (
                <>
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead className="admin-table-thead">
                                <tr>
                                    <th className="admin-table-th rounded-tl-lg">User</th>
                                    <th className="admin-table-th">Message</th>
                                    <th className="admin-table-th">Submitted At</th>
                                    <th className="admin-table-th">Status</th>
                                    <th className="admin-table-th">Resolved At</th>
                                    <th className="admin-table-th rounded-tr-lg">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((ticket) => (
                                    <tr key={ticket._id} className="admin-table-tr">
                                        <td className="admin-table-td" data-label="User">
                                            <div className="font-semibold text-gray-900 dark:text-white">{ticket.username}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                <Mail size={12} />
                                                <span>{ticket.email}</span>
                                            </div>
                                        </td>
                                        <td className="admin-table-td" data-label="Message">
                                            <div className="max-w-xs truncate text-gray-700 dark:text-gray-300">
                                                {ticket.message}
                                            </div>
                                            <button
                                                onClick={() => setSelectedTicket(ticket)}
                                                className="text-teal-600 dark:text-teal-400 hover:underline text-xs font-semibold flex items-center gap-1 mt-1 border-none bg-none p-0 cursor-pointer"
                                            >
                                                <Eye size={12} /> Read Full Message
                                            </button>
                                        </td>
                                        <td className="admin-table-td" data-label="Submitted At">
                                            <div className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                                <Clock size={14} className="text-gray-400" />
                                                <span>{formatDateTime(ticket.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="admin-table-td" data-label="Status">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                ticket.status === 'resolved'
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${ticket.status === 'resolved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                {ticket.status === 'resolved' ? 'Resolved' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="admin-table-td" data-label="Resolved At">
                                            {ticket.status === 'resolved' ? (
                                                <div className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                                    <CheckCircle size={14} className="text-emerald-500" />
                                                    <span>{formatDateTime(ticket.resolvedAt)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500">—</span>
                                            )}
                                        </td>
                                        <td className="admin-table-td" data-label="Action">
                                            {ticket.status !== 'resolved' ? (
                                                <button
                                                    onClick={() => handleResolve(ticket._id)}
                                                    disabled={resolvingId === ticket._id}
                                                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800/50 text-white text-xs font-semibold rounded-lg shadow transition-colors border-none cursor-pointer flex items-center gap-1"
                                                >
                                                    {resolvingId === ticket._id ? 'Resolving...' : 'Resolve'}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                                    <CheckCircle size={14} className="text-emerald-500" /> Done
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <button
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={page === 1}
                                className="pagination-btn"
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={16} />
                                <span>Previous</span>
                            </button>
                            
                            <div className="pagination-pages">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`pagination-page-btn ${page === pageNum ? 'active' : ''}`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={page === totalPages}
                                className="pagination-btn"
                                aria-label="Next page"
                            >
                                <span>Next</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Read Message Modal */}
            {selectedTicket && (
                <div className="modal-overlay">
                    <div className="modal-content-box" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title flex items-center gap-2">
                                <HelpCircle className="text-teal-500" size={20} />
                                <span>Support Request Details</span>
                            </h3>
                            <button onClick={() => setSelectedTicket(null)} className="modal-close-button border-none bg-none p-1 rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="modal-body p-4 space-y-4" style={{ color: 'var(--color-text-light)' }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <div>
                                    <span className="text-xs text-gray-400 uppercase tracking-wider block">Submitted By</span>
                                    <span className="font-semibold text-sm block mt-0.5">{selectedTicket.username}</span>
                                    <span className="text-xs text-gray-500 block">{selectedTicket.email}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase tracking-wider block">Ticket Status</span>
                                    <div className="mt-1">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                            selectedTicket.status === 'resolved'
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        }`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${selectedTicket.status === 'resolved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            {selectedTicket.status === 'resolved' ? 'Resolved' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 uppercase tracking-wider block">Date/Time Submitted</span>
                                    <span className="text-sm block mt-0.5">{formatDateTime(selectedTicket.createdAt)}</span>
                                </div>
                                {selectedTicket.status === 'resolved' && (
                                    <div>
                                        <span className="text-xs text-gray-400 uppercase tracking-wider block">Date/Time Resolved</span>
                                        <span className="text-sm block mt-0.5">{formatDateTime(selectedTicket.resolvedAt)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2">
                                <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Message Description</span>
                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800">
                                    {selectedTicket.message}
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions-footer flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                            {selectedTicket.status !== 'resolved' && (
                                <button
                                    onClick={() => handleResolve(selectedTicket._id)}
                                    disabled={resolvingId === selectedTicket._id}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800/50 text-white text-sm font-semibold rounded-lg shadow border-none cursor-pointer"
                                >
                                    {resolvingId === selectedTicket._id ? 'Resolving...' : 'Resolve Ticket'}
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-lg border-none cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Pagination CSS Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                .support-tickets-management {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                }
                .pagination-container {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-top: 1.5rem;
                    padding: 1rem 0;
                    border-top: 1px solid var(--color-gray-200);
                }
                html.dark .pagination-container {
                    border-top-color: var(--color-gray-700);
                }
                .pagination-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.5rem 1rem;
                    background-color: white;
                    border: 1px solid var(--color-gray-300);
                    border-radius: 0.5rem;
                    color: var(--color-gray-700);
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                html.dark .pagination-btn {
                    background-color: var(--color-gray-800);
                    border-color: var(--color-gray-750);
                    color: var(--color-gray-200);
                }
                .pagination-btn:hover:not(:disabled) {
                    background-color: var(--color-gray-50);
                    border-color: var(--color-gray-400);
                }
                html.dark .pagination-btn:hover:not(:disabled) {
                    background-color: var(--color-gray-700);
                    border-color: var(--color-gray-500);
                }
                .pagination-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .pagination-pages {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .pagination-page-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 2.25rem;
                    height: 2.25rem;
                    padding: 0.25rem;
                    background-color: white;
                    border: 1px solid var(--color-gray-300);
                    border-radius: 0.5rem;
                    color: var(--color-gray-700);
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                html.dark .pagination-page-btn {
                    background-color: var(--color-gray-800);
                    border-color: var(--color-gray-750);
                    color: var(--color-gray-200);
                }
                .pagination-page-btn:hover:not(.active) {
                    background-color: var(--color-gray-50);
                    border-color: var(--color-gray-400);
                }
                html.dark .pagination-page-btn:hover:not(.active) {
                    background-color: var(--color-gray-700);
                    border-color: var(--color-gray-500);
                }
                .pagination-page-btn.active {
                    background-color: var(--color-teal-600);
                    border-color: var(--color-teal-600);
                    color: white;
                }
            `}} />
        </div>
    );
}
