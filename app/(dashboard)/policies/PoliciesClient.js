"use client";

import { useState, useEffect } from 'react';

export default function PoliciesClient({ session }) {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [viewingPolicy, setViewingPolicy] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({ title: '', version: '1.0', content: '', isPublished: false });
    const isAdmin = session?.user?.roles?.includes('Super Admin') || session?.user?.roles?.includes('HR Admin');

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const res = await fetch('/api/policies');
            if (res.ok) setPolicies(await res.json());
        } catch (error) {
            console.error('Failed to fetch policies', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let res;
            if (viewingPolicy && isAdmin && viewingPolicy.isEditing) {
                res = await fetch(`/api/policies/${viewingPolicy.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
            } else {
                res = await fetch('/api/policies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
            }

            if (res.ok) {
                await fetchPolicies();
                setShowModal(false);
                setViewingPolicy(null);
                setFormData({ title: '', version: '1.0', content: '', isPublished: false });
            }
        } catch (error) {
            console.error('Failed to save policy', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this policy?')) return;
        try {
            const res = await fetch(`/api/policies/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setPolicies(policies.filter(p => p.id !== id));
                setViewingPolicy(null);
            }
        } catch (error) {
            console.error('Failed to delete policy', error);
        }
    };

    const openCreateModal = () => {
        setFormData({ title: '', version: '1.0', content: '', isPublished: false });
        setViewingPolicy(null);
        setShowModal(true);
    };

    const openEditModal = (policy) => {
        setFormData({ title: policy.title, version: policy.version, content: policy.content, isPublished: policy.isPublished });
        setViewingPolicy({ ...policy, isEditing: true });
        setShowModal(true);
    };

    return (
        <div className="page animate-fadeInUp">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Company Policies</h1>
                    <p className="page-subtitle">Official handbooks, guidelines, and compliance rules</p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={openCreateModal}>+ Add Policy</button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {loading ? (
                    <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading...</div>
                ) : policies.length === 0 ? (
                    <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📜</div>
                        <p style={{ color: 'var(--text-secondary)' }}>No policies have been published yet.</p>
                    </div>
                ) : (
                    policies.map(policy => (
                        <div key={policy.id} className="glass-card stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }} onClick={() => setViewingPolicy(policy)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>{policy.title}</h3>
                                {isAdmin && !policy.isPublished && (
                                    <span className="badge badge-warning" style={{ fontSize: '10px' }}>Draft</span>
                                )}
                            </div>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {policy.content}
                            </p>
                            <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '12px' }}>
                                <span style={{ color: 'var(--cyber-teal)' }}>v{policy.version}</span>
                                <span style={{ color: 'var(--text-muted)' }}>Updated {new Date(policy.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* View Modal */}
            {viewingPolicy && !showModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="modal-content glass-card animate-fadeInUp" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(0, 243, 255, 0.2)', paddingBottom: '16px' }}>
                            <div>
                                <h2 style={{ margin: 0, color: 'var(--cyber-cyan)' }}>{viewingPolicy.title}</h2>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Version {viewingPolicy.version} • Last updated {new Date(viewingPolicy.updatedAt).toLocaleDateString()}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {isAdmin && (
                                    <button className="btn btn-secondary" onClick={() => openEditModal(viewingPolicy)}>Edit</button>
                                )}
                                <button className="btn" style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => setViewingPolicy(null)}>Close</button>
                            </div>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-primary)', fontSize: '15px' }}>
                            {viewingPolicy.content}
                        </div>
                        {isAdmin && session?.user?.roles?.includes('Super Admin') && (
                            <div style={{ marginTop: '32px', textAlign: 'right', borderTop: '1px solid rgba(255,0,0,0.2)', paddingTop: '16px' }}>
                                <button className="btn" style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: '12px' }} onClick={() => handleDelete(viewingPolicy.id)}>Delete Policy</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && isAdmin && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="modal-content glass-card animate-fadeInUp" style={{ maxWidth: '800px', width: '90%' }}>
                        <h2 style={{ marginBottom: '24px' }}>{viewingPolicy?.isEditing ? 'Edit Policy' : 'Create New Policy'}</h2>
                        <form onSubmit={handleCreateOrUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label className="form-label">Policy Title</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Version</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.version}
                                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Policy Content</label>
                                <textarea
                                    className="form-input"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows="12"
                                    required
                                    style={{ fontFamily: 'monospace' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isPublished}
                                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                        style={{ width: '16px', height: '16px', accentColor: 'var(--cyber-cyan)' }}
                                    />
                                    Publish immediately
                                </label>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>If unchecked, only Admins can see this draft.</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setViewingPolicy(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Save Policy'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
