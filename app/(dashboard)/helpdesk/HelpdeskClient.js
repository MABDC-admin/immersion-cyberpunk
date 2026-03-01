"use client";

import { useState, useEffect } from 'react';

export default function HelpdeskClient({ session }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(null); // stores active ticket
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({ subject: '', priority: 'Normal', body: '' });
    const [replyText, setReplyText] = useState('');
    const [statusUpdate, setStatusUpdate] = useState('');

    const isAdmin = session?.user?.roles?.includes('Super Admin') || session?.user?.roles?.includes('HR Admin');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/tickets');
            if (res.ok) setTickets(await res.json());
        } catch (error) {
            console.error('Failed to fetch tickets', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                const newTicket = await res.json();
                setTickets([newTicket, ...tickets]);
                setShowCreateModal(false);
                setFormData({ subject: '', priority: 'Normal', body: '' });
            }
        } catch (error) {
            console.error('Failed to create ticket', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateTicket = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {};
            if (statusUpdate) payload.status = statusUpdate;
            if (replyText) {
                // Append reply to body
                const timeSt = new Date().toLocaleString();
                const updatedBody = (showViewModal.body || '') + `\n\n[${timeSt}] ${session.user.name}:\n${replyText}`;
                payload.body = updatedBody;
            }

            const res = await fetch(`/api/tickets/${showViewModal.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            if (res.ok) {
                const updatedTicket = await res.json();
                setTickets(tickets.map(t => t.id === showViewModal.id ? updatedTicket : t));
                setShowViewModal(null);
                setReplyText('');
                setStatusUpdate('');
            }
        } catch (error) {
            console.error('Failed to update ticket', error);
        } finally {
            setSubmitting(false);
        }
    };

    const getPriorityTheme = (prio) => {
        switch(prio) {
            case 'Low': return 'var(--info)';
            case 'High': return 'var(--warning)';
            case 'Urgent': return 'var(--danger)';
            default: return 'var(--success)';
        }
    };
    
    const getStatusTheme = (status) => {
        switch(status) {
            case 'Open': return 'var(--danger)';
            case 'In Progress': return 'var(--warning)';
            case 'Resolved': return 'var(--success)';
            case 'Closed': return 'var(--text-muted)';
            default: return 'var(--info)';
        }
    };

    return (
        <div className="page animate-fadeInUp">
            <div className="page-header">
                <div>
                    <h1 className="page-title">HR Helpdesk</h1>
                    <p className="page-subtitle">Submit and track support requests</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ New Ticket</button>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading tickets...</div>
                ) : tickets.length === 0 ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
                        <p>No active support tickets found.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Subject</th>
                                    <th>Requester</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map((t) => (
                                    <tr key={t.id}>
                                        <td style={{ color: 'var(--text-muted)' }}>#{t.id}</td>
                                        <td style={{ fontWeight: 500 }}>{t.subject}</td>
                                        <td>{t.createdBy?.displayName || 'Unknown'}</td>
                                        <td>
                                            <span style={{ color: getPriorityTheme(t.priority), fontSize: '12px', fontWeight: 600 }}>
                                                {t.priority}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge" style={{ background: 'transparent', border: `1px solid ${getStatusTheme(t.status)}`, color: getStatusTheme(t.status) }}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => { setShowViewModal(t); setStatusUpdate(t.status); }}>
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="modal-content glass-card animate-fadeInUp" style={{ maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '24px' }}>Create Support Ticket</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Subject</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <select
                                    className="form-input"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    required
                                >
                                    <option>Low</option>
                                    <option>Normal</option>
                                    <option>High</option>
                                    <option>Urgent</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    value={formData.body}
                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                    rows="4"
                                    placeholder="Explain your issue in detail..."
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View/Edit Modal */}
            {showViewModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="modal-content glass-card animate-fadeInUp" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ marginBottom: '4px' }}>Ticket #{showViewModal.id}</h2>
                                <h3 style={{ color: 'var(--text-secondary)', fontSize: '16px', fontWeight: 400 }}>{showViewModal.subject}</h3>
                            </div>
                            <span className="badge" style={{ background: 'transparent', border: `1px solid ${getStatusTheme(showViewModal.status)}`, color: getStatusTheme(showViewModal.status) }}>
                                {showViewModal.status}
                            </span>
                        </div>

                        <div className="form-group" style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', minHeight: '150px', whiteSpace: 'pre-wrap', fontSize: '13px', color: 'var(--text-secondary)', overflowY: 'auto' }}>
                            {showViewModal.body || 'No description provided.'}
                        </div>

                        <form onSubmit={handleUpdateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Add Reply</label>
                                <textarea
                                    className="form-input"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    rows="3"
                                    placeholder="Type your response here..."
                                />
                            </div>

                            {isAdmin && (
                                <div className="form-group">
                                    <label className="form-label">Update Status</label>
                                    <select
                                        className="form-input"
                                        value={statusUpdate}
                                        onChange={(e) => setStatusUpdate(e.target.value)}
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowViewModal(null)}>Close</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Updating...' : 'Post Reply & Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
