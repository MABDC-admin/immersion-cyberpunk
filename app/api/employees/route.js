import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getSignedS3Url } from '@/lib/s3';

export async function POST(request) {
    try {
        const data = await request.json();

        // Convert empty strings to null for relations
        if (data.departmentId === '') data.departmentId = null;
        if (data.positionId === '') data.positionId = null;

        // Parse ints if present
        if (data.departmentId) data.departmentId = parseInt(data.departmentId);
        if (data.positionId) data.positionId = parseInt(data.positionId);

        // Parse Floats for compensation & leave logic
        if (data.basicSalary) data.basicSalary = parseFloat(data.basicSalary);
        if (data.annualLeaveBalance) data.annualLeaveBalance = parseFloat(data.annualLeaveBalance);
        if (data.sickLeaveBalance) data.sickLeaveBalance = parseFloat(data.sickLeaveBalance);
        if (data.leaveAccrualRate) data.leaveAccrualRate = parseFloat(data.leaveAccrualRate);

        const employee = await prisma.employee.create({ data });
        return NextResponse.json(employee);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    const employees = await prisma.employee.findMany({
        orderBy: { id: 'asc' },
        include: {
            department: true,
            positionRel: true
        }
    });
    const employeesWithAvatars = await Promise.all(employees.map(async (emp) => {
        if (emp.avatarUrl && emp.avatarUrl.startsWith('avatars/')) {
            try {
                const signedUrl = await getSignedS3Url(emp.avatarUrl);
                return { ...emp, avatarUrl: signedUrl, avatarKey: emp.avatarUrl };
            } catch (err) {
                console.error('Signed URL error for avatar:', err);
                return emp;
            }
        }
        return emp;
    }));

    return NextResponse.json(employeesWithAvatars);
}
