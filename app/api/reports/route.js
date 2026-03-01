import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (!session.user.roles?.includes('Super Admin') && !session.user.roles?.includes('HR Admin'))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'headcount';

        if (type === 'headcount') {
            const employees = await prisma.employee.findMany({
                where: { status: 'Active' },
                include: { department: true }
            });

            const stats = {
                total: employees.length,
                byDepartment: {},
                byGender: { Male: 0, Female: 0, Other: 0 },
                byNationality: {},
                byEmploymentType: {}
            };

            employees.forEach(emp => {
                // Department
                const dept = emp.department?.name || 'Unassigned';
                stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;

                // Gender
                const gender = emp.gender || 'Other';
                stats.byGender[gender] = (stats.byGender[gender] || 0) + 1;

                // Nationality
                const nat = emp.nationality || 'Unknown';
                if (nat !== 'Unknown') {
                    stats.byNationality[nat] = (stats.byNationality[nat] || 0) + 1;
                }

                // Type
                const type = emp.employmentType || 'Full-time';
                stats.byEmploymentType[type] = (stats.byEmploymentType[type] || 0) + 1;
            });

            return NextResponse.json(stats);
        }

        if (type === 'attendance') {
            // Get last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

            const attendance = await prisma.attendance.findMany({
                where: { date: { gte: dateStr } }
            });

            let onTime = 0;
            let late = 0;
            const byDate = {};

            attendance.forEach(rec => {
                const dateRaw = new Date(rec.date).toISOString().split('T')[0];
                if (!byDate[dateRaw]) byDate[dateRaw] = { onTime: 0, late: 0 };
                
                if (rec.status === 'Present') onTime++;
                else if (rec.status === 'Late') late++;

                if (rec.status === 'Present') byDate[dateRaw].onTime++;
                if (rec.status === 'Late') byDate[dateRaw].late++;
            });

            return NextResponse.json({ summary: { onTime, late }, byDate });
        }

        if (type === 'leave') {
            const leaves = await prisma.leaveRequest.findMany();
            const stats = {
                total: leaves.length,
                pending: leaves.filter(l => l.status === 'Pending').length,
                approved: leaves.filter(l => l.status === 'Approved').length,
                rejected: leaves.filter(l => l.status === 'Rejected').length,
                byType: {}
            };

            leaves.forEach(l => {
                stats.byType[l.leaveType] = (stats.byType[l.leaveType] || 0) + 1;
            });

            return NextResponse.json(stats);
        }

        if (type === 'payroll') {
            // Get all payroll runs
            const runs = await prisma.payrollRun.findMany({
                include: { payrollItems: true },
                orderBy: { id: 'asc' }
            });

            const trends = runs.map(run => {
                const totalNet = run.payrollItems.reduce((sum, item) => sum + item.netPay, 0);
                return {
                    period: `${run.month}/${run.year}`,
                    total: totalNet,
                    count: run.payrollItems.length
                }
            });

            return NextResponse.json({ trends });
        }

        // --- Generic full flat-data export endpoints for the 'Exports' tab ---
        if (type === 'export-employees') {
            const data = await prisma.employee.findMany({ include: { department: true, position: true } });
            return NextResponse.json(data.map(e => ({
                ID: e.id,
                EmployeeNumber: e.employeeNumber,
                Name: `${e.firstName} ${e.lastName}`,
                Email: e.email,
                Department: e.department?.name || '',
                Position: e.position?.title || '',
                JoinDate: e.joinDate ? new Date(e.joinDate).toLocaleDateString() : '',
                Status: e.isActive ? 'Active' : 'Inactive',
                BasicSalary: e.basicSalary,
                IBAN: e.iban || ''
            })));
        }

        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });

    } catch (error) {
        console.error('Reports API Error:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
