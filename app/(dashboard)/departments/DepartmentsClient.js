"use client";

import { useState, useEffect } from 'react';

export default function DepartmentsClient() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await fetch('/api/departments');
            if (res.ok) {
                setDepartments(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch departments', error);
        } finally {
            setLoading(false);
        }
    };
    const openCreate = () => {
        setEditingId(null);
        setFormData({ name: '', description: '' });
        setError('');
        setShowModal(true);
    };

    const openEdit = (dept) => {
        setEditingId(dept.id);
        setFormData({ name: dept.name, description: dept.description || '' });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const url = editingId ? `/api/departments/${editingId}` : '/api/departments';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const savedDept = await res.json();
                
                if (editingId) {
                    setDepartments(departments.map(d => d.id === savedDept.id ? savedDept : d));
                } else {
                    setDepartments([...departments, { ...savedDept, _count: { employees: 0 } }]);
                }
                
                setShowModal(false);
                setFormData({ name: '', description: '' });
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to create department');
            }
        } catch (error) {
            console.error('Failed to submit department', error);
            setError('An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this department?')) return;
        
        try {
            const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete department');
            }
            
            setDepartments(departments.filter(d => d.id !== id));
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="page animate-fadeInUp">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Departments</h1>
                    <p className="page-subtitle">Manage company departments and structural units</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>+ New Department</button>
            </div>

            <div className="data-table-wrapper animate-fadeInUp">
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading departments...</div>
                ) : departments.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div className="empty-state-text">No departments found.</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Department Name</th>
                                <th>Description</th>
                                <th>Total Employees</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map((dept) => (
                                <tr key={dept.id}>
                                    <td style={{ fontWeight: 600 }}>{dept.name}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{dept.description || '—'}</td>
                                    <td>
                                        <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                            {dept._count?.employees || 0} Members
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(dept)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(dept.id)}>Delete</button>
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
                        <h2 style={{ marginBottom: '24px' }}>{editingId ? 'Edit Department' : 'Add Department'}</h2>

                        {error && (
                            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Department Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Marketing"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description (Optional)</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the department's function..."
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : (editingId ? 'Update Department' : 'Save Department')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
