import { Router } from 'express';
import { UserController } from '#controllers/user.js';

const router = Router();

// GET /api/users — List all registered users
router.get('/', UserController.list);

export default router;
