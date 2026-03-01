import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PayrollRunDetails({ params }) {
    const session = await getServerSession(authOptions);
    const roles = session?.user?.roles || [];
    if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin'))) {
        redirect('/dashboard');
    }

    const resolvedParams = await Promise.resolve(params);
    const runId = parseInt(resolvedParams.id);

    const run = await prisma.payrollRun.findUnique({
        where: { id: runId },
        include: {
            payrollItems: {
                include: {
                    employee: {
                        include: {
                            department: true,
                            positionRel: true
                        }
                    }
                },
                orderBy: {
                    employee: {
                        firstName: 'asc'
                    }
                }
            }
        }
    });

    if (!run) {
        return (
            <div className="page">
                <div className="empty-state-text">Payroll Run Not Found</div>
                <Link href="/payroll" className="btn btn-primary mt-4">Back to Payroll</Link>
            </div>
        );
    }

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const periodName = `${months[run.month - 1]} ${run.year}`;

    const totalBasic = run.payrollItems.reduce((acc, item) => acc + item.basic, 0);
    const totalHousing = run.payrollItems.reduce((acc, item) => acc + item.housingAllowance, 0);
    const totalTransport = run.payrollItems.reduce((acc, item) => acc + item.transportAllowance, 0);
    const totalDeductions = run.payrollItems.reduce((acc, item) => acc + item.deductions, 0);
    const totalNetPay = run.payrollItems.reduce((acc, item) => acc + item.netPay, 0);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🧾 Payroll Breakdown: {periodName}</h1>
                    <p className="page-subtitle">Detailed line-item registry structured for UAE Labour Law compliance</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link href="/payroll" className="btn btn-ghost">
                        ← Back
                    </Link>
                    <a href={`/api/payroll-runs/${run.id}/wps`} target="_blank" className="btn btn-primary" style={{ background: 'var(--success)', borderColor: 'var(--success)' }}>
                        💾 Export MOHRE WPS (.SIF)
                    </a>
                </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '32px' }}>
                <div className="stat-card" style={{ padding: '16px' }}>
                    <div className="stat-title">Total Basic Salary</div>
                    <div className="stat-value" style={{ fontSize: '20px' }}>AED {totalBasic.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="stat-card" style={{ padding: '16px' }}>
                    <div className="stat-title">Total Housing</div>
                    <div className="stat-value" style={{ fontSize: '20px' }}>AED {totalHousing.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="stat-card" style={{ padding: '16px' }}>
                    <div className="stat-title">Total Transport</div>
                    <div className="stat-value" style={{ fontSize: '20px' }}>AED {totalTransport.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="stat-card" style={{ padding: '16px' }}>
                    <div className="stat-title" style={{ color: 'var(--danger)' }}>Total Deductions</div>
                    <div className="stat-value" style={{ fontSize: '20px', color: 'var(--danger)' }}>- AED {totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="stat-card" style={{ padding: '16px', border: '1px solid var(--success)', background: 'rgba(52, 211, 153, 0.05)' }}>
                    <div className="stat-title" style={{ color: 'var(--success)' }}>Total Net Payout</div>
                    <div className="stat-value" style={{ fontSize: '20px', color: 'var(--success)' }}>AED {totalNetPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
            </div>

            <div className="data-table-wrapper animate-fadeInUp">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Bank Details (IBAN)</th>
                            <th>Basic (AED)</th>
                            <th>Housing</th>
                            <th>Transport</th>
                            <th>Other</th>
                            <th style={{ color: 'var(--danger)' }}>Deductions</th>
                            <th style={{ color: 'var(--success)' }}>Net Pay</th>
                        </tr>
                    </thead>
                    <tbody>
                        {run.payrollItems.map(item => (
                            <tr key={item.id}>
                                <td>
                                    <div style={{ fontWeight: 600, color: 'var(--cyber-cyan)' }}>{item.employee.firstName} {item.employee.lastName}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.employee.empNo} • {item.employee.department?.name}</div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '13px' }}>{item.employee.bankName || 'Unspecified'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.employee.iban || 'NO IBAN'}</div>
                                </td>
                                <td>{item.basic.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td>{item.housingAllowance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td>{item.transportAllowance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td>{item.otherAllowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td style={{ color: 'var(--danger)' }}>{item.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>{item.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
