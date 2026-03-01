import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AttendanceClient from './AttendanceClient';

export default async function AttendancePage() {
    const session = await getServerSession(authOptions);
    const roles = session?.user?.roles || [];
    const isAdmin = roles.includes('Super Admin') || roles.includes('HR Admin') || roles.includes('Manager');

    let attendance;
    if (isAdmin) {
        attendance = await prisma.attendance.findMany({
            orderBy: { date: 'desc' },
            include: { employee: true },
            take: 50,
        });
    } else {
        attendance = await prisma.attendance.findMany({
            where: { employeeId: session?.user?.employeeId },
            orderBy: { date: 'desc' },
            include: { employee: true },
            take: 30,
        });
    }

    const employees = isAdmin
        ? await prisma.employee.findMany({ where: { status: 'Active' }, orderBy: { firstName: 'asc' } })
        : [];

    return (
        <AttendanceClient
            attendance={JSON.parse(JSON.stringify(attendance))}
            employees={JSON.parse(JSON.stringify(employees))}
            isAdmin={isAdmin}
            currentEmployeeId={session?.user?.employeeId}
        />
    );
}
