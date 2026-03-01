'use client';

import React, { useState, useEffect } from 'react';

export default function DisciplineClient({ employees, isAdmin, currentUser }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: '',
        type: 'Minor Warning',
        reason: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Active'
    });

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/discipline');
            if (res.ok) {
                const data = await res.json();
                setRecords(data);
            }
        } catch (error) {
            console.error('Failed to fetch records:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/discipline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({
                    employeeId: '',
                    type: 'Minor Warning',
                    reason: '',
                    date: new Date().toISOString().split('T')[0],
                    status: 'Active'
                });
                fetchRecords();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create record');
            }
        } catch (error) {
            console.error('Submit error:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this record? This action is permanent.')) return;
        try {
            const res = await fetch(`/api/discipline/${id}`, { method: 'DELETE' });
            if (res.ok) fetchRecords();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`/api/discipline/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) fetchRecords();
        } catch (error) {
            console.error('Update error:', error);
        }
    };

    if (loading) return <div className="page"><div className="loading">⚡ Loading Discipline Records...</div></div>;

    return (
        <div className="page">
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">🛡️ Discipline & Compliance</h1>
                    <p className="page-subtitle">Log and track employee warnings, PIPs, and infractions.</p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + Issue Warning
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {records.length === 0 ? (
                    <div className="stat-card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
                        <h3>No Discipline Records Found</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Everything looks clean!</p>
                    </div>
                ) : (
                    records.map(record => (
                        <div key={record.id} className="stat-card" style={{ 
                            borderLeft: `4px solid ${
                                record.type.includes('Termination') ? '#ef4444' : 
                                record.type.includes('Suspension') ? '#f59e0b' : 
                                record.type.includes('PIP') ? '#3b82f6' : '#10b981'
                            }`,
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                                        {record.type}
                                    </div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
                                        {isAdmin ? `${record.employee.firstName} ${record.employee.lastName}` : 'Your Record'}
                                    </h3>
                                    {isAdmin && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {record.employee.empNo}</div>}
                                </div>
                                <div style={{ 
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    fontSize: '10px', 
                                    fontWeight: 700,
                                    background: record.status === 'Active' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    color: record.status === 'Active' ? '#ef4444' : '#10b981',
                                    border: `1px solid ${record.status === 'Active' ? '#ef4444' : '#10b981'}`
                                }}>
                                    {record.status}
                                </div>
                            </div>
                            
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', fontStyle: 'italic' }}>
                                "{record.reason}"
                            </p>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                                <div>
                                    <div style={{ color: 'var(--text-muted)' }}>Issued On</div>
                                    <div style={{ color: 'var(--text-primary)' }}>{new Date(record.date).toLocaleDateString()}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: 'var(--text-muted)' }}>Issued By</div>
                                    <div style={{ color: 'var(--text-primary)' }}>{record.issuer.displayName}</div>
                                </div>
                            </div>

                            {isAdmin && (
                                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                                    {record.status === 'Active' && (
                                        <button 
                                            onClick={() => updateStatus(record.id, 'Resolved')}
                                            style={{ flex: 1, padding: '6px', fontSize: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Mark Resolved
                                        </button>
                                    )}
                                    {currentUser.roles.includes('Super Admin') && (
                                        <button 
                                            onClick={() => handleDelete(record.id)}
                                            style={{ padding: '6px 12px', fontSize: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    backdropFilter: 'blur(8px)'
                }}>
                    <div className="modal-content stat-card" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
                        <h2 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Issue New Warning</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Employee</label>
                                <select 
                                    className="input-field" 
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                >
                                    <option value="">Select Employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.empNo})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Type</label>
                                    <select 
                                        className="input-field"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    >
                                        <option>Minor Warning</option>
                                        <option>Major Warning</option>
                                        <option>PIP (Performance Improvement Plan)</option>
                                        <option>Suspension</option>
                                        <option>Termination Warning</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Effective Date</label>
                                    <input 
                                        type="date" 
                                        className="input-field"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Reason / Infraction Details</label>
                                <textarea 
                                    className="input-field" 
                                    rows="4"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    placeholder="Enter detailed reason for the disciplinary action..."
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Confirm Issuance</button>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .loading {
                    color: var(--primary);
                    text-align: center;
                    padding: 50px;
                    font-size: 1.2rem;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
}
