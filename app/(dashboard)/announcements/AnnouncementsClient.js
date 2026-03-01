'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AnnouncementsClient({ announcements: initial, isAdmin }) {
    const [announcements, setAnnouncements] = useState(initial);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', body: '', priority: 'normal' });
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });
        if (res.ok) {
            setShowModal(false);
            setForm({ title: '', body: '', priority: 'normal' });
            router.refresh();
            const created = await res.json();
            setAnnouncements([created, ...announcements]);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this announcement?')) return;
        const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setAnnouncements(announcements.filter(a => a.id !== id));
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📢 Announcements</h1>
                    <p className="page-subtitle">Stay updated with company news and updates</p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        ＋ New Announcement
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="stagger">
                {announcements.map((a) => (
                    <div key={a.id} className="glass-card animate-fadeInUp" style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                                background: a.priority === 'high' ? 'var(--danger-bg)' : 'var(--info-bg)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '22px', flexShrink: 0,
                            }}>
                                {a.priority === 'high' ? '🔴' : '📋'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{a.title}</h3>
                                    <span className={`badge ${a.priority === 'high' ? 'badge-danger' : 'badge-neutral'}`}>
                                        {a.priority}
                                    </span>
                                </div>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
                                    {a.body}
                                </p>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {new Date(a.createdAt).toLocaleDateString('en-AE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                            {isAdmin && (
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}
                                    style={{ flexShrink: 0 }}>
                                    🗑️
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {announcements.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">📢</div>
                    <div className="empty-state-text">No announcements yet</div>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">📢 New Announcement</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input className="form-input" value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })} required
                                    placeholder="Announcement title..." />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Content</label>
                                <textarea className="form-textarea" value={form.body}
                                    onChange={(e) => setForm({ ...form, body: e.target.value })} required
                                    placeholder="Write your announcement..." rows={5} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <select className="form-select" value={form.priority}
                                    onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Publish</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
