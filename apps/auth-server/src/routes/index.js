import { Router } from 'express';
import authRouter from './auth.js';
import clientRouter from './client.js';
import { requireAuth } from '#middleware/auth.js';
import { prisma } from '../config/db.js';

const router = Router();

// Mount authentication routes
router.use('/auth', authRouter);

// Mount OAuth Clients management routes (Protected)
router.use('/clients', requireAuth, clientRouter);

// Health check endpoint (includes database connectivity probe)
router.get('/health', async (_req, res) => {
  let dbStatus = 'UP';
  let dbLatencyMs = null;
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
  } catch {
    dbStatus = 'DOWN';
  }

  res.json({
    status: dbStatus === 'UP' ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
  });
});

// Stats overview endpoint — returns real database counts
router.get('/stats/overview', async (_req, res) => {
  try {
    const [users, clients, refreshTokens, authorizationCodes] = await Promise.all([
      prisma.user.count(),
      prisma.oAuthClient.count(),
      prisma.refreshToken.count(),
      prisma.authorizationCode.count(),
    ]);

    res.json({
      users,
      clients,
      refreshTokens,
      authorizationCodes,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

export default router;
