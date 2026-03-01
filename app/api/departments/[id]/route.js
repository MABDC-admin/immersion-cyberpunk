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
        const { name, description } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
        }

        const updatedDepartment = await prisma.department.update({
            where: { id: parseInt(id) },
            data: { name, description },
            include: {
                _count: {
                    select: { employees: true }
                }
            }
        });

        return NextResponse.json(updatedDepartment);
    } catch (error) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Department name already exists' }, { status: 400 });
        }
        console.error('Update department error:', error);
        return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
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

        const deptId = parseInt(id);

        // Disconnect employees by setting departmentId to null
        await prisma.employee.updateMany({
            where: { departmentId: deptId },
            data: { departmentId: null }
        });

        // Cascade delete associated job postings and their applicants
        const jobs = await prisma.jobPosting.findMany({ where: { departmentId: deptId } });
        for (const job of jobs) {
            await prisma.applicant.deleteMany({ where: { jobPostingId: job.id } });
        }
        await prisma.jobPosting.deleteMany({
            where: { departmentId: deptId }
        });

        await prisma.department.delete({
            where: { id: deptId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete department error:', error);
        return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
    }
}
