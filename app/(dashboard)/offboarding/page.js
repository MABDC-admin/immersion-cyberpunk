import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import OffboardingClient from './OffboardingClient';
import { prisma } from '@/lib/prisma';

export const metadata = {
    title: 'Offboarding | MABDC Portal',
};

export default async function OffboardingPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.roles.some(r => ['Super Admin', 'HR Admin'].includes(r))) {
        redirect('/dashboard');
    }

    const employees = await prisma.employee.findMany({
        where: { status: 'Active' },
        select: { id: true, firstName: true, lastName: true, empNo: true },
        orderBy: { firstName: 'asc' }
    });

    return <OffboardingClient employees={JSON.parse(JSON.stringify(employees))} currentUser={session.user} />;
}
