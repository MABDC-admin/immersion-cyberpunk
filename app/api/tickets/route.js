import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const assignedToId = searchParams.get('assignedToId');
        const createdById = searchParams.get('createdById');
        const status = searchParams.get('status');

        let whereClause = {};

        // Normal employees only see their own tickets
        if (!session.user.roles?.includes('Super Admin') && !session.user.roles?.includes('HR Admin')) {
            whereClause = { createdById: parseInt(session.user.id) };
        } else {
            // Admins can filter
            if (assignedToId) whereClause.assignedToId = parseInt(assignedToId);
            if (createdById) whereClause.createdById = parseInt(createdById);
        }

        if (status) whereClause.status = status;

        const tickets = await prisma.ticket.findMany({
            where: whereClause,
            include: {
                createdBy: {
                    select: { id: true, displayName: true, email: true }
                },
                assignedTo: {
                    select: { id: true, displayName: true, email: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(tickets);
    } catch (error) {
        console.error('Fetch tickets error:', error);
        return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { subject, body, priority, assignedToId } = await request.json();

        // Anyone can create a ticket. Employees can't assign it (defaults to null)
        let resolvedAssignee = null;
        if (session.user.roles?.includes('Super Admin') || session.user.roles?.includes('HR Admin')) {
            resolvedAssignee = assignedToId ? parseInt(assignedToId) : null;
        }

        const ticket = await prisma.ticket.create({
            data: {
                subject,
                body,
                priority: priority || 'Normal',
                status: 'Open',
                createdById: parseInt(session.user.id),
                assignedToId: resolvedAssignee
            },
            include: {
                createdBy: {
                    select: { id: true, displayName: true, email: true }
                },
                assignedTo: {
                    select: { id: true, displayName: true, email: true }
                }
            }
        });

        // Log the creation
        await prisma.auditLog.create({
            data: {
                action: 'TICKET_CREATED',
                entity: 'Ticket',
                entityId: ticket.id.toString(),
                userId: parseInt(session.user.id),
                details: JSON.stringify({ subject: ticket.subject, priority: ticket.priority })
            }
        });

        return NextResponse.json(ticket, { status: 201 });
    } catch (error) {
        console.error('Create ticket error:', error);
        return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
    }
}

