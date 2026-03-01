import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.roles.some(r => ['Super Admin', 'HR Admin'].includes(r))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const records = await prisma.offboardingRecord.findMany({
            include: {
                employee: {
                    select: { firstName: true, lastName: true, empNo: true, department: { select: { name: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(records);
    } catch (error) {
        console.error('Error fetching offboarding records:', error);
        return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.roles.some(r => ['Super Admin', 'HR Admin'].includes(r))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { employeeId, resignationDate, lastWorkingDay, isTerminated, reason, settlement } = body;

        // Default checklist
        const defaultChecklist = JSON.stringify([
            { item: "Return Laptop & Accessories", status: "Pending" },
            { item: "Hand over ID Card & Access Keys", status: "Pending" },
            { item: "Exit Interview Completed", status: "Pending" },
            { item: "Final Settlement Calculation", status: "Pending" },
            { item: "Visa Cancellation Initiated", status: "Pending" }
        ]);

        const record = await prisma.offboardingRecord.create({
            data: {
                employeeId: parseInt(employeeId),
                resignationDate: resignationDate ? new Date(resignationDate) : null,
                lastWorkingDay: lastWorkingDay ? new Date(lastWorkingDay) : null,
                isTerminated: !!isTerminated,
                reason,
                settlement: parseFloat(settlement || 0),
                checklist: defaultChecklist,
                status: 'Initiated'
            }
        });

        // Update employee status to 'Resigned' or 'Terminated' if needed, but usually we wait for 'Completed' status
        
        await prisma.auditLog.create({
            data: {
                action: 'OFFBOARDING_INITIATED',
                entity: 'OffboardingRecord',
                entityId: record.id.toString(),
                userId: parseInt(session.user.id),
                details: `Initiated offboarding for employee ID ${employeeId}`
            }
        });

        return NextResponse.json(record);
    } catch (error) {
        console.error('Error initiating offboarding:', error);
        return NextResponse.json({ error: 'Failed to initiate offboarding', details: error.message }, { status: 500 });
    }
}
