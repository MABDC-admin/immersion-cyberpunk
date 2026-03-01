import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Must be linked to an employee profile to have payslips
        if (!session.user.employeeId) {
            return NextResponse.json({ error: 'No employee profile linked to user account' }, { status: 404 });
        }

        const payslips = await prisma.payrollItem.findMany({
            where: {
                employeeId: session.user.employeeId
            },
            include: {
                payrollRun: true,
                employee: {
                    include: {
                        department: true,
                        positionRel: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(payslips);

    } catch (error) {
        console.error('My Payslips API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch payslips' }, { status: 500 });
    }
}
