"use client";

import { useState, useEffect } from 'react';

const positionLevels = [
    'Entry Level',
    'Junior',
    'Mid-Level',
    'Senior',
    'Lead',
    'Manager',
    'Director',
    'Executive'
];

export default function PositionsClient() {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', level: positionLevels[0] });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPositions();
    }, []);

    const fetchPositions = async () => {
        try {
            const res = await fetch('/api/positions');
            if (res.ok) {
                setPositions(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch positions', error);
        } finally {
            setLoading(false);
        }
    };
    const openCreate = () => {
        setEditingId(null);
        setFormData({ title: '', description: '', level: positionLevels[0] });
        setError('');
        setShowModal(true);
    };

    const openEdit = (pos) => {
        setEditingId(pos.id);
        setFormData({ title: pos.title, description: pos.description || '', level: pos.level || positionLevels[0] });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const url = editingId ? `/api/positions/${editingId}` : '/api/positions';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const savedPos = await res.json();
                
                if (editingId) {
                    setPositions(positions.map(p => p.id === savedPos.id ? savedPos : p));
                } else {
                    setPositions([...positions, { ...savedPos, _count: { employees: 0 } }]);
                }
                
                setShowModal(false);
                setFormData({ title: '', description: '', level: positionLevels[0] });
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to create position');
            }
        } catch (error) {
            console.error('Failed to submit position', error);
            setError('An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this position?')) return;
        
        try {
            const res = await fetch(`/api/positions/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete position');
            }
            
            setPositions(positions.filter(p => p.id !== id));
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="page animate-fadeInUp">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Positions</h1>
                    <p className="page-subtitle">Manage company job titles and hierarchy levels</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>+ New Position</button>
            </div>

            <div className="data-table-wrapper animate-fadeInUp">
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading positions...</div>
                ) : positions.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div className="empty-state-text">No positions found.</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Job Title</th>
                                <th>Level / Rank</th>
                                <th>Description</th>
                                <th>Employees Assigned</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {positions.map((pos) => (
                                <tr key={pos.id}>
                                    <td style={{ fontWeight: 600 }}>{pos.title}</td>
                                    <td>
                                        <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--info)' }}>
                                            {pos.level || 'Unspecified'}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {pos.description || '—'}
                                    </td>
                                    <td>
                                        <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                            {pos._count?.employees || 0} Members
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(pos)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(pos.id)}>Delete</button>
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
                    <div className="modal-content glass-card animate-fadeInUp" style={{ maxWidth: '400px' }}>
                        <h2 style={{ marginBottom: '24px' }}>{editingId ? 'Edit Job Position' : 'Add Job Position'}</h2>

                        {error && (
                            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Position Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Senior Software Engineer"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Hierarchy Level</label>
                                <select
                                    className="form-input"
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                    required
                                >
                                    {positionLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description (Optional)</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the role's responsibilities..."
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : (editingId ? 'Update Position' : 'Save Position')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
