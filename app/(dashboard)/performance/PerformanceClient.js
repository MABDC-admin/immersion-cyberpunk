"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PerformanceClient({ activeEmployees }) {
    const router = useRouter();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        revieweeId: '',
        reviewerId: '',
        period: '',
        rating: 3,
        comments: '',
        goals: '',
        status: 'Draft'
    });

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await fetch('/api/performance');
            if (res.ok) {
                setReviews(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch reviews', error);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingReview(null);
        setForm({
            revieweeId: activeEmployees[0]?.id || '',
            reviewerId: activeEmployees[0]?.id || '',
            period: `Q1 ${new Date().getFullYear()}`,
            rating: 3,
            comments: '',
            goals: '',
            status: 'Draft'
        });
        setError('');
        setShowModal(true);
    };

    const openEdit = (review) => {
        setEditingReview(review);
        setForm({
            revieweeId: review.revieweeId,
            reviewerId: review.reviewerId,
            period: review.period,
            rating: review.rating,
            comments: review.comments || '',
            goals: review.goals || '',
            status: review.status
        });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const url = editingReview ? `/api/performance/${editingReview.id}` : '/api/performance';
            const method = editingReview ? 'PUT' : 'POST';

            const payload = {
                ...form,
                revieweeId: parseInt(form.revieweeId),
                reviewerId: parseInt(form.reviewerId)
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Failed to ${editingReview ? 'update' : 'create'} review`);
            }

            const savedReview = await res.json();
            
            if (editingReview) {
                setReviews(reviews.map(r => r.id === savedReview.id ? savedReview : r));
            } else {
                setReviews([savedReview, ...reviews]);
            }
            
            setShowModal(false);
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this performance review? This action cannot be undone.')) return;
        
        try {
            const res = await fetch(`/api/performance/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete review');
            
            setReviews(reviews.filter(r => r.id !== id));
            router.refresh();
        } catch (error) {
            alert(error.message);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Acknowledged': return <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--info)' }}>Acknowledged</span>;
            case 'Submitted': return <span className="badge badge-success" style={{ background: 'var(--success-alpha)', color: 'var(--success)' }}>Submitted</span>;
            case 'Draft':
            default: return <span className="badge badge-neutral" style={{ background: 'rgba(255,255,255,0.1)' }}>Draft</span>;
        }
    };

    return (
        <div className="page animate-fadeInUp">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Performance Management</h1>
                    <p className="page-subtitle">Schedule and record employee performance evaluations</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>+ New Review</button>
            </div>

            <div className="data-table-wrapper animate-fadeInUp">
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</div>
                ) : reviews.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div className="empty-state-text">No performance reviews found.</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Reviewee</th>
                                <th>Reviewer</th>
                                <th>Rating</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map((review) => (
                                <tr key={review.id}>
                                    <td style={{ fontWeight: 600 }}>{review.period}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {review.reviewee?.avatarUrl ? (
                                                <img src={review.reviewee.avatarUrl} alt="Avatar" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-primary)' }}>
                                                    {review.reviewee?.firstName?.[0] || 'U'}
                                                </div>
                                            )}
                                            <span style={{ color: 'var(--text-primary)' }}>
                                                {review.reviewee?.firstName} {review.reviewee?.lastName}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ color: 'var(--text-muted)' }}>
                                            {review.reviewer?.firstName} {review.reviewer?.lastName}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ color: 'var(--cyber-teal)', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                            {review.rating} / 5
                                        </span>
                                    </td>
                                    <td>{getStatusBadge(review.status)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(review)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(review.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card animate-fadeInUp" style={{ maxWidth: '600px' }}>
                        <h2 style={{ marginBottom: '24px' }}>{editingReview ? 'Edit Performance Review' : 'Create Performance Review'}</h2>

                        {error && (
                            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Reviewee (Employee)</label>
                                    <select
                                        className="form-input"
                                        value={form.revieweeId}
                                        onChange={(e) => setForm({ ...form, revieweeId: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>Select Employee</option>
                                        {activeEmployees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.empNo || 'N/A'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reviewer (Manager/HR)</label>
                                    <select
                                        className="form-input"
                                        value={form.reviewerId}
                                        onChange={(e) => setForm({ ...form, reviewerId: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>Select Reviewer</option>
                                        {activeEmployees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Period</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={form.period}
                                        onChange={(e) => setForm({ ...form, period: e.target.value })}
                                        placeholder="e.g. Q1 2026 or Annual 2025"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Rating (1-5)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        className="form-input"
                                        value={form.rating}
                                        onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-input"
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        required
                                    >
                                        <option value="Draft">Draft</option>
                                        <option value="Submitted">Submitted</option>
                                        <option value="Acknowledged">Acknowledged</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Goals for next period</label>
                                <textarea
                                    className="form-input"
                                    rows="2"
                                    value={form.goals}
                                    onChange={(e) => setForm({ ...form, goals: e.target.value })}
                                    placeholder="Set objectives..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Manager Comments</label>
                                <textarea
                                    className="form-input"
                                    rows="4"
                                    value={form.comments}
                                    onChange={(e) => setForm({ ...form, comments: e.target.value })}
                                    placeholder="Detailed feedback..."
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : (editingReview ? 'Update Review' : 'Save Review')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
