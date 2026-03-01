'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingClient({ templates, activeOnboardings, allEmployees }) {
    const [onboardings, setOnboardings] = useState(activeOnboardings || []);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        employeeId: ''
    });

    const router = useRouter();

    // Employees who don't already have onboarding tasks
    const eligibleEmployees = allEmployees.filter(e => !onboardings.some(o => o.id === e.id));

    const handleAssign = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Assign all available template tasks for this MVP
            const taskIds = templates.map(t => t.id);

            const res = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: form.employeeId, taskIds })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to assign tasks');
            }

            const updatedEmployee = await res.json();
            setOnboardings([updatedEmployee, ...onboardings]);
            setShowModal(false);
            setForm({ employeeId: '' });
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateProgress = (tasks) => {
        if (!tasks || tasks.length === 0) return 0;
        const completed = tasks.filter(t => t.status === 'Completed').length;
        return Math.round((completed / tasks.length) * 100);
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🚀 Onboarding Tracking</h1>
                    <p className="page-subtitle">Assign standard checklists to new hires and track their progress</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ＋ Assign Checklist
                </button>
            </div>

            {/* Metrics Overview */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '32px' }}>
                <div className="stat-card animate-fadeInUp" style={{ animationDelay: '0ms' }}>
                    <div className="stat-title">In Progress</div>
                    <div className="stat-value">{onboardings.filter(o => calculateProgress(o.onboardingTasks) < 100).length} Hires</div>
                    <div className="stat-trend trend-neutral">Currently onboarding</div>
                </div>
                <div className="stat-card animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                    <div className="stat-title">Fully Completed</div>
                    <div className="stat-value">{onboardings.filter(o => calculateProgress(o.onboardingTasks) === 100).length} Hires</div>
                    <div className="stat-trend trend-up">All tasks resolved</div>
                </div>
                <div className="stat-card animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                    <div className="stat-title">Standard Tasks</div>
                    <div className="stat-value">{templates.length} Items</div>
                    <div className="stat-trend trend-neutral">Per new hire checklist</div>
                </div>
            </div>

            {/* List View of Active Onboardings */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
                {onboardings.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', background: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <div className="empty-state-text">No active onboarding checklists.</div>
                    </div>
                ) : (
                    onboardings.map((emp) => {
                        const progress = calculateProgress(emp.onboardingTasks);
                        const isComplete = progress === 100;
                        return (
                            <div key={emp.id} className="stat-card animate-fadeInUp" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '18px', background: isComplete ? 'var(--success)' : 'var(--primary)', color: '#fff' }}>
                                            {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>{emp.firstName} {emp.lastName}</h3>
                                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{emp.positionRel?.title || 'No Position'} • {emp.department?.name || 'No Dept'}</span>
                                        </div>
                                    </div>
                                    {isComplete ? (
                                        <span className="badge badge-success">Completed</span>
                                    ) : (
                                        <span className="badge badge-warning">Onboarding...</span>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px', color: 'var(--text-muted)' }}>
                                        <span>Checklist Progress</span>
                                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{progress}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${progress}%`, background: isComplete ? 'var(--success)' : 'var(--primary)', transition: 'width 0.3s ease' }}></div>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-ghost btn-sm">View Details</button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Modal for Assigning a fresh checklist */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">➕ Assign Onboarding Plan</h2>

                        {error && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius)', marginBottom: '16px', fontSize: '14px' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAssign}>
                            <div className="form-group">
                                <label className="form-label">Select Employee</label>
                                <select
                                    className="form-input"
                                    value={form.employeeId}
                                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                                    required
                                >
                                    <option value="">Select a new hire...</option>
                                    {eligibleEmployees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '24px', fontSize: '13px' }}>
                                <strong>Note:</strong> This will assign the standard corporate checklist comprising <strong>{templates.length} items</strong> (e.g., IT Equipment, Employment Contract) to the selected employee.
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting || eligibleEmployees.length === 0}>
                                    {isSubmitting ? 'Assigning...' : 'Start Onboarding'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
