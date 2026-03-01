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
        const courseId = searchParams.get('courseId');

        let whereClause = {};
        if (employeeId) {
            whereClause.employeeId = parseInt(employeeId);
        }
        if (courseId) {
            whereClause.courseId = courseId;
        }

        const enrollments = await prisma.employeeTraining.findMany({
            where: whereClause,
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true, empNo: true }
                },
                course: true
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(enrollments);
    } catch (error) {
        console.error('Fetch enrollments error:', error);
        return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { employeeId, courseId, status, score, completionDate } = await request.json();

        if (!employeeId || !courseId) {
            return NextResponse.json({ error: 'Employee and Course are required' }, { status: 400 });
        }

        // Check for existing enrollment
        const existing = await prisma.employeeTraining.findUnique({
            where: {
                employeeId_courseId: {
                    employeeId: parseInt(employeeId),
                    courseId: courseId
                }
            }
        });

        if (existing) {
            return NextResponse.json({ error: 'Employee is already enrolled in this course' }, { status: 400 });
        }

        const newEnrollment = await prisma.employeeTraining.create({
            data: {
                employeeId: parseInt(employeeId),
                courseId: courseId,
                status: status || 'Enrolled',
                ...(score !== undefined && { score: parseInt(score) }),
                ...(completionDate && { completionDate: new Date(completionDate) })
            },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true, empNo: true }
                },
                course: true
            }
        });

        return NextResponse.json(newEnrollment, { status: 201 });
    } catch (error) {
        console.error('Create enrollment error:', error);
        return NextResponse.json({ error: 'Failed to assign course' }, { status: 500 });
    }
}
