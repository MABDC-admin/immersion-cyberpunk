import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PerformanceClient from './PerformanceClient';
import { prisma } from '@/lib/prisma';

export const metadata = {
    title: 'Performance Reviews | HR Portal',
};

export default async function PerformancePage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const roles = session?.user?.roles || [];
    const isHrOrAdmin = roles.includes('Super Admin') || roles.includes('HR Admin') || roles.includes('Manager');

    if (!isHrOrAdmin) {
        // Normal employees should probably only see their own reviews on their profile page.
        // For now, redirect them if they try to access the master performance board.
        redirect('/dashboard');
    }

    // Fetch active employees for the Reviewee and Reviewer dropdowns
    // To keep the payload light, we just get IDs and Names
    const activeEmployees = await prisma.employee.findMany({
        where: { status: 'Active' },
        select: { id: true, firstName: true, lastName: true, email: true, empNo: true },
        orderBy: { firstName: 'asc' }
    });

    return <PerformanceClient activeEmployees={activeEmployees} />;
}
