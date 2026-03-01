"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReportsClient({ session }) {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'headcount';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const tabs = [
        { id: 'headcount', label: '📊 Headcount', desc: 'Demographics & Organization' },
        { id: 'attendance', label: '⏰ Attendance', desc: 'Punctuality Trends' },
        { id: 'leave', label: '🏖️ Leave', desc: 'Time-Off Analytics' },
        { id: 'payroll', label: '💰 Payroll', desc: 'Compensation Tracking' },
        { id: 'exports', label: '📥 Exports', desc: 'Raw Data Downloads' }
    ];

    useEffect(() => {
        if (activeTab !== 'exports') {
            fetchReportData(activeTab);
        } else {
            setData(null);
        }
    }, [activeTab]);

    const fetchReportData = async (type) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports?type=${type}`);
            if (res.ok) {
                setData(await res.json());
            } else {
                setData(null);
            }
        } catch (error) {
            console.error('Failed to fetch report', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (dataset) => {
        try {
            const res = await fetch(`/api/reports?type=export-${dataset}`);
            if (!res.ok) throw new Error('Failed to fetch export');
            const records = await res.json();
            
            if (records.length === 0) return alert('No data to export.');

            // Convert JSON to CSV
            const headers = Object.keys(records[0]).join(',');
            const rows = records.map(row => 
                Object.values(row).map(val => `"${val}"`).join(',')
            ).join('\n');
            const csv = `${headers}\n${rows}`;

            // Trigger DL
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', `${dataset}_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            alert('Failed to export data');
        }
    };

    const BarChart = ({ title, objData }) => {
        if (!objData) return null;
        const keys = Object.keys(objData);
        if (keys.length === 0) return <div style={{ color: 'var(--text-muted)' }}>No data available.</div>;
        
        const maxVal = Math.max(...Object.values(objData));
        
        return (
            <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '24px', color: 'var(--cyber-cyan)' }}>{title}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {keys.map(k => {
                        const val = objData[k];
                        const pct = maxVal === 0 ? 0 : Math.round((val / maxVal) * 100);
                        return (
                            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '120px', fontSize: '12px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {k}
                                </div>
                                <div style={{ flex: 1, height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--cyber-teal)', transition: 'width 1s ease-out' }}></div>
                                </div>
                                <div style={{ width: '40px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>{val}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    };

    const renderContent = () => {
        if (loading) return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading analytics...</div>;
        
        if (activeTab === 'headcount' && data) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s' }}>
                    <div className="stat-card glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Active Employees</div>
                            <div style={{ fontSize: '64px', fontWeight: 800, color: 'var(--cyber-cyan)', lineHeight: 1, marginTop: '8px' }}>{data.total}</div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        <BarChart title="By Department" objData={data.byDepartment} />
                        <BarChart title="By Gender" objData={data.byGender} />
                        <BarChart title="By Nationality" objData={data.byNationality} />
                        <BarChart title="By Employment Type" objData={data.byEmploymentType} />
                    </div>
                </div>
            );
        }

        if (activeTab === 'attendance' && data) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="stat-card glass-card" style={{ textAlign: 'center', padding: '32px' }}>
                            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>On-Time (Last 30 Days)</div>
                            <div style={{ fontSize: '48px', color: 'var(--success)' }}>{data.summary?.onTime || 0}</div>
                        </div>
                        <div className="stat-card glass-card" style={{ textAlign: 'center', padding: '32px' }}>
                            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Late (Last 30 Days)</div>
                            <div style={{ fontSize: '48px', color: 'var(--danger)' }}>{data.summary?.late || 0}</div>
                        </div>
                    </div>
                    {/* Activity line logic could go here, but omitted for simplicity. */}
                </div>
            );
        }

        if (activeTab === 'leave' && data) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s' }}>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                        <div className="stat-card glass-card">
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Requests</div>
                            <div style={{ fontSize: '32px', color: '#fff' }}>{data.total}</div>
                        </div>
                        <div className="stat-card glass-card">
                            <div style={{ fontSize: '12px', color: 'var(--warning)' }}>Pending</div>
                            <div style={{ fontSize: '32px', color: 'var(--warning)' }}>{data.pending}</div>
                        </div>
                        <div className="stat-card glass-card">
                            <div style={{ fontSize: '12px', color: 'var(--success)' }}>Approved</div>
                            <div style={{ fontSize: '32px', color: 'var(--success)' }}>{data.approved}</div>
                        </div>
                    </div>
                    <BarChart title="Leave Types Requested" objData={data.byType} />
                </div>
            );
        }

        if (activeTab === 'payroll' && data) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s' }}>
                    <h3 style={{ color: 'var(--cyber-cyan)' }}>Payroll Volume Trend</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                        {data.trends?.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No completed payroll runs found.</p> : null}
                        {data.trends?.map(run => (
                            <div key={run.period} className="glass-card" style={{ padding: '24px' }}>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>{run.period}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Processed {run.count} employees</div>
                                <div style={{ fontSize: '32px', color: 'var(--success)', fontWeight: 800 }}>{run.total.toLocaleString()} AED</div>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }

        if (activeTab === 'exports') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s' }}>
                    <div className="glass-card" style={{ padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>Employee Master Data</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>Full export of all active and inactive employees, including departments, compensation info, and compliance fields.</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => handleExport('employees')}>Download CSV</button>
                    </div>

                    <div className="glass-card" style={{ padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                        <div>
                            <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>Payroll Batch History</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>Historical net pay logic records for accounting reconciliation.</p>
                        </div>
                        <button className="btn" disabled style={{ background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)' }}>Coming Soon</button>
                    </div>
                </div>
            )
        }

        return <div style={{ padding: '48px', color: 'var(--text-secondary)' }}>No data available for this view.</div>;
    };

    return (
        <div className="page animate-fadeInUp">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Reports & Analytics</h1>
                    <p className="page-subtitle">Organizational insights and data exports</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
                {tabs.map(t => (
                    <button
                        key={t.id}
                        className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '12px 24px', borderRadius: '30px', background: activeTab === t.id ? 'var(--cyber-primary)' : 'rgba(255,255,255,0.02)' }}
                        onClick={() => setActiveTab(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div style={{ minHeight: '400px' }}>
                {renderContent()}
            </div>
        </div>
    );
}
