import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.employeeId) {
            return NextResponse.json({ error: 'Unauthorized or not an employee' }, { status: 401 });
        }

        const employee = await prisma.employee.findUnique({
            where: { id: session.user.employeeId },
            include: {
                documents: true,
            }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
        }

        return NextResponse.json(employee);
    } catch (error) {
        console.error('Fetch profile error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user.employeeId) {
            return NextResponse.json({ error: 'Unauthorized or not an employee' }, { status: 401 });
        }

        const data = await request.json();
        const { phone, avatarUrl } = data; // Only allow updating phone and avatar by self

        const updated = await prisma.employee.update({
            where: { id: session.user.employeeId },
            data: {
                ...(phone !== undefined && { phone }),
                ...(avatarUrl !== undefined && { avatarUrl }),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
