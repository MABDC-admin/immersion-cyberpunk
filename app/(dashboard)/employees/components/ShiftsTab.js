import React from 'react';

export default function ShiftsTab({ employee }) {
    const shift = employee?.shifts?.[0]?.shift;

    const daysMap = {
        '1': 'Mon',
        '2': 'Tue',
        '3': 'Wed',
        '4': 'Thu',
        '5': 'Fri',
        '6': 'Sat',
        '7': 'Sun'
    };

    const parsedDays = shift?.workDays 
        ? shift.workDays.split(',').map(d => daysMap[d] || d).join(', ')
        : 'Monday to Friday (Default)';

    return (
        <div className="animate-fadeInUp">
            <h3 style={{ color: 'var(--cyber-cyan)', fontSize: '18px', marginBottom: '20px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⏰ Working Schedule
            </h3>
            
            {!shift ? (
                <div style={{ padding: '30px', background: 'rgba(0, 243, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No specific Shift profile assigned. Operating on standard company hours.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                    
                    {/* Shift Profile Box */}
                    <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(0, 243, 255, 0.2)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--cyber-cyan)' }} />
                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>
                            Assigned Shift Profile
                        </div>
                        <div style={{ color: '#fff', fontSize: '24px', fontWeight: 800, letterSpacing: '1px', marginBottom: '16px' }}>
                            {shift.name}
                        </div>
                    </div>

                    {/* Timings and Days */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ background: 'rgba(6, 20, 16, 0.8)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                            <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Shift window</div>
                            <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>{shift.startTime} <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>to</span> {shift.endTime}</div>
                        </div>
                        
                        <div style={{ background: 'rgba(6, 20, 16, 0.8)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)' }}>
                            <div style={{ color: 'var(--cyber-teal)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Working Days</div>
                            <div style={{ color: '#fff', fontSize: '13px', fontWeight: 500, lineHeight: 1.4 }}>
                                {parsedDays}
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
