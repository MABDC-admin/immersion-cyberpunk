'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsClient({ initialSettings, roles }) {
    const [settings, setSettings] = useState(initialSettings || []);
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Create a local edits mapping: { COMPANY_NAME: "New Value", ... }
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

            // Re-sync local state with saved edits
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
        <div className="page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">⚙️ Admin Settings</h1>
                    <p className="page-subtitle">Configure global company variables and system access</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
                <button
                    className={`btn btn-ghost ${activeTab === 'general' ? 'active-tab' : ''}`}
                    onClick={() => setActiveTab('general')}
                    style={{ borderRadius: '0', borderBottom: activeTab === 'general' ? '2px solid var(--primary)' : '2px solid transparent' }}
                >
                    Global Configurations
                </button>
                <button
                    className={`btn btn-ghost ${activeTab === 'roles' ? 'active-tab' : ''}`}
                    onClick={() => setActiveTab('roles')}
                    style={{ borderRadius: '0', borderBottom: activeTab === 'roles' ? '2px solid var(--primary)' : '2px solid transparent' }}
                >
                    Roles & Access Matrix
                </button>
            </div>

            {message.text && (
                <div style={{
                    padding: '16px',
                    borderRadius: 'var(--radius)',
                    marginBottom: '24px',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`
                }}>
                    {message.text}
                </div>
            )}

            {/* GENERAL SETTINGS TAB */}
            {activeTab === 'general' && (
                <div className="card animate-fadeInUp" style={{ padding: '32px' }}>
                    <form onSubmit={handleSaveSettings}>
                        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'minmax(0, 1fr)' }}>
                            {settings.map(setting => (
                                <div key={setting.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: '0 0 40%' }}>
                                            <label className="form-label" style={{ fontWeight: 600, fontSize: '15px' }}>
                                                {setting.key.replace(/_/g, ' ')}
                                            </label>
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                                {setting.description}
                                            </div>
                                        </div>
                                        <div style={{ flex: '1', maxWidth: '400px' }}>
                                            {/* Render select drop-downs for specific known keys, else text input */}
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
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={Object.keys(edits).length === 0 || isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ROLES TAB */}
            {activeTab === 'roles' && (
                <div className="dashboard-grid animate-fadeInUp" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {roles.map(role => (
                        <div key={role.id} className="stat-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, fontSize: '18px' }}>{role.name}</h3>
                                <span className="badge" style={{ background: 'var(--primary)', color: '#fff' }}>
                                    {role._count?.userRoles} Users
                                </span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                                {role.description}
                            </p>

                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                <button className="btn btn-ghost btn-sm" style={{ width: '100%' }}>View Permissions</button>
                            </div>
                        </div>
                    ))}

                    {/* Add New Role Mock Card */}
                    <div className="stat-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', background: 'transparent', cursor: 'pointer' }}>
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>+</div>
                            Create Custom Role
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
