'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RecruitmentClient({ initialJobs, departments }) {
    const [jobs, setJobs] = useState(initialJobs || []);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        title: '',
        departmentId: departments[0]?.id || '',
        location: 'Dubai, UAE',
        type: 'Full-Time',
        description: ''
    });

    const router = useRouter();

    const handleCreateJob = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create job posting');
            }

            const newJob = await res.json();
            setJobs([newJob, ...jobs]);
            setShowModal(false);
            setForm({
                title: '',
                departmentId: departments[0]?.id || '',
                location: 'Dubai, UAE',
                type: 'Full-Time',
                description: ''
            });
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTypeColor = (type) => {
        if (type === 'Full-Time') return 'var(--primary)';
        if (type === 'Part-Time') return 'var(--warning)';
        if (type === 'Contract') return 'var(--info)';
        return 'var(--text-muted)';
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🎯 Recruitment & ATS</h1>
                    <p className="page-subtitle">Manage open job requisitions and incoming applicants</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ＋ Post Job
                </button>
            </div>

            {/* Job Board Grid view */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {jobs.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1', background: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <div className="empty-state-text">No open job postings at the moment.</div>
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div key={job.id} className="stat-card animate-fadeInUp" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 6px 0' }}>{job.title}</h3>
                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{job.department?.name || 'Unknown Dept'}</span>
                                </div>
                                <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                                    {job.status}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', flexWrap: 'wrap' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    📍 {job.location}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: getTypeColor(job.type) }}></span>
                                    {job.type}
                                </span>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '13px' }}>
                                    <strong style={{ color: 'var(--primary)' }}>{job._count?.applicants || 0}</strong> Applicants
                                </div>
                                <button className="btn btn-ghost btn-sm">Manage</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal for creating a new Job Posting */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">✏️ Create Job Posting</h2>

                        {error && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius)', marginBottom: '16px', fontSize: '14px' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreateJob}>
                            <div className="form-group">
                                <label className="form-label">Job Title</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g., Senior UX Designer"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <select
                                        className="form-input"
                                        value={form.departmentId}
                                        onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Dept...</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Employment Type</label>
                                    <select
                                        className="form-input"
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    >
                                        <option value="Full-Time">Full-Time</option>
                                        <option value="Part-Time">Part-Time</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Internship">Internship</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g., Dubai, UAE or Remote"
                                    value={form.location}
                                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Short Description</label>
                                <textarea
                                    className="form-input"
                                    placeholder="Brief pitch for the open role..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Posting...' : 'Post Job'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
