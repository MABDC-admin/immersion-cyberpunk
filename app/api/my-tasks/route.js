import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.employeeId) {
            return NextResponse.json({ error: 'Unauthorized or not linked to an employee' }, { status: 401 });
        }

        const employeeId = session.user.employeeId;

        // Fetch Onboarding Tasks
        const onboardingTasks = await prisma.employeeOnboarding.findMany({
            where: { employeeId },
            include: {
                task: true
            }
        });

        // Fetch Training Courses
        const trainingCourses = await prisma.employeeTraining.findMany({
            where: { employeeId },
            include: {
                course: true
            }
        });

        // Normalize data into a single tasks array
        const tasks = [
            ...onboardingTasks.map(ot => ({
                id: `ob_${ot.id}`,
                type: 'Onboarding',
                title: ot.task.title,
                description: ot.task.description,
                status: ot.status, // Pending, Completed
                date: ot.completedAt || ot.createdAt
            })),
            ...trainingCourses.map(tc => ({
                id: `tr_${tc.id}`,
                type: 'Training',
                title: tc.course.title,
                description: tc.course.description,
                status: tc.status, // Enrolled, In Progress, Completed
                date: tc.completedAt || tc.enrolledAt
            }))
        ];

        return NextResponse.json(tasks);
    } catch (error) {
        console.error('Error fetching my tasks:', error);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}
