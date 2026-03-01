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
        const { name, type, amount, description } = await request.json();

        if (!name || !type) {
            return NextResponse.json({ error: 'Name and Type are required' }, { status: 400 });
        }

        const updatedBenefit = await prisma.benefit.update({
            where: { id: parseInt(id) },
            data: {
                name,
                type,
                amount: amount ? parseFloat(amount) : null,
                description
            },
            include: {
                _count: {
                    select: { employees: true }
                }
            }
        });

        return NextResponse.json(updatedBenefit);
    } catch (error) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Benefit name already exists' }, { status: 400 });
        }
        console.error('Update benefit error:', error);
        return NextResponse.json({ error: 'Failed to update benefit' }, { status: 500 });
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

        const benId = parseInt(id);

        // Delete associated EmployeeBenefit records
        await prisma.employeeBenefit.deleteMany({
            where: { benefitId: benId }
        });

        await prisma.benefit.delete({
            where: { id: benId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete benefit error:', error);
        return NextResponse.json({ error: 'Failed to delete benefit' }, { status: 500 });
    }
}
