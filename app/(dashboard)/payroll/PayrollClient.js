'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PayrollClient({ initialRuns }) {
    const [runs, setRuns] = useState(initialRuns || []);
    const [showModal, setShowModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    // Default to current month/year
    const d = new Date();
    const [form, setForm] = useState({
        month: (d.getMonth() + 1).toString(),
        year: d.getFullYear().toString()
    });

    const router = useRouter();

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    const handleGenerate = async (e) => {
        e.preventDefault();
        setError('');
        setIsProcessing(true);

        try {
            const res = await fetch('/api/payroll-runs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to generate payroll');
            }

            const newRun = await res.json();
            setRuns([newRun, ...runs].sort((a, b) => {
                if (b.year !== a.year) return b.year - a.year;
                return b.month - a.month;
            }));

            setShowModal(false);
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this payroll run? This will delete all generated payslips for this run.')) return;
        
        try {
            const res = await fetch(`/api/payroll-runs/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete payroll run');
            }
            
            setRuns(runs.filter(r => r.id !== id));
            router.refresh();
        } catch (error) {
            alert(error.message);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Draft': return <span className="badge badge-warning">Draft</span>;
            case 'Processed': return <span className="badge badge-info">Processed</span>;
            case 'Paid': return <span className="badge badge-success">Paid</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">💰 Payroll Processing</h1>
                    <p className="page-subtitle">Manage company payroll, view history, and generate monthly runs</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ⚡ Generate Payroll
                </button>
            </div>

            {/* Metrics Overview (Placeholder numbers) */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '32px' }}>
                <div className="stat-card animate-fadeInUp" style={{ animationDelay: '0ms' }}>
                    <div className="stat-title">Last Payroll Total</div>
                    <div className="stat-value">AED 145,200</div>
                    <div className="stat-trend trend-down">↓ 2.1% vs last month</div>
                </div>
                <div className="stat-card animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                    <div className="stat-title">Avg. Processing Time</div>
                    <div className="stat-value">1.2 Days</div>
                    <div className="stat-trend trend-up">↑ 15% efficiency</div>
                </div>
                <div className="stat-card animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                    <div className="stat-title">Active Allowances</div>
                    <div className="stat-value">AED 42,000</div>
                    <div className="stat-trend trend-neutral">— Stable</div>
                </div>
            </div>

            {/* Run History Table */}
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Payroll History</h3>
            <div className="data-table-wrapper animate-fadeInUp">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Period</th>
                            <th>Status</th>
                            <th>Employees Processed</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {runs.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                                    <div className="empty-state-text">No payroll runs generated yet.</div>
                                </td>
                            </tr>
                        ) : (
                            runs.map((run) => (
                                <tr key={run.id}>
                                    <td style={{ fontWeight: 600 }}>
                                        {months[run.month - 1]} {run.year}
                                    </td>
                                    <td>{getStatusBadge(run.status)}</td>
                                    <td>
                                        <span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                            {run._count?.payrollItems || 0} Staff
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/payroll/${run.id}`)}>
                                                View Details
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(run.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Generate Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">⚡ Generate Payroll Run</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
                            This will automatically calculate basic salary, allowances, and deductions for all Active employees.
                        </p>

                        {error && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius)', marginBottom: '16px', fontSize: '14px' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleGenerate}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div className="form-group">
                                    <label className="form-label">Month</label>
                                    <select
                                        className="form-input"
                                        value={form.month}
                                        onChange={(e) => setForm({ ...form, month: e.target.value })}
                                    >
                                        {months.map((m, i) => (
                                            <option key={i} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Year</label>
                                    <select
                                        className="form-input"
                                        value={form.year}
                                        onChange={(e) => setForm({ ...form, year: e.target.value })}
                                    >
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '24px', fontSize: '13px' }}>
                                <strong>Note:</strong> Processing may take a moment depending on the number of enrolled employees. The initial status will be marked as <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Draft</span>.
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={isProcessing}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isProcessing}>
                                    {isProcessing ? 'Processing Auto-Calc...' : 'Generate Now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
