import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    // Keep connections fresh, aggressively close idle ones
    log: ['query', 'info', 'warn', 'error'],
  });
};

globalThis.prismaGlobal = globalThis.prismaGlobal || prismaClientSingleton();

export const prisma = globalThis.prismaGlobal;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
