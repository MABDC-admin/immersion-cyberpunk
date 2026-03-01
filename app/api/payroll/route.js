import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const data = await request.json();
        const run = await prisma.payrollRun.create({ data });
        return NextResponse.json(run);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
