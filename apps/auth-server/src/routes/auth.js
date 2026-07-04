import { Router } from 'express';
import { AuthController } from '#controllers/auth.js';
import { validateRegisterInput, validateLoginInput } from '#validators/auth.js';
import { requireAuth } from '#middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', validateRegisterInput, AuthController.register);

// POST /api/auth/login
router.post('/login', validateLoginInput, AuthController.login);

// POST /api/auth/logout
router.post('/logout', AuthController.logout);

// GET /api/auth/me
router.get('/me', requireAuth, AuthController.me);

export default router;
