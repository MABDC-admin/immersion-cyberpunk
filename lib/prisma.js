import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production'
      ? ['warn', 'error']
      : ['query', 'info', 'warn', 'error'],
  });
};

globalThis.prismaGlobal = globalThis.prismaGlobal || prismaClientSingleton();

export const prisma = globalThis.prismaGlobal;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
