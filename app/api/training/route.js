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

        const courses = await prisma.trainingCourse.findMany({
            include: {
                _count: {
                    select: { enrollments: true }
                }
            },
            orderBy: { title: 'asc' },
        });

        return NextResponse.json(courses);
    } catch (error) {
        console.error('Fetch training courses error:', error);
        return NextResponse.json({ error: 'Failed to fetch training courses' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, description, instructor, duration } = await request.json();

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const newCourse = await prisma.trainingCourse.create({
            data: {
                title,
                description,
                instructor,
                duration: parseInt(duration) || 60
            },
            include: {
                _count: {
                    select: { enrollments: true }
                }
            }
        });

        return NextResponse.json(newCourse, { status: 201 });
    } catch (error) {
        console.error('Create training course error:', error);
        return NextResponse.json({ error: 'Failed to create training course' }, { status: 500 });
    }
}
