const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding company holidays...');

    const holidays = [
        {
            title: 'Eid Al Fitr',
            date: new Date('2026-03-30'), // Example date for 2026
            description: 'Public holiday for Eid Al Fitr celebration.'
        },
        {
            title: 'Eid Al Fitr Day 2',
            date: new Date('2026-03-31'),
            description: 'Public holiday for Eid Al Fitr celebration.'
        },
        {
            title: 'UAE National Day',
            date: new Date('2026-12-02'),
            description: 'Commemorating the federation of the seven emirates.'
        },
        {
            title: 'New Year Day',
            date: new Date('2026-01-01'),
            description: 'Official New Year holiday.'
        }
    ];

    for (const holiday of holidays) {
        await prisma.companyHoliday.upsert({
            where: { id: 0 }, // Just a trick to upsert by title if wanted, but simpler to just create if empty
            update: {},
            create: holiday,
        }).catch(err => {
            // If already exists, ignore
            return prisma.companyHoliday.create({ data: holiday });
        });
    }

    console.log('Holidays seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
