export default function ComingSoonPage() {
    return (
        <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - var(--sidebar-width))' }}>
            <div className="glass-card animate-fadeInUp" style={{ textAlign: 'center', maxWidth: '500px', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '24px' }}>🚧</div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>Under Construction</h1>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                    This module is part of an upcoming phase and is currently being built. It will include full database mapping with proper validation.
                </p>
                <div className="badge badge-info" style={{ fontSize: '14px', padding: '8px 16px' }}>
                    Phase-by-Phase Rollout
                </div>
            </div>
        </div>
    );
}
