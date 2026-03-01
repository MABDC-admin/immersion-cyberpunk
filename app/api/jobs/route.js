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

        const jobs = await prisma.jobPosting.findMany({
            include: {
                department: true,
                _count: {
                    select: { applicants: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(jobs);
    } catch (error) {
        console.error('Fetch job postings error:', error);
        return NextResponse.json({ error: 'Failed to fetch job postings' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, departmentId, location, type, description } = await request.json();

        if (!title || !departmentId) {
            return NextResponse.json({ error: 'Title and Department are required' }, { status: 400 });
        }

        const newJob = await prisma.jobPosting.create({
            data: {
                title,
                departmentId: parseInt(departmentId),
                location,
                type,
                status: 'Open',
                description
            },
            include: {
                department: true,
                _count: {
                    select: { applicants: true }
                }
            }
        });

        return NextResponse.json(newJob, { status: 201 });
    } catch (error) {
        console.error('Create job error:', error);
        return NextResponse.json({ error: 'Failed to create job posting' }, { status: 500 });
    }
}
