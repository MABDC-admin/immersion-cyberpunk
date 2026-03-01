'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsClient({ initialSettings, roles }) {
    const [settings, setSettings] = useState(initialSettings || []);
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [edits, setEdits] = useState({});

    const router = useRouter();

    const handleSettingChange = (key, value) => {
        setEdits(prev => ({ ...prev, [key]: value }));
    };

    const getDisplayValue = (key, originalValue) => {
        return edits[key] !== undefined ? edits[key] : originalValue;
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        const updates = Object.keys(edits).map(key => ({
            key,
            value: edits[key]
        }));

        if (updates.length === 0) return;

        setIsSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update settings');

            setMessage({ text: 'Settings updated successfully!', type: 'success' });
            
            const newlySaved = settings.map(s => ({
                ...s,
                value: edits[s.key] !== undefined ? edits[s.key] : s.value
            }));
            setSettings(newlySaved);
            setEdits({});
            router.refresh();

            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="page animate-fadeInUp">
            <div className="page-header">
                <div>
                    <h1 className="page-title">System Configurations</h1>
                    <p className="page-subtitle">Manage global variables, company metadata, and RBAC matrix</p>
                </div>
            </div>

            {/* Premium Tabs */}
            <div className="profile-tabs" style={{ marginBottom: '32px' }}>
                <button
                    className={`profile-tab ${activeTab === 'general' ? 'active' : ''}`}
                    onClick={() => setActiveTab('general')}
                >
                    ⚙️ Global Config
                </button>
                <button
                    className={`profile-tab ${activeTab === 'roles' ? 'active' : ''}`}
                    onClick={() => setActiveTab('roles')}
                >
                    🛡️ Roles & Permissions
                </button>
            </div>

            {message.text && (
                <div className="animate-fadeInUp" style={{
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    background: message.type === 'success' ? 'rgba(0, 255, 159, 0.1)' : 'rgba(255, 0, 112, 0.1)',
                    color: message.type === 'success' ? 'var(--cyber-teal)' : 'var(--cyber-pink)',
                    border: `1px solid ${message.type === 'success' ? 'var(--cyber-teal)' : 'var(--cyber-pink)'}`,
                    boxShadow: `0 0 10px ${message.type === 'success' ? 'rgba(0, 255, 159, 0.2)' : 'rgba(255, 0, 112, 0.2)'}`
                }}>
                    {message.text}
                </div>
            )}

            {/* GENERAL SETTINGS TAB */}
            {activeTab === 'general' && (
                <div className="glass-card animate-fadeInUp" style={{ padding: '32px' }}>
                    <form onSubmit={handleSaveSettings}>
                        <div style={{ display: 'grid', gap: '20px' }}>
                            {settings.map(setting => (
                                <div key={setting.id} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    padding: '16px 0',
                                    borderBottom: '1px solid var(--surface-hover)'
                                }}>
                                    <div style={{ flex: '1' }}>
                                        <label className="form-label" style={{ fontSize: '15px', color: 'var(--cyber-cyan)' }}>
                                            {setting.key.replace(/_/g, ' ')}
                                        </label>
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            {setting.description}
                                        </div>
                                    </div>
                                    <div style={{ flex: '0 0 350px' }}>
                                        {setting.key === 'REQUIRE_MANAGER_APPROVAL_LEAVE' ? (
                                            <select
                                                className="form-input"
                                                value={getDisplayValue(setting.key, setting.value)}
                                                onChange={e => handleSettingChange(setting.key, e.target.value)}
                                            >
                                                <option value="true">Yes, strict approval</option>
                                                <option value="false">No, auto-approve</option>
                                            </select>
                                        ) : setting.key === 'FISCAL_YEAR_START' ? (
                                            <select
                                                className="form-input"
                                                value={getDisplayValue(setting.key, setting.value)}
                                                onChange={e => handleSettingChange(setting.key, e.target.value)}
                                            >
                                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                className="form-input"
                                                value={getDisplayValue(setting.key, setting.value)}
                                                onChange={e => handleSettingChange(setting.key, e.target.value)}
                                                style={{ textAlign: 'right', borderStyle: 'dashed' }}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={Object.keys(edits).length === 0 || isSaving}
                                style={{ padding: '12px 32px' }}
                            >
                                {isSaving ? 'UPDATING...' : 'SAVE SYSTEM CONFIG'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ROLES TAB */}
            {activeTab === 'roles' && (
                <div className="dashboard-grid animate-fadeInUp" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                    {roles.map(role => (
                        <div key={role.id} className="glass-card stat-card" style={{ padding: '24px', borderLeft: '4px solid var(--cyber-cyan)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--cyber-cyan)' }}>{role.name}</h3>
                                <span className="badge" style={{ background: 'rgba(0, 243, 255, 0.1)', color: 'var(--cyber-cyan)' }}>
                                    {role._count?.userRoles} USERS
                                </span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>
                                {role.description}
                            </p>

                            <div style={{ borderTop: '1px solid var(--surface-hover)', paddingTop: '16px' }}>
                                <button className="btn btn-ghost btn-sm" style={{ width: '100%', border: '1px solid var(--surface-hover)' }}>View Permissions Matrix</button>
                            </div>
                        </div>
                    ))}

                    <button className="glass-card stat-card" style={{ 
                        padding: '24px', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        border: '1px dashed var(--surface-hover)', 
                        background: 'transparent', 
                        cursor: 'pointer' 
                    }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--text-muted)' }}>+</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>CREATE CUSTOM ROLE</div>
                    </button>
                </div>
            )}
        </div>
    );
}

