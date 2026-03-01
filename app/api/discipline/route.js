import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET all discipline records
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = session.user.roles.some(r => ['Super Admin', 'HR Admin'].includes(r));
        const employeeId = session.user.employeeId;

        let records;
        if (isAdmin) {
            // Admins see all
            records = await prisma.disciplineRecord.findMany({
                include: {
                    employee: {
                        select: { firstName: true, lastName: true, empNo: true }
                    },
                    issuer: {
                        select: { displayName: true }
                    }
                },
                orderBy: { date: 'desc' }
            });
        } else if (employeeId) {
            // Employees see only their own
            records = await prisma.disciplineRecord.findMany({
                where: { employeeId },
                include: {
                    issuer: {
                        select: { displayName: true }
                    }
                },
                orderBy: { date: 'desc' }
            });
        } else {
            return NextResponse.json([]);
        }

        return NextResponse.json(records);
    } catch (error) {
        console.error('Error fetching discipline records:', error);
        return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }
}

// POST create a new discipline record
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.roles.some(r => ['Super Admin', 'HR Admin'].includes(r))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { employeeId, type, reason, date, status } = body;

        if (!employeeId || !type || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const record = await prisma.disciplineRecord.create({
            data: {
                employeeId: parseInt(employeeId),
                type,
                reason,
                date: date ? new Date(date) : new Date(),
                issuerId: parseInt(session.user.id),
                status: status || 'Active'
            },
            include: {
                employee: {
                    select: { firstName: true, lastName: true }
                }
            }
        });

        // Log the action
        await prisma.auditLog.create({
            data: {
                action: 'DISCIPLINE_CREATED',
                entity: 'DisciplineRecord',
                entityId: record.id.toString(),
                userId: parseInt(session.user.id),
                details: `Issued ${type} to employee ID ${employeeId}`
            }
        });

        return NextResponse.json(record);
    } catch (error) {
        console.error('Error creating discipline record:', error);
        return NextResponse.json({ error: 'Failed to create record', details: error.message }, { status: 500 });
    }
}
