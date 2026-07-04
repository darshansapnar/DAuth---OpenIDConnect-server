import { PrismaClient } from '@prisma/client';
import { env } from '#config/env.js';

// PrismaClient is instantiated and attached to global in development
// to prevent hot-reloads from exhausting database connection pool.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
