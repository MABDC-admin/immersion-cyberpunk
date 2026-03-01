import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DisciplineClient from './DisciplineClient';
import { prisma } from '@/lib/prisma';

export const metadata = {
    title: 'Discipline | MABDC Portal',
};

export default async function DisciplinePage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const isAdmin = session.user.roles.some(r => ['Super Admin', 'HR Admin'].includes(r));

    // Fetch departments for filtering if needed, and employees for the dropdown
    let employees = [];
    if (isAdmin) {
        employees = await prisma.employee.findMany({
            select: { id: true, firstName: true, lastName: true, empNo: true },
            orderBy: { firstName: 'asc' }
        });
    }

    return <DisciplineClient employees={JSON.parse(JSON.stringify(employees))} isAdmin={isAdmin} currentUser={session.user} />;
}
