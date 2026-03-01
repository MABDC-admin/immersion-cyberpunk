import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';

export default async function UsersPage() {
    const session = await getServerSession(authOptions);
    const roles = session?.user?.roles || [];

    // RBAC: Only Super Admins can access User Management
    if (!session || (!roles.includes('Super Admin'))) {
        redirect('/dashboard');
    }

    // Pre-fetch initial users, roles, and employees to hydrate the client
    const initialUsers = await prisma.user.findMany({
        include: {
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    department: { select: { name: true } }
                }
            },
            userRoles: {
                include: { role: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const rolesList = await prisma.role.findMany();

    // Fetch active employees not currently linked to a user account
    // This allows the admin to bind an email login to a staff profile
    const existingEmployeeIds = initialUsers.filter(u => u.employeeId).map(u => u.employeeId);

    const unlinkedEmployees = await prisma.employee.findMany({
        where: {
            status: 'Active',
            id: { notIn: existingEmployeeIds }
        },
        select: { id: true, firstName: true, lastName: true }
    });

    return (
        <UsersClient
            initialUsers={JSON.parse(JSON.stringify(initialUsers))}
            rolesList={JSON.parse(JSON.stringify(rolesList))}
            unlinkedEmployees={JSON.parse(JSON.stringify(unlinkedEmployees))}
        />
    );
}
