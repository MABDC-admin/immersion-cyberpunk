import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const employeeId = session.user.employeeId;

        // Fetch Company Holidays
        const holidays = await prisma.companyHoliday.findMany();

        // Fetch Employee's approved leaves
        let leaves = [];
        if (employeeId) {
            leaves = await prisma.leaveRequest.findMany({
                where: { 
                    employeeId,
                    status: 'Approved'
                }
            });
        }

        // Fetch Employee's shifts
        let shifts = [];
        if (employeeId) {
            const employeeShifts = await prisma.employeeShift.findMany({
                where: { employeeId },
                include: {
                    shift: true
                }
            });
            shifts = employeeShifts;
        }

        // Normalize events
        const events = [
            ...holidays.map(h => ({
                id: `h_${h.id}`,
                title: h.title,
                start: h.date,
                end: h.date,
                allDay: true,
                type: 'Holiday',
                description: h.description
            })),
            ...leaves.map(l => ({
                id: `l_${l.id}`,
                title: `${l.type} - Approved`,
                start: l.startDate,
                end: l.endDate,
                allDay: true,
                type: 'Leave',
                description: l.reason
            }))
        ];

        // For shifts, we might need to expand recurring days if they choose a range
        // For now, let's just return the base objects and the frontend can handle display
        
        return NextResponse.json({
            events,
            shifts: shifts.map(s => s.shift)
        });
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return NextResponse.json({ error: 'Failed to fetch calendar data', details: error.message }, { status: 500 });
    }
}
