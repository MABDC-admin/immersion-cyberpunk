import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        const roles = session?.user?.roles || [];
        if (!session || (!roles.includes('Super Admin') && !roles.includes('HR Admin'))) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const resolvedParams = await Promise.resolve(params);
        const runId = parseInt(resolvedParams.id);

        const run = await prisma.payrollRun.findUnique({
            where: { id: runId },
            include: {
                payrollItems: {
                    include: {
                        employee: true
                    }
                }
            }
        });

        if (!run) {
            return new NextResponse('Payroll run not found', { status: 404 });
        }

        // Generate SIF Content (Simplified MOHRE UAE Formula)
        // EDR (Employer Data Record)
        // EDR,Employer_Id,Bank_Routing_Code,Creation_Date,Creation_Time,Payroll_Month_Year,Number_of_Records,Total_Salary

        const padDate = (num) => num.toString().padStart(2, '0');
        const now = new Date();
        const creationDate = `${now.getFullYear()}${padDate(now.getMonth() + 1)}${padDate(now.getDate())}`;
        const creationTime = `${padDate(now.getHours())}${padDate(now.getMinutes())}`;
        const periodMonthYear = `${padDate(run.month)}${run.year}`;
        const totalSalary = run.payrollItems.reduce((acc, item) => acc + item.netPay, 0).toFixed(2);

        // Mock Employer ID and Bank Routing for demo
        const employerId = '1234567890123';
        const employerBankRouting = 'ENBD1234';

        let sifContent = `EDR,${employerId},${employerBankRouting},${creationDate},${creationTime},${periodMonthYear},${run.payrollItems.length},${totalSalary}\n`;

        // SCR (Salary Information Record)
        // SCR,Employee_Id,Bank_Routing_Code,Employee_Account_Number,Start_Date,End_Date,Number_of_Days,Fixed_Income,Variable_Income,Leave_Days
        for (const item of run.payrollItems) {
            const empId = item.employee.empNo || `EMP${item.employee.id}`;
            const routing = item.employee.routingCode || 'UNKNOWN_ROUTE';
            const iban = item.employee.iban || 'NO_IBAN_PROVIDED';

            const fixedIncome = (item.basic + item.housingAllowance + item.transportAllowance + item.otherAllowances).toFixed(2);
            const variableIncome = (item.overtime - item.deductions).toFixed(2);

            // Assuming full month worked
            const daysInMonth = new Date(run.year, run.month, 0).getDate();
            const startDate = `${run.year}-${padDate(run.month)}-01`;
            const endDate = `${run.year}-${padDate(run.month)}-${daysInMonth}`;

            sifContent += `SCR,${empId},${routing},${iban},${startDate},${endDate},${daysInMonth},${fixedIncome},${variableIncome},0\n`;
        }

        // Return as downloadable SIF file
        return new NextResponse(sifContent, {
            headers: {
                'Content-Disposition': `attachment; filename="WPS_${employerId}_${creationDate}${creationTime}.sif"`,
                'Content-Type': 'text/plain',
            }
        });

    } catch (error) {
        console.error('SIF Generation error:', error);
        return new NextResponse('Failed to generate SIF', { status: 500 });
    }
}
