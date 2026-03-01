import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Prevent caching to always get live status
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const start = Date.now();
        // A simple query to ping the database
        await prisma.$queryRaw`SELECT 1`;
        const latency = Date.now() - start;
        
        return NextResponse.json({ status: 'connected', latency });
    } catch (error) {
        console.error('Database connection heartbeat failed:', error);
        return NextResponse.json({ status: 'disconnected', error: error.message }, { status: 500 });
    }
}
