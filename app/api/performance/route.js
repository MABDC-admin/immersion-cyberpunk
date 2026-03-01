import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');

        let whereClause = {};
        if (employeeId) {
            whereClause = {
                OR: [
                    { revieweeId: parseInt(employeeId) },
                    { reviewerId: parseInt(employeeId) }
                ]
            };
        }

        const reviews = await prisma.performanceReview.findMany({
            where: whereClause,
            include: {
                reviewee: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true, empNo: true }
                },
                reviewer: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true, empNo: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(reviews);
    } catch (error) {
        console.error('Fetch performance reviews error:', error);
        return NextResponse.json({ error: 'Failed to fetch performance reviews' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        // Only HR and Super Admin can create reviews right now, or maybe Managers? Let's stick to HR/Admin.
        if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin') && !roles.includes('Manager'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { revieweeId, reviewerId, period, rating, comments, goals, status } = data;

        if (!revieweeId || !reviewerId || !period) {
            return NextResponse.json({ error: 'Reviewee, Reviewer, and Period are required' }, { status: 400 });
        }

        const newReview = await prisma.performanceReview.create({
            data: {
                revieweeId: parseInt(revieweeId),
                reviewerId: parseInt(reviewerId),
                period,
                rating: parseInt(rating) || 3,
                comments,
                goals,
                status: status || 'Draft'
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

        return NextResponse.json(newReview, { status: 201 });
    } catch (error) {
        console.error('Create performance review error:', error);
        return NextResponse.json({ error: 'Failed to create performance review' }, { status: 500 });
    }
}
