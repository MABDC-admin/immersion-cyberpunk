"use client";

import { useState, useEffect } from 'react';

export default function PerformanceTab({ employeeId }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (employeeId) {
            fetchReviews();
        }
    }, [employeeId]);

    const fetchReviews = async () => {
        try {
            const res = await fetch(`/api/performance?employeeId=${employeeId}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            }
        } catch (error) {
            console.error('Failed to fetch performance reviews:', error);
        } finally {
            setLoading(false);
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

    if (loading) {
        return (
            <div className="animate-fadeInUp" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading performance records...
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="animate-fadeInUp" style={{ padding: '60px 40px', textAlign: 'center', border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>⭐</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No Performance Reviews Found</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.5 }}>
                    This employee does not have any historical performance reviews on file.
                </p>
            </div>
        );
    }

    return (
        <div className="animate-fadeInUp">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--cyber-cyan)', margin: 0 }}>Historical Performance</h2>
            </div>
            
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Period</th>
                            <th>Role in Review</th>
                            <th>Counterparty</th>
                            <th>Rating</th>
                            <th>Status</th>
                            <th>Comments / Goals</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.map(review => {
                            // Determine if this employee was the reviewee or the reviewer
                            const isReviewee = review.revieweeId === employeeId;
                            const roleLabel = isReviewee ? 'Evaluated Employee' : 'Manager / Reviewer';
                            const counterparty = isReviewee ? review.reviewer : review.reviewee;

                            return (
                                <tr key={review.id}>
                                    <td style={{ fontWeight: 600 }}>{review.period}</td>
                                    <td>
                                        <span className="badge" style={{ background: isReviewee ? 'rgba(56, 189, 248, 0.1)' : 'rgba(244, 114, 182, 0.1)', color: isReviewee ? 'var(--info)' : 'var(--accent)' }}>
                                            {roleLabel}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {counterparty?.avatarUrl ? (
                                                <img src={counterparty.avatarUrl} alt="Avatar" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-primary)' }}>
                                                    {counterparty?.firstName?.[0] || 'U'}
                                                </div>
                                            )}
                                            <span style={{ color: 'var(--text-primary)' }}>
                                                {counterparty?.firstName} {counterparty?.lastName}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ color: 'var(--cyber-teal)', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                            {review.rating} / 5
                                        </span>
                                    </td>
                                    <td>{getStatusBadge(review.status)}</td>
                                    <td style={{ maxWidth: '300px' }}>
                                        {review.goals && (
                                            <div style={{ marginBottom: '8px' }}>
                                                <strong style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Goals:</strong><br/>
                                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{review.goals}</span>
                                            </div>
                                        )}
                                        {review.comments && (
                                            <div>
                                                <strong style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Comments:</strong><br/>
                                                <span style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{review.comments}</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
