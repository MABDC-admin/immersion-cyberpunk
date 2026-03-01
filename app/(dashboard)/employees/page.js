import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import EmployeesClient from './EmployeesClient';

export default async function EmployeesPage() {
    const session = await getServerSession(authOptions);
    const roles = session?.user?.roles || [];
    const isAdmin = roles.includes('Super Admin') || roles.includes('HR Admin') || roles.includes('Manager');

    if (!isAdmin) {
        return (
            <div className="page">
                <div className="empty-state">
                    <div className="empty-state-icon">🔒</div>
                    <div className="empty-state-text">Access Denied</div>
                    <p style={{ color: 'var(--text-muted)' }}>You don't have permission to view this page.</p>
                </div>
            </div>
        );
    }

    const [employees, departments, positions] = await Promise.all([
        prisma.employee.findMany({
            orderBy: { id: 'asc' },
            include: {
                department: true,
                positionRel: true,
                shifts: { include: { shift: true } },
                benefits: { include: { benefit: true } },
                documents: true,
                payrollItems: { include: { payrollRun: true } }
            }
        }),
        prisma.department.findMany({ orderBy: { name: 'asc' } }),
        prisma.position.findMany({ orderBy: { title: 'asc' } })
    ]);

    return (
        <EmployeesClient
            employees={JSON.parse(JSON.stringify(employees))}
            departments={JSON.parse(JSON.stringify(departments))}
            positions={JSON.parse(JSON.stringify(positions))}
        />
    );
}
