import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// Force a new instance to pick up new schema changes (Tickets, Policies, AuditLogs)
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();
