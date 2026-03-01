const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Testing CompanyHoliday...');
        const holidays = await prisma.companyHoliday.findMany();
        console.log('Holidays count:', holidays.length);

        console.log('Testing LeaveRequest...');
        const leaves = await prisma.leaveRequest.findMany({ take: 1 });
        console.log('Leaves test success');

        console.log('Testing EmployeeShift...');
        const shifts = await prisma.employeeShift.findMany({ take: 1 });
        console.log('Shifts test success');

        console.log('All tests passed');
    } catch (err) {
        console.error('TEST FAILED:', err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
