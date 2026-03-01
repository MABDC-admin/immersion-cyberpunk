import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const shifts = await prisma.shift.findMany({
            include: {
                _count: {
                    select: { employees: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(shifts);
    } catch (error) {
        console.error('Fetch shifts error:', error);
        return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, startTime, endTime, workDays, description } = await request.json();

        // Basic validation
        if (!name || !startTime || !endTime) {
            return NextResponse.json({ error: 'Name, Start Time, and End Time are required' }, { status: 400 });
        }

        // Validate time format (HH:MM or HH:MM:SS)
        const timeRegex = /^([01]\d|2[0-3]):?([0-5]\d)(:?[0-5]\d)?$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            return NextResponse.json({ error: 'Start and end time must be in HH:MM format' }, { status: 400 });
        }

        const newShift = await prisma.shift.create({
            data: {
                name,
                startTime,
                endTime,
                workDays: workDays || "1,2,3,4,5" // Default: Mon-Fri
            }
        });

        return NextResponse.json(newShift, { status: 201 });
    } catch (error) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Shift name already exists' }, { status: 400 });
        }
        console.error('Create shift error:', error);
        return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
    }
}
