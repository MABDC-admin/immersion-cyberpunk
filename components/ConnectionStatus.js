'use client';

import { useState, useEffect } from 'react';

export default function ConnectionStatus() {
    const [status, setStatus] = useState('checking'); // checking, connected, error
    const [latency, setLatency] = useState(null);

    const checkConnection = async () => {
        try {
            const res = await fetch('/api/status', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setStatus('connected');
                setLatency(data.latency);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    useEffect(() => {
        checkConnection();
        // Check health every 30 seconds
        const interval = setInterval(checkConnection, 30000);
        return () => clearInterval(interval);
    }, []);

    let config = {
        color: 'var(--warning)',
        text: 'Connecting...',
        glow: 'rgba(245, 158, 11, 0.4)'
    };

    if (status === 'connected') {
        config = {
            color: 'var(--success)',
            text: `Postgres Connected ${latency !== null ? `(${latency}ms)` : ''}`,
            glow: 'rgba(16, 185, 129, 0.4)'
        };
    } else if (status === 'error') {
        config = {
            color: 'var(--danger)',
            text: 'Database Disconnected',
            glow: 'rgba(239, 68, 68, 0.6)'
        };
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }} title="Database Connection Status">
            <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: config.color,
                boxShadow: `0 0 6px ${config.glow}, 0 0 12px ${config.color}`,
                animation: status !== 'error' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
            }} />
            <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.5px'
            }}>
                {config.text}
            </span>
        </div>
    );
}
