import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ApprovalsClient from './ApprovalsClient';
import { prisma } from '@/lib/prisma';

export const metadata = {
    title: 'Approvals | MABDC Portal',
};

export default async function ApprovalsPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    // Role listing to help Admins assign Workflow steps to specific RBAC roles
    const roles = await prisma.role.findMany({
        select: { name: true },
        orderBy: { name: 'asc' }
    });

    const activeUsers = await prisma.user.findMany({
        where: { isActive: 1 },
        select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } }
    });

    return <ApprovalsClient currentUser={session.user} systemRoles={roles.map(r => r.name)} users={activeUsers} />;
}
