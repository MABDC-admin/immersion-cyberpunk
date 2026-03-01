import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const workflows = await prisma.approvalWorkflow.findMany({
            include: {
                steps: {
                    orderBy: { stepOrder: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(workflows);
    } catch (error) {
        console.error('Error fetching workflows:', error);
        return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.roles.includes('Super Admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, entityType, steps } = body;

        const workflow = await prisma.approvalWorkflow.create({
            data: {
                name,
                entityType,
                steps: {
                    create: steps.map((step, index) => ({
                        stepOrder: index + 1,
                        approverRole: step.approverRole || null,
                        specificUserId: step.specificUserId ? parseInt(step.specificUserId) : null
                    }))
                }
            },
            include: { steps: true }
        });

        await prisma.auditLog.create({
            data: {
                action: 'WORKFLOW_CREATED',
                entity: 'ApprovalWorkflow',
                entityId: workflow.id.toString(),
                userId: parseInt(session.user.id),
                details: `Created workflow: ${name}`
            }
        });

        return NextResponse.json(workflow);
    } catch (error) {
        console.error('Error creating workflow:', error);
        return NextResponse.json({ error: 'Failed to create workflow', details: error.message }, { status: 500 });
    }
}
