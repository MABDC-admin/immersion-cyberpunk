import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.roles.some(r => ['Super Admin', 'HR Admin'].includes(r))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await req.json();
        const { status, resignationDate, lastWorkingDay, checklist, settlement } = body;

        const record = await prisma.offboardingRecord.update({
            where: { id: parseInt(id) },
            data: {
                status,
                resignationDate: resignationDate ? new Date(resignationDate) : undefined,
                lastWorkingDay: lastWorkingDay ? new Date(lastWorkingDay) : undefined,
                checklist: checklist ? JSON.stringify(checklist) : undefined,
                settlement: settlement !== undefined ? parseFloat(settlement) : undefined
            }
        });

        // If status becomes 'Completed', update Employee status to 'Inactive'
        if (status === 'Completed') {
            await prisma.employee.update({
                where: { id: record.employeeId },
                data: { status: 'Inactive' }
            });
        }

        return NextResponse.json(record);
    } catch (error) {
        console.error('Error updating offboarding record:', error);
        return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.roles.includes('Super Admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        await prisma.offboardingRecord.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting offboarding record:', error);
        return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
    }
}
