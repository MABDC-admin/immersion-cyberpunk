import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const data = await request.json();
        const item = await prisma.payrollItem.create({
            data: {
                payrollRunId: parseInt(id),
                ...data,
            },
            include: { employee: true },
        });
        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
