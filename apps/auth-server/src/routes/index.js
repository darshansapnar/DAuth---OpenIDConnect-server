import { Router } from 'express';
import authRouter from './auth.js';
import clientRouter from './client.js';
import { requireAuth } from '#middleware/auth.js';

const router = Router();

// Mount authentication routes
router.use('/auth', authRouter);

// Mount OAuth Clients management routes (Protected)
router.use('/clients', requireAuth, clientRouter);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
