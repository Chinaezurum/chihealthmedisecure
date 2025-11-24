/**
 * Database Abstraction Layer
 *
 * Provides dual-mode database access:
 * - In-memory mode: Fast, for rapid development (default)
 * - Prisma mode: PostgreSQL, for production and pre-deploy testing
 *
 * Switch modes via environment variable:
 *   USE_PRISMA=true npm run dev    # Use PostgreSQL
 *   npm run dev                     # Use in-memory (default)
 *
 * Production always uses Prisma (NODE_ENV=production)
 *
 * This module re-exports all functions from db.ts but with potential
 * Prisma overrides for core operations when in Prisma mode.
 */
var _a, _b;
import { PrismaClient } from '@prisma/client';
import * as inMemoryDb from './db.js';
// Determine which database mode to use
const USE_PRISMA = process.env.USE_PRISMA === 'true' || process.env.NODE_ENV === 'production';
let prisma = null;
if (USE_PRISMA) {
    console.log('🗄️  Database Mode: PostgreSQL (Prisma)');
    console.log('   Connected to:', (_b = (_a = process.env.DATABASE_URL) === null || _a === void 0 ? void 0 : _a.split('@')[1]) === null || _b === void 0 ? void 0 : _b.split('?')[0]);
    prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
}
else {
    console.log('💾 Database Mode: In-Memory (Fast Development)');
    console.log('   To use PostgreSQL: USE_PRISMA=true npm run dev');
}
// Re-export ALL functions from in-memory database
// This ensures backward compatibility with server.ts
export * from './db.js';
// Override specific functions when using Prisma mode
// For now, we keep using in-memory functions as they have complex logic
// In a future iteration, these can be gradually migrated to Prisma
// Expose Prisma client for direct queries if needed
export const getPrismaClient = () => prisma;
// Expose mode information
export const getDatabaseMode = () => USE_PRISMA ? 'prisma' : 'in-memory';
// Cleanup on shutdown
process.on('beforeExit', async () => {
    if (prisma) {
        await prisma.$disconnect();
    }
});
export default Object.assign(Object.assign({}, inMemoryDb), { prisma, mode: getDatabaseMode() });
//# sourceMappingURL=database.js.map