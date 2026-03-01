'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BenefitsClient({ initialBenefits }) {
    const [benefits, setBenefits] = useState(initialBenefits || []);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editingBenefit, setEditingBenefit] = useState(null);
    const [form, setForm] = useState({
        name: '',
        type: 'Allowance',
        amount: '',
        description: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const filtered = benefits.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
            (b.description || '').toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === 'All' || b.type === filterType;
        return matchesSearch && matchesType;
    });

    const openCreate = () => {
        setEditingBenefit(null);
        setForm({
            name: '',
            type: 'Allowance',
            amount: '',
            description: ''
        });
        setError('');
        setShowModal(true);
    };

    const openEdit = (benefit) => {
        setEditingBenefit(benefit);
        setForm({
            name: benefit.name,
            type: benefit.type,
            amount: benefit.amount || '',
            description: benefit.description || ''
        });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const url = editingBenefit ? `/api/benefits/${editingBenefit.id}` : '/api/benefits';
            const method = editingBenefit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Failed to ${editingBenefit ? 'update' : 'create'} benefit`);
            }

            const savedBenefit = await res.json();
            
            if (editingBenefit) {
                setBenefits(benefits.map(b => b.id === savedBenefit.id ? savedBenefit : b));
            } else {
                setBenefits([...benefits, { ...savedBenefit, _count: { employees: 0 } }]);
            }
            
            setShowModal(false);
            router.refresh();

        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this benefit? This will remove it from all assigned employees.')) return;
        
        try {
            const res = await fetch(`/api/benefits/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete benefit');
            
            setBenefits(benefits.filter(b => b.id !== id));
            router.refresh();
        } catch (error) {
            alert(error.message);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Allowance': return 'var(--success)';
            case 'Deduction': return 'var(--danger)';
            case 'Insurance': return 'var(--info)';
            default: return 'var(--primary)';
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🛡️ Benefits & Allowances</h1>
                    <p className="page-subtitle">Manage company-wide benefit programs and standard deductions</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    ＋ New Benefit
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div className="search-box" style={{ flex: 1, minWidth: '250px', maxWidth: '400px' }}>
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search programs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="form-input"
                    style={{ width: 'auto' }}
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="All">All Types</option>
                    <option value="Allowance">Allowances</option>
                    <option value="Deduction">Deductions</option>
                    <option value="Insurance">Insurance</option>
                </select>
            </div>

            {/* Data Table */}
            <div className="data-table-wrapper animate-fadeInUp">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Benefit Name</th>
                            <th>Type</th>
                            <th>Default Amount</th>
                            <th>Description</th>
                            <th>Enrolled Employees</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                                    <div className="empty-state-text">No benefits found.</div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((b) => (
                                <tr key={b.id}>
                                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '13px',
                                            color: getTypeColor(b.type)
                                        }}>
                                            <span style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: getTypeColor(b.type)
                                            }}></span>
                                            {b.type}
                                        </span>
                                    </td>
                                    <td>
                                        {b.amount ? (
                                            <span className="badge badge-success">
                                                AED {b.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Variable / Role-based</span>
                                        )}
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>{b.description || '—'}</td>
                                    <td>
                                        <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                            {b._count?.employees || 0} Members
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>Edit</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">{editingBenefit ? '✏️ Edit Benefit Program' : '➕ Add Benefit Program'}</h2>

                        {error && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius)', marginBottom: '16px', fontSize: '14px' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Benefit Name</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g., Housing Allowance, Health Insurance"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-input"
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    >
                                        <option value="Allowance">Allowance (Earning)</option>
                                        <option value="Deduction">Deduction (Withholding)</option>
                                        <option value="Insurance">Insurance / Health</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Default Amount (AED)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        placeholder="Optional fixed amount"
                                        value={form.amount}
                                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '-8px', marginBottom: '16px' }}>
                                Leave amount blank if it varies per employee or role.
                            </p>

                            <div className="form-group">
                                <label className="form-label">Description (Optional)</label>
                                <textarea
                                    className="form-input"
                                    placeholder="Describe the policy or terms..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : (editingBenefit ? 'Update Program' : 'Save Program')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
