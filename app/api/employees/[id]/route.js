import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const data = await request.json();

        if (data.departmentId === '') data.departmentId = null;
        if (data.positionId === '') data.positionId = null;
        if (data.departmentId) data.departmentId = parseInt(data.departmentId);
        if (data.positionId) data.positionId = parseInt(data.positionId);

        if (data.basicSalary) data.basicSalary = parseFloat(data.basicSalary);
        if (data.annualLeaveBalance) data.annualLeaveBalance = parseFloat(data.annualLeaveBalance);
        if (data.sickLeaveBalance) data.sickLeaveBalance = parseFloat(data.sickLeaveBalance);
        if (data.leaveAccrualRate) data.leaveAccrualRate = parseFloat(data.leaveAccrualRate);

        const employee = await prisma.employee.update({
            where: { id: parseInt(id) },
            data,
        });
        return NextResponse.json(employee);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        await prisma.employee.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
