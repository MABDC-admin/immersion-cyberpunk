import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || !roles.includes('Super Admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await prisma.companySetting.findMany({
            orderBy: { key: 'asc' }
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Fetch settings error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || !roles.includes('Super Admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const updates = await request.json(); // Array of { key, value }

        if (!Array.isArray(updates)) {
            return NextResponse.json({ error: 'Expected an array of setting updates' }, { status: 400 });
        }

        // Run updates in a transaction
        const transaction = updates.map(update =>
            prisma.companySetting.update({
                where: { key: update.key },
                data: { value: update.value }
            })
        );

        await prisma.$transaction(transaction);

        return NextResponse.json({ message: 'Settings updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('Update settings error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
