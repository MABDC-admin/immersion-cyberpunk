import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!roles.includes('Super Admin') && !roles.includes('HR Admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await params;

        // Delete all child payroll items first
        await prisma.payrollItem.deleteMany({
            where: { payrollRunId: parseInt(id) }
        });

        // Delete the run
        await prisma.payrollRun.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
