import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const data = await request.json();

        // Calculate total hours
        const existing = await prisma.attendance.findUnique({ where: { id: parseInt(id) } });
        let totalHours = null;
        let overtimeHours = null;

        if (existing?.timeIn && data.timeOut) {
            const [sh, sm] = existing.timeIn.split(':').map(Number);
            const [eh, em] = data.timeOut.split(':').map(Number);
            totalHours = Math.max(0, (eh + em / 60) - (sh + sm / 60));
            overtimeHours = Math.max(0, totalHours - 8);
            totalHours = Math.round(totalHours * 10) / 10;
            overtimeHours = Math.round(overtimeHours * 10) / 10;
        }

        const record = await prisma.attendance.update({
            where: { id: parseInt(id) },
            data: { ...data, totalHours, overtimeHours },
            include: { employee: true },
        });
        return NextResponse.json(record);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        await prisma.attendance.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
