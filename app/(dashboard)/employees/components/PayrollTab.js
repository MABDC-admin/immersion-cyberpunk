import React from 'react';

export default function PayrollTab({ employee }) {
    const payrollItems = employee?.payrollItems || [];

    // Sort by most recent first
    const sortedItems = [...payrollItems].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return (
        <div className="animate-fadeInUp">
            <h3 style={{ color: 'var(--cyber-cyan)', fontSize: '18px', marginBottom: '20px', letterSpacing: '1px' }}>
                💳 Payslips & Compensation History
            </h3>
            
            {sortedItems.length === 0 ? (
                <div style={{ padding: '30px', background: 'rgba(0, 243, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 243, 255, 0.1)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No payroll records generated for this employee yet.
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Payroll Run</th>
                                <th>Basic Salary</th>
                                <th>Allowances</th>
                                <th>Deductions</th>
                                <th>Net Pay</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedItems.map(item => {
                                const totalAllowances = (item.housingAllowance || 0) + (item.transportAllowance || 0) + (item.otherAllowances || 0);

                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{ color: '#fff', fontWeight: 600 }}>{item.payrollRun?.month} {item.payrollRun?.year}</div>
                                            <div style={{ color: 'var(--cyber-teal)', fontSize: '12px' }}>{new Date(item.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{ fontFamily: 'monospace' }}>AED {item.basic.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td style={{ fontFamily: 'monospace', color: 'var(--success)' }}>
                                            + {totalAllowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ fontFamily: 'monospace', color: 'var(--danger)' }}>
                                            - {item.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--cyber-cyan)', fontSize: '15px' }}>
                                            AED {item.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            <span className={`badge badge-success`}>Paid</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
