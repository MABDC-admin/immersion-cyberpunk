'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function MyTasksClient() {
    const { data: session } = useSession();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/my-tasks');
            if (!res.ok) throw new Error('Failed to load tasks');
            const data = await res.json();
            setTasks(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const s = status.toLowerCase();
        if (s === 'completed') return 'var(--success)';
        if (s === 'pending' || s === 'enrolled') return 'var(--warning)';
        if (s === 'in progress') return 'var(--info)';
        return 'var(--text-muted)';
    };

    const getTypeIcon = (type) => {
        return type === 'Onboarding' ? '🚀' : '🎓';
    };

    const filteredTasks = tasks.filter(task => {
        if (statusFilter !== 'All') {
            if (statusFilter === 'Pending' && !['pending', 'enrolled', 'in progress'].includes(task.status.toLowerCase())) return false;
            if (statusFilter === 'Completed' && task.status.toLowerCase() !== 'completed') return false;
        }
        if (typeFilter !== 'All' && task.type !== typeFilter) return false;
        return true;
    });

    if (loading) {
        return (
            <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ color: 'var(--primary)', fontSize: '18px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="nav-icon" style={{ animation: 'pulse 2s infinite' }}>🔄</span> Loading Tasks...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page" style={{ padding: '24px' }}>
                <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="page" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ filter: 'drop-shadow(0 0 8px var(--primary))' }}>📝</span> My Tasks
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Action items required for your employee record or training.</p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                        }}
                    >
                        <option value="All">All Types</option>
                        <option value="Onboarding">Onboarding</option>
                        <option value="Training">Training</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                        }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending / In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
            </div>

            <div className="table-container" style={{ background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.2)', textAlign: 'left' }}>
                            <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)' }}>Task</th>
                            <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)' }}>Type</th>
                            <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)' }}>Date</th>
                            <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)' }}>Status</th>
                            <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTasks.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '16px', filter: 'grayscale(1)', opacity: 0.5 }}>📝</div>
                                    <div>No tasks found matching your filters.</div>
                                </td>
                            </tr>
                        ) : (
                            filteredTasks.map(task => (
                                <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>{task.title}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {task.description}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: 'var(--bg-element)', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                                            <span>{getTypeIcon(task.type)}</span> {task.type}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                                        {new Date(task.date).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span className="status-badge" style={{ 
                                            background: `rgba(${getStatusColor(task.status).replace('var(--', '').replace(')', '') === 'success' ? '16, 185, 129' : getStatusColor(task.status).replace('var(--', '').replace(')', '') === 'warning' ? '245, 158, 11' : getStatusColor(task.status).replace('var(--', '').replace(')', '') === 'info' ? '59, 130, 246' : '100, 116, 139'}, 0.1)`,
                                            color: getStatusColor(task.status),
                                            border: `1px solid ${getStatusColor(task.status)}40`,
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            boxShadow: `0 0 10px ${getStatusColor(task.status)}20`
                                        }}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <button 
                                            disabled={task.status.toLowerCase() === 'completed'}
                                            style={{
                                                padding: '6px 14px',
                                                borderRadius: '6px',
                                                background: task.status.toLowerCase() === 'completed' ? 'var(--bg-element)' : 'var(--primary)',
                                                color: task.status.toLowerCase() === 'completed' ? 'var(--text-muted)' : '#000',
                                                border: 'none',
                                                fontWeight: 600,
                                                fontSize: '13px',
                                                cursor: task.status.toLowerCase() === 'completed' ? 'not-allowed' : 'pointer',
                                                opacity: task.status.toLowerCase() === 'completed' ? 0.5 : 1,
                                                boxShadow: task.status.toLowerCase() === 'completed' ? 'none' : '0 0 10px rgba(0, 243, 255, 0.3)'
                                            }}
                                        >
                                            {task.status.toLowerCase() === 'completed' ? 'Done' : 'Action'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
