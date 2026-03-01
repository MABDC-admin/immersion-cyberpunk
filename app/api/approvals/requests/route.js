import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // User can only see requests where they are the current approver OR requests they submitted
        const userId = parseInt(session.user.id);
        const userRoles = session.user.roles || [];

        const pendingRequests = await prisma.approvalRequest.findMany({
            where: {
                // Find requests where the current step matches user's role/id, OR user is requester
                OR: [
                    { requesterId: userId },
                    {
                        status: 'Pending',
                        workflow: {
                            steps: {
                                some: {
                                    // Current step matches this step's order
                                    // But we can't do direct cross-field comparison in standard Prisma `where`.
                                    // So we'll fetch all Pending requests and filter in JS to be safe and flexible.
                                }
                            }
                        }
                    }
                ]
            },
            include: {
                requester: { select: { firstName: true, lastName: true, empNo: true, department: { select: { name: true } } } },
                workflow: { include: { steps: { orderBy: { stepOrder: 'asc' } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Filter for exactly actionable requests
        const actionableRequests = pendingRequests.filter(req => {
            if (req.requesterId === userId) return true; // Can see own requests (always)
            
            if (req.status !== 'Pending') return false;
            
            const currentStep = req.workflow.steps.find(s => s.stepOrder === req.currentStepOrder);
            if (!currentStep) return false;

            // Check if user is the specific approver
            if (currentStep.specificUserId === userId) return true;
            
            // Check if user has the required approver role
            if (currentStep.approverRole && userRoles.includes(currentStep.approverRole)) return true;

            // TODO: In a more advanced version, check if role is "Manager" and user is the direct supervisor of requester.
            
            return false;
        });

        return NextResponse.json(actionableRequests);
    } catch (error) {
        console.error('Error fetching approval requests:', error);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { workflowId, comments, targetEntityId } = body;

        const approvalRequest = await prisma.approvalRequest.create({
            data: {
                workflowId: parseInt(workflowId),
                requesterId: parseInt(session.user.id),
                targetEntityId: targetEntityId ? parseInt(targetEntityId) : null,
                comments
            },
            include: { workflow: true }
        });

        return NextResponse.json(approvalRequest);
    } catch (error) {
        console.error('Error creating approval request:', error);
        return NextResponse.json({ error: 'Failed to submit approval request', details: error.message }, { status: 500 });
    }
}
