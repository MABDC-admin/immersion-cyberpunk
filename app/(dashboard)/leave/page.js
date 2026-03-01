import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LeaveClient from './LeaveClient';

export default async function LeavePage() {
    const session = await getServerSession(authOptions);
    const roles = session?.user?.roles || [];
    const isAdmin = roles.includes('Super Admin') || roles.includes('HR Admin') || roles.includes('Manager');

    const leaveTypes = await prisma.leaveType.findMany();

    let leaveRequests;
    if (isAdmin) {
        leaveRequests = await prisma.leaveRequest.findMany({
            orderBy: { createdAt: 'desc' },
            include: { employee: true, leaveType: true },
        });
    } else {
        leaveRequests = await prisma.leaveRequest.findMany({
            where: { employeeId: session?.user?.employeeId },
            orderBy: { createdAt: 'desc' },
            include: { employee: true, leaveType: true },
        });
    }

    return (
        <LeaveClient
            leaveRequests={JSON.parse(JSON.stringify(leaveRequests))}
            leaveTypes={JSON.parse(JSON.stringify(leaveTypes))}
            isAdmin={isAdmin}
            currentEmployeeId={session?.user?.employeeId}
        />
    );
}
