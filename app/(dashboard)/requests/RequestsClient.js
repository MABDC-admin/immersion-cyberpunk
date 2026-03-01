"use client";

import { useState, useEffect } from 'react';

const requestTypes = [
    'Salary Certificate (Addressed to Bank)',
    'Salary Certificate (General)',
    'No Objection Certificate (NOC) for Travel',
    'No Objection Certificate (NOC) for Visa',
    'Experience Certificate',
    'Other Letter Request'
];

export default function RequestsClient() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ type: requestTypes[0], description: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/requests');
            if (res.ok) {
                setRequests(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch requests', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                const newReq = await res.json();
                setRequests([newReq, ...requests]);
                setShowModal(false);
                setFormData({ type: requestTypes[0], description: '' });
            }
        } catch (error) {
            console.error('Failed to submit request', error);
        } finally {
            setSubmitting(false);
        }
    };

    const statusColors = {
        'Pending': 'badge-warning',
        'Approved': 'badge-success',
        'Rejected': 'badge-danger',
        'Completed': 'badge-primary'
    };

    return (
        <div className="page animate-fadeInUp">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Requests</h1>
                    <p className="page-subtitle">Request official HR documents and letters</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Request</button>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading requests...</div>
                ) : requests.length === 0 ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                        <p>You haven't made any document requests yet.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Request Type</th>
                                    <th>Date Submitted</th>
                                    <th>Notes/Description</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req) => (
                                    <tr key={req.id}>
                                        <td style={{ fontWeight: 500 }}>{req.type}</td>
                                        <td>{new Date(req.requestDate).toLocaleDateString()}</td>
                                        <td style={{ color: 'var(--text-secondary)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {req.description || '—'}
                                        </td>
                                        <td><span className={`badge ${statusColors[req.status] || 'badge-neutral'}`}>{req.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card animate-fadeInUp" style={{ maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '24px' }}>New Document Request</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            <div className="form-group">
                                <label className="form-label">Document Type</label>
                                <select
                                    className="form-input"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    required
                                >
                                    {requestTypes.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Additional Details / To Whom It May Concern</label>
                                <textarea
                                    className="form-input"
                                    rows="4"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="E.g. Please address this salary certificate to Emirates NBD..."
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
