'use client';

import React, { useState, useEffect } from 'react';

export default function OffboardingClient({ employees, currentUser }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [formData, setFormData] = useState({
        employeeId: '',
        resignationDate: new Date().toISOString().split('T')[0],
        lastWorkingDay: '',
        isTerminated: false,
        reason: '',
        settlement: 0
    });

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/offboarding');
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

    const handleInitiate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/offboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({
                    employeeId: '',
                    resignationDate: new Date().toISOString().split('T')[0],
                    lastWorkingDay: '',
                    isTerminated: false,
                    reason: '',
                    settlement: 0
                });
                fetchRecords();
            }
        } catch (error) {
            console.error('Initiate error:', error);
        }
    };

    const updateChecklistItem = async (record, itemIndex, newStatus) => {
        const checklist = JSON.parse(record.checklist);
        checklist[itemIndex].status = newStatus;
        
        try {
            const res = await fetch(`/api/offboarding/${record.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checklist })
            });
            if (res.ok) fetchRecords();
        } catch (error) {
            console.error('Update checklist error:', error);
        }
    };

    const handleComplete = async (id) => {
        if (!confirm('Are you sure you want to finalize this offboarding? The employee status will be set to Inactive.')) return;
        try {
            const res = await fetch(`/api/offboarding/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Completed' })
            });
            if (res.ok) fetchRecords();
        } catch (error) {
            console.error('Finalize error:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Permanently delete this offboarding record?')) return;
        try {
            const res = await fetch(`/api/offboarding/${id}`, { method: 'DELETE' });
            if (res.ok) fetchRecords();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    if (loading) return <div className="page"><div className="loading">⏳ Synchronizing Terminal Data...</div></div>;

    return (
        <div className="page">
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">👋 Offboarding & Clearance</h1>
                    <p className="page-subtitle">Manage employee exits, property returns, and final settlements.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + Initiate Exit
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {records.length === 0 ? (
                    <div className="stat-card" style={{ textAlign: 'center', padding: '60px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎐</div>
                        <h3>No Active Offboarding Threads</h3>
                        <p style={{ color: 'var(--text-muted)' }}>The workforce is stable.</p>
                    </div>
                ) : (
                    records.map(record => {
                        const checklist = JSON.parse(record.checklist || '[]');
                        const completedItems = checklist.filter(i => i.status === 'Completed').length;
                        const progress = checklist.length > 0 ? (completedItems / checklist.length) * 100 : 0;

                        return (
                            <div key={record.id} className="stat-card" style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                                    <div style={{ flex: 1, minWidth: '300px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                            <div style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: record.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: record.status === 'Completed' ? '#10b981' : '#3b82f6', border: `1px solid ${record.status === 'Completed' ? '#10b981' : '#3b82f6'}` }}>
                                                {record.status.toUpperCase()}
                                            </div>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {record.isTerminated ? '⚠️ Termination' : '📄 Resignation'}
                                            </span>
                                        </div>
                                        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
                                            {record.employee.firstName} {record.employee.lastName}
                                        </h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                                            {record.employee.empNo} · {record.employee.department?.name}
                                        </p>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                            <div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Notice Date</div>
                                                <div>{record.resignationDate ? new Date(record.resignationDate).toLocaleDateString() : 'N/A'}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last Working Day</div>
                                                <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{record.lastWorkingDay ? new Date(record.lastWorkingDay).toLocaleDateString() : 'Pending'}</div>
                                            </div>
                                            <div style={{ gridColumn: '1/-1' }}>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reason</div>
                                                <div style={{ fontSize: '14px', fontStyle: 'italic' }}>{record.reason || 'No details provided.'}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            {record.status !== 'Completed' && (
                                                <button className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '12px' }} onClick={() => handleComplete(record.id)}>
                                                    Mark as Fully Cleared
                                                </button>
                                            )}
                                            {currentUser.roles.includes('Super Admin') && (
                                                <button className="btn btn-secondary" style={{ padding: '8px 20px', fontSize: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }} onClick={() => handleDelete(record.id)}>
                                                    Delete Record
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ flex: 1, minWidth: '350px', background: 'rgba(0,243,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Clearance Checklist</h3>
                                            <span style={{ fontSize: '12px', color: 'var(--primary)' }}>{completedItems} / {checklist.length}</span>
                                        </div>
                                        
                                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '20px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {checklist.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                                    <span style={{ fontSize: '13px', color: item.status === 'Completed' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: item.status === 'Completed' ? 'line-through' : 'none' }}>
                                                        {item.item}
                                                    </span>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        {item.status === 'Pending' ? (
                                                            <button 
                                                                onClick={() => updateChecklistItem(record, idx, 'Completed')}
                                                                style={{ padding: '4px 8px', fontSize: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', borderRadius: '4px' }}
                                                            >
                                                                Verify
                                                            </button>
                                                        ) : (
                                                            <div style={{ color: '#10b981', fontSize: '12px' }}>✓ Cleared</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
                    <div className="modal-content stat-card" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
                        <h2 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Initiate Offboarding</h2>
                        <form onSubmit={handleInitiate}>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Employee</label>
                                <select className="input-field" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} required style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                    <option value="">Select Employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.empNo})</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Separation Type</label>
                                    <select className="input-field" value={formData.isTerminated} onChange={(e) => setFormData({ ...formData, isTerminated: e.target.value === 'true' })} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                        <option value="false">Resignation</option>
                                        <option value="true">Termination</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Settlement (AED)</label>
                                    <input type="number" className="input-field" value={formData.settlement} onChange={(e) => setFormData({ ...formData, settlement: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Notice Date</label>
                                    <input type="date" className="input-field" value={formData.resignationDate} onChange={(e) => setFormData({ ...formData, resignationDate: e.target.value })} required style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Last Working Day</label>
                                    <input type="date" className="input-field" value={formData.lastWorkingDay} onChange={(e) => setFormData({ ...formData, lastWorkingDay: e.target.value })} required style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Reason / Remarks</label>
                                <textarea className="input-field" rows="3" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Confirm Exit Thread</button>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                .loading { color: var(--primary); text-align: center; padding: 50px; font-size: 1.2rem; animation: pulse 2s infinite; }
                @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
            `}</style>
        </div>
    );
}
