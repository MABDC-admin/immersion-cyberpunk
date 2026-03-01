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

        // Fetch standard onboarding tasks
        const tasks = await prisma.onboardingTask.findMany({
            orderBy: { dayDue: 'asc' }
        });

        // Fetch Employees who have onboarding tasks assigned
        const activeOnboardings = await prisma.employee.findMany({
            where: {
                onboardingTasks: { some: {} }
            },
            include: {
                department: true,
                positionRel: true,
                onboardingTasks: {
                    include: { task: true }
                }
            }
        });

        return NextResponse.json({ tasks, activeOnboardings });
    } catch (error) {
        console.error('Fetch onboarding error:', error);
        return NextResponse.json({ error: 'Failed to fetch onboarding data' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { employeeId, taskIds } = await request.json();

        if (!employeeId || !taskIds || !Array.isArray(taskIds)) {
            return NextResponse.json({ error: 'Employee ID and an array of Task IDs are required' }, { status: 400 });
        }

        // Create the assignments
        const assignments = taskIds.map(taskId => ({
            employeeId: parseInt(employeeId),
            taskId: taskId,
            status: 'Pending'
        }));

        // SQLite does not support skipDuplicates with createMany, so we use a transaction sequence
        const transaction = assignments.map(assignment =>
            prisma.employeeOnboarding.upsert({
                where: {
                    employeeId_taskId: {
                        employeeId: assignment.employeeId,
                        taskId: assignment.taskId
                    }
                },
                update: {},
                create: assignment
            })
        );
        await prisma.$transaction(transaction);

        const updatedEmployee = await prisma.employee.findUnique({
            where: { id: parseInt(employeeId) },
            include: {
                department: true,
                positionRel: true,
                onboardingTasks: {
                    include: { task: true }
                }
            }
        });

        return NextResponse.json(updatedEmployee, { status: 201 });
    } catch (error) {
        console.error('Assign onboarding error:', error);
        return NextResponse.json({ error: 'Failed to assign onboarding tasks' }, { status: 500 });
    }
}
