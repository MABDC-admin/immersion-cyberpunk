import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    const roles = session?.user?.roles || [];
    const isAdmin = roles.includes('Super Admin') || roles.includes('HR Admin');

    const [
        employeeCount,
        pendingLeaves,
        todayAttendance,
        announcements,
        recentLeaves,
        departments,
    ] = await Promise.all([
        prisma.employee.count({ where: { status: 'Active' } }),
        prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
        prisma.attendance.count({
            where: { date: new Date().toISOString().split('T')[0] },
        }),
        prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
        }),
        prisma.leaveRequest.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { employee: true, leaveType: true },
        }),
        prisma.employee.groupBy({
            by: ['departmentId'],
            _count: { id: true },
            where: { status: 'Active' },
        }),
    ]);

    // Get employee-specific data if not admin
    let myAttendance = [];
    let myLeaves = [];
    if (!isAdmin && session?.user?.employeeId) {
        [myAttendance, myLeaves] = await Promise.all([
            prisma.attendance.findMany({
                where: { employeeId: session.user.employeeId },
                orderBy: { date: 'desc' },
                take: 7,
            }),
            prisma.leaveRequest.findMany({
                where: { employeeId: session.user.employeeId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { leaveType: true },
            }),
        ]);
    }

    return (
        <DashboardClient
            isAdmin={isAdmin}
            stats={{
                employeeCount,
                pendingLeaves,
                todayAttendance,
                departments: departments.length,
            }}
            departmentData={departments.map(d => ({
                ...d,
                name: d.departmentId
                    ? (departments.find(dept => dept.id === d.departmentId)?.name || `Dept ${d.departmentId}`)
                    : 'Unassigned'
            }))}
            announcements={JSON.parse(JSON.stringify(announcements))}
            recentLeaves={JSON.parse(JSON.stringify(recentLeaves))}
            myAttendance={JSON.parse(JSON.stringify(myAttendance))}
            myLeaves={JSON.parse(JSON.stringify(myLeaves))}
            user={session?.user}
        />
    );
}
