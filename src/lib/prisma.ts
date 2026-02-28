import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const client =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  return client;
}

// Lazily initialize Prisma only when the postgres store driver is actually used.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = createClient();
    return Reflect.get(client, prop, receiver);
  },
});
