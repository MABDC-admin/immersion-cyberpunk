import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getSignedS3Url } from '@/lib/s3';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');

        const roles = session.user.roles || [];
        const isHR = roles.includes('HR Admin') || roles.includes('Super Admin');
        const userEmployeeId = session.user.employeeId;

        let query = {};

        if (isHR && employeeId) {
            query.employeeId = parseInt(employeeId);
        } else if (!isHR) {
            query.employeeId = userEmployeeId;
        }

        const expenses = await prisma.expense.findMany({
            where: query,
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        empNo: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        // Generate signed URLs for receipts
        const expensesWithSignedUrls = await Promise.all(expenses.map(async (expense) => {
            if (expense.receiptUrl && expense.receiptUrl.startsWith('uploads/')) {
                try {
                    const signedUrl = await getSignedS3Url(expense.receiptUrl);
                    return { ...expense, receiptUrl: signedUrl, receiptKey: expense.receiptUrl };
                } catch (err) {
                    console.error('Signed URL error:', err);
                    return expense;
                }
            }
            return expense;
        }));

        return NextResponse.json(expensesWithSignedUrls);
    } catch (error) {
        console.error('Fetch expenses error:', error);
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { amount, category, date, description, receiptUrl } = data;

        if (!amount || !category || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const employeeId = session.user.employeeId;
        if (!employeeId) {
            return NextResponse.json({ error: 'User not linked to an employee' }, { status: 400 });
        }

        // 1. Create the Expense record
        const expense = await prisma.expense.create({
            data: {
                employeeId,
                amount: parseFloat(amount),
                category,
                date: new Date(date),
                description,
                receiptUrl,
                status: 'Pending'
            }
        });

        // 2. Look for an active Approval Workflow for "Expense"
        const workflow = await prisma.approvalWorkflow.findFirst({
            where: {
                entityType: 'Expense',
                isActive: true
            },
            include: {
                steps: {
                    orderBy: { stepOrder: 'asc' }
                }
            }
        });

        // 3. If a workflow exists, create an Approval Request
        if (workflow && workflow.steps.length > 0) {
            await prisma.approvalRequest.create({
                data: {
                    workflowId: workflow.id,
                    requesterId: parseInt(session.user.id),
                    targetEntityId: expense.id,
                    currentStepOrder: 1,
                    status: 'Pending'
                }
            });
        } else {
            // If no workflow, maybe auto-approve or just leave as Pending for HR to review manually
            // For now, we'll keep it Pending.
        }

        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        console.error('Create expense error:', error);
        return NextResponse.json({ error: 'Failed to submit expense' }, { status: 500 });
    }
}
