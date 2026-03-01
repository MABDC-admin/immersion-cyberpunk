import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { name, startTime, endTime, workDays, description } = await request.json();

        if (!name || !startTime || !endTime || !workDays) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const updatedShift = await prisma.shift.update({
            where: { id: parseInt(id) },
            data: {
                name,
                startTime,
                endTime,
                workDays,
                description
            },
            include: {
                _count: {
                    select: { employees: true }
                }
            }
        });

        return NextResponse.json(updatedShift);
    } catch (error) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'A shift with this name already exists' }, { status: 400 });
        }
        console.error('Update shift error:', error);
        return NextResponse.json({ error: 'Failed to update shift' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const shiftId = parseInt(id);

        // Delete associated EmployeeShift records
        await prisma.employeeShift.deleteMany({
            where: { shiftId: shiftId }
        });

        await prisma.shift.delete({
            where: { id: shiftId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete shift error:', error);
        return NextResponse.json({ error: 'Failed to delete shift' }, { status: 500 });
    }
}
