import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.employeeId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const requests = await prisma.employeeRequest.findMany({
            where: { employeeId: session.user.employeeId },
            orderBy: { requestDate: 'desc' },
            include: { employee: true }
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error('Fetch requests error:', error);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.employeeId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, description } = await request.json();

        const newRequest = await prisma.employeeRequest.create({
            data: {
                employeeId: session.user.employeeId,
                type,
                description,
                status: 'Pending',
            }
        });

        return NextResponse.json(newRequest, { status: 201 });
    } catch (error) {
        console.error('Create request error:', error);
        return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }
}
