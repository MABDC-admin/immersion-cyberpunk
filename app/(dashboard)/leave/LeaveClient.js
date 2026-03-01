'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LeaveClient({ leaveRequests: initial, leaveTypes, isAdmin, currentEmployeeId }) {
    const [requests, setRequests] = useState(initial);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('ALL');
    const [form, setForm] = useState({
        leaveTypeId: leaveTypes[0]?.id || '',
        startDate: '',
        endDate: '',
        reason: '',
    });
    const router = useRouter();

    const filtered = filter === 'ALL'
        ? requests
        : requests.filter((r) => r.status === filter);

    const calcDays = (start, end) => {
        if (!start || !end) return 0;
        const s = new Date(start);
        const e = new Date(end);
        return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const days = calcDays(form.startDate, form.endDate);
        const res = await fetch('/api/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employeeId: currentEmployeeId,
                leaveTypeId: parseInt(form.leaveTypeId),
                startDate: form.startDate,
                endDate: form.endDate,
                days,
                reason: form.reason,
            }),
        });
        if (res.ok) {
            setShowModal(false);
            router.refresh();
            const created = await res.json();
            setRequests([created, ...requests]);
        }
    };

    const handleAction = async (id, status) => {
        const res = await fetch(`/api/leave/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (res.ok) {
            setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this leave request?')) return;
        try {
            const res = await fetch(`/api/leave/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRequests(requests.filter(r => r.id !== id));
            } else {
                alert('Failed to delete leave request');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const statusCounts = {
        ALL: requests.length,
        PENDING: requests.filter(r => r.status === 'PENDING').length,
        APPROVED: requests.filter(r => r.status === 'APPROVED').length,
        REJECTED: requests.filter(r => r.status === 'REJECTED').length,
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🏖️ {isAdmin ? 'Leave Management' : 'My Leaves'}</h1>
                    <p className="page-subtitle">
                        {isAdmin ? 'Review and manage team leave requests' : 'Submit and track your leave requests'}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ＋ Request Leave
                </button>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {Object.entries(statusCounts).map(([key, count]) => (
                    <button
                        key={key}
                        className={`btn ${filter === key ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                        onClick={() => setFilter(key)}
                    >
                        {key} ({count})
                    </button>
                ))}
            </div>

            {/* Leave Requests Table */}
            <div className="data-table-wrapper animate-fadeInUp">
                <table className="data-table">
                    <thead>
                        <tr>
                            {isAdmin && <th>Employee</th>}
                            <th>Type</th>
                            <th>Dates</th>
                            <th>Days</th>
                            <th>Reason</th>
                            <th>Status</th>
                            {isAdmin && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((lr) => (
                            <tr key={lr.id}>
                                {isAdmin && (
                                    <td style={{ fontWeight: 600 }}>
                                        {lr.employee?.firstName} {lr.employee?.lastName}
                                    </td>
                                )}
                                <td>{lr.leaveType?.name || 'N/A'}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>
                                    {lr.startDate} → {lr.endDate}
                                </td>
                                <td style={{ fontWeight: 700 }}>{lr.days}</td>
                                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {lr.reason || '—'}
                                </td>
                                <td>
                                    <span className={`badge ${lr.status === 'APPROVED' ? 'badge-success' :
                                            lr.status === 'REJECTED' ? 'badge-danger' :
                                                'badge-warning'
                                        }`}>
                                        {lr.status}
                                    </span>
                                </td>
                                {isAdmin && (
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {lr.status === 'PENDING' && (
                                                <>
                                                    <button className="btn btn-success btn-sm"
                                                        onClick={() => handleAction(lr.id, 'APPROVED')}>
                                                        ✓
                                                    </button>
                                                    <button className="btn btn-warning btn-sm"
                                                        onClick={() => handleAction(lr.id, 'REJECTED')}>
                                                        ✕
                                                    </button>
                                                </>
                                            )}
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(lr.id)}>Delete</button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <div className="empty-state-text">No leave requests</div>
                    </div>
                )}
            </div>

            {/* Request Leave Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">🏖️ Request Leave</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Leave Type</label>
                                <select className="form-select" value={form.leaveTypeId}
                                    onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })} required>
                                    {leaveTypes.map((lt) => (
                                        <option key={lt.id} value={lt.id}>
                                            {lt.name} ({lt.maxDays} days max, {lt.isPaid ? 'Paid' : 'Unpaid'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input className="form-input" type="date" value={form.startDate}
                                        onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date</label>
                                    <input className="form-input" type="date" value={form.endDate}
                                        onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                                </div>
                            </div>
                            {form.startDate && form.endDate && (
                                <div className="badge badge-info" style={{ marginBottom: '16px', fontSize: '13px', padding: '8px 16px' }}>
                                    Duration: {calcDays(form.startDate, form.endDate)} day(s)
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Reason</label>
                                <textarea className="form-textarea" value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    placeholder="Briefly describe the reason..." />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
