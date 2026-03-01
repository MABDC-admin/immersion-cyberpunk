'use client';

import { useState, useEffect } from 'react';

export default function LeaveTab({ employeeId }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/leave?employeeId=${employeeId}`)
            .then(res => res.json())
            .then(data => {
                setRequests(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [employeeId]);

    if (loading) return <div style={{ padding: '20px', color: 'var(--cyber-teal)' }}>Loading leave requests...</div>;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Approved': return 'badge-success';
            case 'Rejected': return 'badge-danger';
            case 'Pending': return 'badge-warning';
            default: return 'badge-info';
        }
    };

    return (
        <div className="animate-fadeInUp">
            <h3 style={{ color: 'var(--cyber-cyan)', fontSize: '18px', marginBottom: '20px', letterSpacing: '1px' }}>
                🏖️ Leave & Time-Off Requests
            </h3>
            
            {requests.length === 0 ? (
                <div style={{ padding: '30px', background: 'rgba(0, 243, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No leave requests on file.
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Leave Type</th>
                                <th>Duration</th>
                                <th>Status</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id}>
                                    <td style={{ color: '#fff', fontWeight: 600 }}>{req.leaveType?.name || 'Standard'}</td>
                                    <td style={{ fontSize: '13px' }}>
                                        <div style={{ color: 'var(--cyber-teal)' }}>{req.startDate} ➔ {req.endDate}</div>
                                        <div style={{ color: 'var(--text-muted)' }}>{req.totalDays} Days</div>
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(req.status)}`}>{req.status}</span>
                                    </td>
                                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>
                                        {req.reason || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
