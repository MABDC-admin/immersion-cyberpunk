import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        // Employees can also hit this if they are marking their own course as complete, 
        // but for now, we'll strict it to HR/Admins
        if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { status, score, completionDate } = await request.json();

        const updatedEnrollment = await prisma.employeeTraining.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(score !== undefined && { score: parseInt(score) }),
                ...(completionDate === null ? { completionDate: null } : completionDate ? { completionDate: new Date(completionDate) } : {})
            },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true, empNo: true }
                },
                course: true
            }
        });

        return NextResponse.json(updatedEnrollment);
    } catch (error) {
        console.error('Update enrollment error:', error);
        return NextResponse.json({ error: 'Failed to update enrollment' }, { status: 500 });
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

        await prisma.employeeTraining.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete enrollment error:', error);
        return NextResponse.json({ error: 'Failed to remove enrollment' }, { status: 500 });
    }
}
