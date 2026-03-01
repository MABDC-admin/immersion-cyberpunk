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
        const { title, description, instructor, duration } = await request.json();

        const updatedCourse = await prisma.trainingCourse.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(instructor !== undefined && { instructor }),
                ...(duration !== undefined && { duration: parseInt(duration) })
            },
            include: {
                _count: {
                    select: { enrollments: true }
                }
            }
        });

        return NextResponse.json(updatedCourse);
    } catch (error) {
        console.error('Update training course error:', error);
        return NextResponse.json({ error: 'Failed to update training course' }, { status: 500 });
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

        // Check if there are active enrollments
        const enrollmentsCount = await prisma.employeeTraining.count({
            where: { courseId: id }
        });

        if (enrollmentsCount > 0) {
            return NextResponse.json({ error: 'Cannot delete course with active employee enrollments. Please remove enrollments first.' }, { status: 400 });
        }

        await prisma.trainingCourse.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete training course error:', error);
        return NextResponse.json({ error: 'Failed to delete training course' }, { status: 500 });
    }
}
