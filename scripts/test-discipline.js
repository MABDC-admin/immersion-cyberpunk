const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreate() {
    try {
        console.log('Attempting to create a DisciplineRecord...');
        const record = await prisma.disciplineRecord.create({
            data: {
                employeeId: 1, // Dennis Sotto
                type: 'Minor Warning',
                reason: 'Test from script',
                date: new Date(),
                issuerId: 1, // Dennis Sotto User
                status: 'Active'
            }
        });
        console.log('Record created successfully:', record);
    } catch (err) {
        console.error('TEST FAILED:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

testCreate();
