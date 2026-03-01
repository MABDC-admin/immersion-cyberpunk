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
        const { title, level, description } = await request.json();

        if (!title) {
            return NextResponse.json({ error: 'Position title is required' }, { status: 400 });
        }

        const updatedPosition = await prisma.position.update({
            where: { id: parseInt(id) },
            data: { title, level, description },
            include: {
                _count: {
                    select: { employees: true }
                }
            }
        });

        return NextResponse.json(updatedPosition);
    } catch (error) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Position title already exists' }, { status: 400 });
        }
        console.error('Update position error:', error);
        return NextResponse.json({ error: 'Failed to update position' }, { status: 500 });
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

        const posId = parseInt(id);

        // Disconnect employees by setting positionId to null
        await prisma.employee.updateMany({
            where: { positionId: posId },
            data: { positionId: null }
        });

        await prisma.position.delete({
            where: { id: posId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete position error:', error);
        return NextResponse.json({ error: 'Failed to delete position' }, { status: 500 });
    }
}
