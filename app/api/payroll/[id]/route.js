import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const data = await request.json();
        const run = await prisma.payrollRun.update({
            where: { id: parseInt(id) },
            data,
        });
        return NextResponse.json(run);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
