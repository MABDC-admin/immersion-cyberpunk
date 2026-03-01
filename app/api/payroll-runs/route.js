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

        const payrollRuns = await prisma.payrollRun.findMany({
            include: {
                _count: {
                    select: { payrollItems: true }
                }
            },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ]
        });

        return NextResponse.json(payrollRuns);
    } catch (error) {
        console.error('Fetch payroll runs error:', error);
        return NextResponse.json({ error: 'Failed to fetch payroll runs' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { month, year } = await request.json();

        if (!month || !year) {
            return NextResponse.json({ error: 'Month and Year are required' }, { status: 400 });
        }

        // 1. Check if run already exists
        const existingRun = await prisma.payrollRun.findFirst({
            where: { month: parseInt(month), year: parseInt(year) }
        });

        if (existingRun) {
            return NextResponse.json({ error: 'Payroll run for this month already exists' }, { status: 400 });
        }

        // 2. Fetch all active employees with their benefits
        const activeEmployees = await prisma.employee.findMany({
            where: { status: 'Active' },
            include: {
                benefits: {
                    include: { benefit: true }
                }
            }
        });

        if (activeEmployees.length === 0) {
            return NextResponse.json({ error: 'No active employees to process' }, { status: 400 });
        }

        // 3. Create Payroll Run
        const run = await prisma.payrollRun.create({
            data: {
                month: parseInt(month),
                year: parseInt(year),
                status: 'Draft'
            }
        });

        // 4. Generate Payroll Items
        const payrollItems = [];
        for (const emp of activeEmployees) {
            // Use actual basic salary from DB, fallback to 5000 if not set
            const basic = emp.basicSalary || 5000.00;
            let housingAllowance = 0;
            let transportAllowance = 0;
            let otherAllowances = 0;
            let deductions = 0;

            // Calculate active benefits
            for (const empBenefit of emp.benefits) {
                // Determine amount: override or generic default
                const amt = empBenefit.amount || empBenefit.benefit.amount || 0;
                if (empBenefit.benefit.type === 'Allowance') {
                    if (empBenefit.benefit.name.toLowerCase().includes('housing')) {
                        housingAllowance += amt;
                    } else if (empBenefit.benefit.name.toLowerCase().includes('transport')) {
                        transportAllowance += amt;
                    } else {
                        otherAllowances += amt;
                    }
                } else if (empBenefit.benefit.type === 'Deduction' || empBenefit.benefit.type === 'Insurance') {
                    deductions += amt;
                }
            }

            // Overtimes could be queried from Attendance logic, mocking 0 for now
            const overtime = 0;
            const netPay = (basic + housingAllowance + transportAllowance + otherAllowances + overtime) - deductions;

            payrollItems.push({
                payrollRunId: run.id,
                employeeId: emp.id,
                basic,
                housingAllowance,
                transportAllowance,
                otherAllowances,
                overtime,
                deductions,
                netPay
            });
        }

        await prisma.payrollItem.createMany({
            data: payrollItems
        });

        const latestRun = await prisma.payrollRun.findUnique({
            where: { id: run.id },
            include: {
                _count: {
                    select: { payrollItems: true }
                }
            }
        });

        return NextResponse.json(latestRun, { status: 201 });
    } catch (error) {
        console.error('Create payroll run error:', error);
        return NextResponse.json({ error: 'Failed to process payroll' }, { status: 500 });
    }
}
