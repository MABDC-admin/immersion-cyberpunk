"use client";

import { useState, useEffect } from 'react';

export default function ProfileClient() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setFormData({ phone: data.phone || '' });
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                const updated = await res.json();
                setProfile({ ...profile, ...updated });
                setEditMode(false);
            }
        } catch (error) {
            console.error('Failed to save profile', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Loading profile...</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="page">
                <div className="glass-card">
                    <h2>Profile Not Found</h2>
                    <p>We could not locate your employee profile in the system.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page animate-fadeInUp">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">View and manage your employee information</p>
                </div>
                {!editMode ? (
                    <button className="btn btn-primary" onClick={() => setEditMode(true)}>Edit Profile</button>
                ) : (
                    <button className="btn btn-secondary" onClick={() => { setEditMode(false); setFormData({ phone: profile.phone || '' }); }}>Cancel Edit</button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                {/* Left Col - Avatar & Summary */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{
                        width: '120px', height: '120px', borderRadius: '50%', background: 'var(--primary)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '48px', fontWeight: 600, marginBottom: '16px', border: '4px solid var(--surface)'
                    }}>
                        {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                    </div>
                    <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>{profile.firstName} {profile.lastName}</h2>
                    <div className="badge badge-primary">{profile.position}</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>{profile.department} Department</div>

                    <div style={{ width: '100%', borderTop: '1px solid var(--border)', marginTop: '24px', paddingTop: '24px', textAlign: 'left', fontSize: '14px' }}>
                        <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: 'var(--text-secondary)', display: 'block' }}>Employee ID</strong>
                            <span>{profile.empNo}</span>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: 'var(--text-secondary)', display: 'block' }}>Date Joined</strong>
                            <span>{profile.joinDate}</span>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: 'var(--text-secondary)', display: 'block' }}>Status</strong>
                            <span className="badge badge-success">{profile.status}</span>
                        </div>
                    </div>
                </div>

                {/* Right Col - Details Form */}
                <div className="glass-card">
                    <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>Contact Information</h3>

                    {editMode ? (
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input type="email" className="form-input" value={profile.email || ''} disabled style={{ opacity: 0.7 }} />
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Email cannot be changed manually. Contact HR.</span>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+971 50 123 4567"
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div>
                                <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '13px', marginBottom: '4px' }}>Email Address</strong>
                                <div>{profile.email || '—'}</div>
                            </div>
                            <div>
                                <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '13px', marginBottom: '4px' }}>Phone Number</strong>
                                <div>{profile.phone || '—'}</div>
                            </div>
                        </div>
                    )}

                    <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px', marginTop: '40px' }}>Manager Information</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            👤
                        </div>
                        <div>
                            <div style={{ fontWeight: 500 }}>System Administrator</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Direct Manager</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
