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
        const { type, reason, date, status } = body;

        const record = await prisma.disciplineRecord.update({
            where: { id: parseInt(id) },
            data: {
                type,
                reason,
                date: date ? new Date(date) : undefined,
                status
            }
        });

        return NextResponse.json(record);
    } catch (error) {
        console.error('Error updating discipline record:', error);
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
        await prisma.disciplineRecord.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting discipline record:', error);
        return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
    }
}
