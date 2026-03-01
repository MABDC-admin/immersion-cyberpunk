import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = params;
        const body = await req.json();
        const { action, comments } = body; // action: 'Approve', 'Reject'

        const request = await prisma.approvalRequest.findUnique({
            where: { id: parseInt(id) },
            include: { workflow: { include: { steps: { orderBy: { stepOrder: 'asc' } } } } }
        });

        if (!request || request.status !== 'Pending') {
            return NextResponse.json({ error: 'Invalid request or already processed' }, { status: 400 });
        }

        const currentStep = request.workflow.steps.find(s => s.stepOrder === request.currentStepOrder);
        if (!currentStep) {
             return NextResponse.json({ error: 'Workflow step not found' }, { status: 500 });
        }
        
        // Ensure user is authorized to action this step
        const isAuthorized = currentStep.specificUserId === parseInt(session.user.id) || 
                             (currentStep.approverRole && session.user.roles?.includes(currentStep.approverRole));
        
        if (!isAuthorized && !session.user.roles?.includes('Super Admin')) {
             return NextResponse.json({ error: 'Not authorized to approve this step' }, { status: 403 });
        }

        let newComments = request.comments || '';
        if (comments) {
             const timestamp = new Date().toISOString().split('T')[0];
             newComments += `\n[${timestamp} - ${session.user.name || session.user.email} (${action})]: ${comments}`;
        }

        if (action === 'Reject') {
            const updated = await prisma.approvalRequest.update({
                where: { id: request.id },
                data: { status: 'Rejected', comments: newComments.trim() }
            });
            return NextResponse.json(updated);
        }

        if (action === 'Approve') {
            const isLastStep = request.currentStepOrder >= request.workflow.steps.length;
            
            const updated = await prisma.approvalRequest.update({
                where: { id: request.id },
                data: {
                    currentStepOrder: isLastStep ? request.currentStepOrder : request.currentStepOrder + 1,
                    status: isLastStep ? 'Approved' : 'Pending',
                    comments: newComments.trim()
                }
            });

            return NextResponse.json(updated);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error processing approval:', error);
        return NextResponse.json({ error: 'Failed to process approval', details: error.message }, { status: 500 });
    }
}
