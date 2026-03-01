import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (!session.user.roles?.includes('Super Admin') && !session.user.roles?.includes('HR Admin'))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const policyId = parseInt(params.id);
        const { title, content, version, isPublished } = await request.json();

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (version !== undefined) updateData.version = version;
        if (isPublished !== undefined) updateData.isPublished = isPublished;

        const updatedPolicy = await prisma.companyPolicy.update({
            where: { id: policyId },
            data: updateData
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'POLICY_UPDATED',
                entity: 'CompanyPolicy',
                entityId: policyId.toString(),
                userId: parseInt(session.user.id),
                details: JSON.stringify(updateData)
            }
        });

        return NextResponse.json(updatedPolicy);
    } catch (error) {
        console.error('Update policy error:', error);
        return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.roles?.includes('Super Admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const policyId = parseInt(params.id);
        await prisma.companyPolicy.delete({ where: { id: policyId } });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'POLICY_DELETED',
                entity: 'CompanyPolicy',
                entityId: policyId.toString(),
                userId: parseInt(session.user.id)
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete policy error:', error);
        return NextResponse.json({ error: 'Failed to delete policy' }, { status: 500 });
    }
}
