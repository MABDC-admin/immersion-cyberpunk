import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin') && !roles.includes('Manager'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const data = await request.json();
        const { revieweeId, reviewerId, period, rating, comments, goals, status } = data;

        const updatedReview = await prisma.performanceReview.update({
            where: { id },
            data: {
                ...(revieweeId && { revieweeId: parseInt(revieweeId) }),
                ...(reviewerId && { reviewerId: parseInt(reviewerId) }),
                ...(period && { period }),
                ...(rating && { rating: parseInt(rating) }),
                ...(comments !== undefined && { comments }),
                ...(goals !== undefined && { goals }),
                ...(status && { status })
            },
            include: {
                reviewee: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true, empNo: true }
                },
                reviewer: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true, empNo: true }
                }
            }
        });

        return NextResponse.json(updatedReview);
    } catch (error) {
        console.error('Update performance review error:', error);
        return NextResponse.json({ error: 'Failed to update performance review' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await prisma.performanceReview.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete performance review error:', error);
        return NextResponse.json({ error: 'Failed to delete performance review' }, { status: 500 });
    }
}
