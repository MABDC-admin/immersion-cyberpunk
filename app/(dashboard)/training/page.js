import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TrainingClient from './TrainingClient';
import { prisma } from '@/lib/prisma';

export const metadata = {
    title: 'Training & LMS | HR Portal',
};

export default async function TrainingPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const roles = session?.user?.roles || [];
    const isHrOrAdmin = roles.includes('Super Admin') || roles.includes('HR Admin');

    if (!isHrOrAdmin) {
        // Eventually could redirect to an Employee learning portal
        redirect('/dashboard');
    }

    // Fetch active employees for assignment dropdowns
    const activeEmployees = await prisma.employee.findMany({
        where: { status: 'Active' },
        select: { id: true, firstName: true, lastName: true, empNo: true },
        orderBy: { firstName: 'asc' }
    });

    return <TrainingClient activeEmployees={activeEmployees} />;
}
