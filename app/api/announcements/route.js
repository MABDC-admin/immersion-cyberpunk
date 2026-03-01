import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const data = await request.json();
        const announcement = await prisma.announcement.create({ data });
        return NextResponse.json(announcement);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
