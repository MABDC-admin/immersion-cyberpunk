"use client";

import { useState, useEffect } from 'react';

export default function PayslipsClient({ session }) {
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlip, setSelectedSlip] = useState(null);

    useEffect(() => {
        fetchPayslips();
    }, []);

    const fetchPayslips = async () => {
        try {
            const res = await fetch('/api/my-payslips');
            if (res.ok) {
                const data = await res.json();
                setPayslips(data);
            }
        } catch (error) {
            console.error('Failed to fetch payslips', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById('printable-payslip').outerHTML;
        const win = window.open('', '', 'width=900,height=700');
        win.document.write(`
            <html>
                <head>
                    <title>Official Salary Slip</title>
                    <style>
                        body { font-family: Arial, sans-serif; background: #fff; color: #000; padding: 0; margin: 0; }
                        #printable-payslip { padding: 40px !important; margin: 0 auto !important; max-width: 800px !important; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th, td { padding: 12px; border: 1px solid #ddd; }
                        th { text-align: left; background: #f5f5f5; }
                        .hide-on-print { display: none !important; }
                    </style>
                </head>
                <body>
                    ${printContent}
                    <script>
                        window.onload = function() {
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 500);
                        }
                    </script>
                </body>
            </html>
        `);
        win.document.close();
    };

    const PrintableSlip = ({ slip }) => {
        if (!slip) return null;
        
        const emp = slip.employee;
        const monthYear = `${slip.payrollRun.month}/${slip.payrollRun.year}`;

        return (
            <div id="printable-payslip" style={{ 
                background: '#fff', 
                color: '#000', 
                padding: '40px', 
                borderRadius: '8px', 
                maxWidth: '800px', 
                margin: '0 auto',
                fontFamily: 'Arial, sans-serif'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '20px' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', color: '#000' }}>IMMERSION 2026</h1>
                        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Official Salary Statement</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ margin: 0, fontSize: '20px', color: '#000' }}>Period: {monthYear}</h2>
                        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Generated: {new Date(slip.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Employee Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                    <div>
                        <div style={{ marginBottom: '8px' }}><strong>Employee Name:</strong> {emp.firstName} {emp.lastName}</div>
                        <div style={{ marginBottom: '8px' }}><strong>Employee ID:</strong> {emp.empNo}</div>
                        <div style={{ marginBottom: '8px' }}><strong>Department:</strong> {emp.department?.name || 'N/A'}</div>
                        <div style={{ marginBottom: '8px' }}><strong>Position:</strong> {emp.positionRel?.title || 'N/A'}</div>
                    </div>
                    <div>
                        <div style={{ marginBottom: '8px' }}><strong>Payment Method:</strong> {emp.paymentMethod || 'Bank Transfer'}</div>
                        <div style={{ marginBottom: '8px' }}><strong>Bank / IBAN:</strong> {emp.bankName || 'N/A'} - {emp.iban || 'N/A'}</div>
                        <div style={{ marginBottom: '8px' }}><strong>WPS Number:</strong> {emp.wpsFileNumber || 'N/A'}</div>
                        <div style={{ marginBottom: '8px' }}><strong>Status:</strong> Processed & Deposited</div>
                    </div>
                </div>

                {/* Salary Breakdown Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#000' }}>Earnings (AED)</th>
                            <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd', color: '#000' }}>Amount</th>
                            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', color: '#000' }}>Deductions (AED)</th>
                            <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd', color: '#000' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Basic Salary</td>
                            <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>{slip.basic.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                            <td style={{ padding: '12px', border: '1px solid #ddd', color: 'red' }}>Standard Deductions</td>
                            <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd', color: 'red' }}>{slip.deductions.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Housing Allowance</td>
                            <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>{slip.housingAllowance.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                            <td style={{ padding: '12px', border: '1px solid #ddd' }}></td>
                            <td style={{ padding: '12px', border: '1px solid #ddd' }}></td>
                        </tr>
                        <tr>
                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Transport Allowance</td>
                            <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>{slip.transportAllowance.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                            <td style={{ padding: '12px', border: '1px solid #ddd' }}></td>
                            <td style={{ padding: '12px', border: '1px solid #ddd' }}></td>
                        </tr>
                        <tr>
                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Other Allowances</td>
                            <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>{slip.otherAllowances.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                            <td style={{ padding: '12px', border: '1px solid #ddd' }}></td>
                            <td style={{ padding: '12px', border: '1px solid #ddd' }}></td>
                        </tr>
                        <tr>
                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Overtime Pay</td>
                            <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>{slip.overtime.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                            <td style={{ padding: '12px', border: '1px solid #ddd' }}></td>
                            <td style={{ padding: '12px', border: '1px solid #ddd' }}></td>
                        </tr>
                        <tr style={{ fontWeight: 'bold', background: '#f9f9f9' }}>
                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Total Gross Earnings</td>
                            <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>{(slip.basic + slip.housingAllowance + slip.transportAllowance + slip.otherAllowances + slip.overtime).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Total Deductions</td>
                            <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd', color: 'red' }}>{slip.deductions.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Net Pay */}
                <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '4px', textAlign: 'right', border: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'normal' }}>Net Pay Transferred:</span>
                    <span style={{ fontSize: '28px', fontWeight: 'bold', borderBottom: '2px solid #000' }}>AED {slip.netPay.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>

                <div style={{ marginTop: '40px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                    This is a computer-generated document and does not require a physical signature.
                </div>
            </div>
        )
    }

    return (
        <div className="page animate-fadeInUp">
            
            <div className="page-header hide-on-print">
                <div>
                    <h1 className="page-title">🪙 My Payslips</h1>
                    <p className="page-subtitle">View and download your official monthly salary statements.</p>
                </div>
            </div>

            <div className="hide-on-print">
                {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Loading historical statements...</div>
                ) : payslips.length === 0 ? (
                    <div className="empty-state glass-card">
                        <div className="empty-state-icon">💸</div>
                        <div className="empty-state-text">No payslips found.</div>
                        <p style={{ color: 'var(--text-muted)' }}>Your official salary statements will appear here after HR processes the monthly payroll run.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                        {payslips.map(slip => (
                            <div 
                                key={slip.id} 
                                className="stat-card glass-card hover-glow" 
                                style={{ cursor: 'pointer', padding: '24px', transition: 'all 0.2s', borderLeft: '4px solid var(--cyber-cyan)' }}
                                onClick={() => setSelectedSlip(slip)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: 'var(--cyber-teal)', textTransform: 'uppercase', letterSpacing: '1px' }}>Payroll Period</div>
                                        <div style={{ fontSize: '20px', fontWeight: 600, color: '#fff' }}>{slip.payrollRun.month} / {slip.payrollRun.year}</div>
                                    </div>
                                    <div style={{ fontSize: '24px' }}>🧾</div>
                                </div>
                                
                                <div style={{ borderTop: '1px solid rgba(0, 243, 255, 0.1)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NET TRANSFERRED</div>
                                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)' }}>{slip.netPay.toLocaleString()} <span style={{fontSize: '14px', fontWeight: 'normal'}}>AED</span></div>
                                    </div>
                                    <button className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }}>View Slip</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Overlay */}
            {selectedSlip && (
                <div className="modal-overlay" onClick={() => setSelectedSlip(null)} style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal animate-fadeInUp" style={{ maxWidth: '850px', width: '95%', background: 'transparent', border: 'none', padding: 0 }} onClick={e => e.stopPropagation()}>
                        
                        <div className="hide-on-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '16px' }}>
                            <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print / Save PDF</button>
                            <button className="btn btn-danger" onClick={() => setSelectedSlip(null)}>Close</button>
                        </div>
                        
                        <PrintableSlip slip={selectedSlip} />

                    </div>
                </div>
            )}
        </div>
    );
}
