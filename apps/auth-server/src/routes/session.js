import { Router } from 'express';
import { SessionController } from '#controllers/session.js';

const router = Router();

// GET /api/sessions — List all active sessions
router.get('/', SessionController.list);

// DELETE /api/sessions/:id — Revoke a specific session
router.delete('/:id', SessionController.revoke);

export default router;
