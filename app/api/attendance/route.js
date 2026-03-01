import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');

        const whereClause = employeeId ? { employeeId: parseInt(employeeId) } : {};

        const records = await prisma.attendance.findMany({
            where: whereClause,
            orderBy: { date: 'desc' },
            include: { employee: true }
        });
        
        return NextResponse.json(records);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const record = await prisma.attendance.create({
            data,
            include: { employee: true },
        });
        return NextResponse.json(record);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
