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

        const positions = await prisma.position.findMany({
            include: {
                _count: {
                    select: { employees: true }
                }
            },
            orderBy: { title: 'asc' }
        });

        return NextResponse.json(positions);
    } catch (error) {
        console.error('Fetch positions error:', error);
        return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, description, level } = await request.json();

        const newPos = await prisma.position.create({
            data: {
                title,
                description,
                level,
            }
        });

        return NextResponse.json(newPos, { status: 201 });
    } catch (error) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Position title already exists' }, { status: 400 });
        }
        console.error('Create position error:', error);
        return NextResponse.json({ error: 'Failed to create position' }, { status: 500 });
    }
}
