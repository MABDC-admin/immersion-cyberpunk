"use client";

import { useState, useEffect } from 'react';

export default function AuditLogsClient({ session }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/audit-logs?limit=250');
            if (res.ok) setLogs(await res.json());
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionTheme = (action) => {
        if (action.includes('CREATED')) return 'var(--success)';
        if (action.includes('UPDATED')) return 'var(--warning)';
        if (action.includes('DELETED')) return 'var(--danger)';
        return 'var(--info)';
    };

    return (
        <div className="page animate-fadeInUp">
            <div className="page-header">
                <div>
                    <h1 className="page-title">System Audit Logs</h1>
                    <p className="page-subtitle">Security trail and compliance tracking for Admin actions</p>
                </div>
                <button className="btn btn-secondary" onClick={fetchLogs} disabled={loading}>
                    {loading ? 'Refreshing...' : 'Refresh Logs'}
                </button>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading system trails...</div>
                ) : logs.length === 0 ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                        <p>No audit logs recorded yet.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table" style={{ fontSize: '13px' }}>
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Actor</th>
                                    <th>Action</th>
                                    <th>Target Entity</th>
                                    <th>Entity ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td style={{ color: 'var(--text-muted)' }}>
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td style={{ color: '#fff', fontWeight: 500 }}>
                                            {log.user?.displayName || 'System'}
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>{log.user?.email}</div>
                                        </td>
                                        <td>
                                            <span style={{ 
                                                color: getActionTheme(log.action), 
                                                fontSize: '11px', 
                                                fontWeight: 600, 
                                                letterSpacing: '0.5px',
                                                background: `color-mix(in srgb, ${getActionTheme(log.action)} 10%, transparent)`,
                                                padding: '4px 8px',
                                                borderRadius: '4px'
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--cyber-cyan)' }}>{log.entity}</td>
                                        <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.entityId}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
