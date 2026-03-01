import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        
        // Only Super Admins can access audit logs for security reasons
        if (!session || !session.user.roles?.includes('Super Admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 100;

        const auditLogs = await prisma.auditLog.findMany({
            include: {
                user: {
                    select: { id: true, displayName: true, email: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        return NextResponse.json(auditLogs);
    } catch (error) {
        console.error('Fetch audit logs error:', error);
        return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
}
