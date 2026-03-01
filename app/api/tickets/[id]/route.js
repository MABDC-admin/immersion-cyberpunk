import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const ticketId = parseInt(params.id);
        const { status, assignedToId, body } = await request.json();

        const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
        if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

        // Ensure authorization to edit
        if (!session.user.roles?.includes('Super Admin') && !session.user.roles?.includes('HR Admin')) {
            if (ticket.createdById !== parseInt(session.user.id)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (body) updateData.body = body; // Append or update thread
        if (assignedToId && (session.user.roles?.includes('Super Admin') || session.user.roles?.includes('HR Admin'))) {
            updateData.assignedToId = parseInt(assignedToId);
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: updateData,
            include: {
                createdBy: { select: { id: true, displayName: true, email: true } },
                assignedTo: { select: { id: true, displayName: true, email: true } }
            }
        });

        // Log the update
        await prisma.auditLog.create({
            data: {
                action: 'TICKET_UPDATED',
                entity: 'Ticket',
                entityId: ticket.id.toString(),
                userId: parseInt(session.user.id),
                details: JSON.stringify({ status: updateData.status, assignedToId: updateData.assignedToId })
            }
        });

        return NextResponse.json(updatedTicket);
    } catch (error) {
        console.error('Update ticket error:', error);
        return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.roles?.includes('Super Admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ticketId = parseInt(params.id);
        await prisma.ticket.delete({ where: { id: ticketId } });

        // Log the deletion
        await prisma.auditLog.create({
            data: {
                action: 'TICKET_DELETED',
                entity: 'Ticket',
                entityId: ticketId.toString(),
                userId: parseInt(session.user.id),
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete ticket error:', error);
        return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 });
    }
}
