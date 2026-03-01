import React from 'react';

export default function BenefitsTab({ employee }) {
    const benefits = employee?.benefits || [];

    const allowances = benefits.filter(b => b.benefit?.type === 'Allowance');
    const deductions = benefits.filter(b => b.benefit?.type === 'Deduction');
    const insurance = benefits.filter(b => b.benefit?.type === 'Insurance');

    const renderList = (title, items, icon, color) => (
        <div style={{ background: 'rgba(6, 20, 16, 0.6)', padding: '20px', borderRadius: '12px', border: `1px solid ${color}` }}>
            <h4 style={{ color: color, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {icon} {title}
            </h4>
            {items.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>None active</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {items.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
                            <div>
                                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>{item.benefit.name}</div>
                                {item.startDate && <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Since: {item.startDate}</div>}
                            </div>
                            {item.amount && (
                                <div style={{ fontFamily: 'monospace', color: color, fontWeight: 'bold' }}>
                                    AED {item.amount.toLocaleString()}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="animate-fadeInUp">
            <h3 style={{ color: 'var(--cyber-cyan)', fontSize: '18px', marginBottom: '20px', letterSpacing: '1px' }}>
                🛡️ Base Allowances & Health Benefits
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                {renderList('Active Allowances', allowances, '📈', 'rgba(16, 185, 129, 0.5)')}
                {renderList('Active Deductions', deductions, '📉', 'rgba(239, 68, 68, 0.5)')}
                {renderList('Insurance & Health', insurance, '🏥', 'rgba(56, 189, 248, 0.5)')}
            </div>
        </div>
    );
}
