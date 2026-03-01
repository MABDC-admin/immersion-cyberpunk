import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');

        const whereClause = employeeId ? { employeeId: parseInt(employeeId) } : {};

        const requests = await prisma.leaveRequest.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { leaveType: true, employee: true }
        });
        
        return NextResponse.json(requests);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const leave = await prisma.leaveRequest.create({
            data,
            include: { employee: true, leaveType: true },
        });
        return NextResponse.json(leave);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
