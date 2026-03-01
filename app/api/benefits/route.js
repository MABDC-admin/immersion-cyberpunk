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

        const benefits = await prisma.benefit.findMany({
            include: {
                _count: {
                    select: { employees: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(benefits);
    } catch (error) {
        console.error('Fetch benefits error:', error);
        return NextResponse.json({ error: 'Failed to fetch benefits' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, type, amount, description } = await request.json();

        if (!name || !type) {
            return NextResponse.json({ error: 'Name and Type are required' }, { status: 400 });
        }

        const newBenefit = await prisma.benefit.create({
            data: {
                name,
                type,
                amount: amount ? parseFloat(amount) : null,
                description
            }
        });

        return NextResponse.json(newBenefit, { status: 201 });
    } catch (error) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Benefit name already exists' }, { status: 400 });
        }
        console.error('Create benefit error:', error);
        return NextResponse.json({ error: 'Failed to create benefit' }, { status: 500 });
    }
}
