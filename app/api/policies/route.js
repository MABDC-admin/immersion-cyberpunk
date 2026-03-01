import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Normal employees only see published policies. Admins see all.
        let whereClause = {};
        if (!session.user.roles?.includes('Super Admin') && !session.user.roles?.includes('HR Admin')) {
            whereClause = { isPublished: true };
        }

        const policies = await prisma.companyPolicy.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(policies);
    } catch (error) {
        console.error('Fetch policies error:', error);
        return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (!session.user.roles?.includes('Super Admin') && !session.user.roles?.includes('HR Admin'))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { title, content, version, isPublished } = await request.json();

        const policy = await prisma.companyPolicy.create({
            data: {
                title,
                content,
                version: version || '1.0',
                isPublished: isPublished || false
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'POLICY_CREATED',
                entity: 'CompanyPolicy',
                entityId: policy.id.toString(),
                userId: parseInt(session.user.id),
                details: JSON.stringify({ title: policy.title })
            }
        });

        return NextResponse.json(policy, { status: 201 });
    } catch (error) {
        console.error('Create policy error:', error);
        return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
    }
}
