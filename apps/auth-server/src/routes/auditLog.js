import { Router } from 'express';
import { AuditLogController } from '#controllers/auditLog.js';

const router = Router();

// GET /api/audit-logs — List recent audit log entries
router.get('/', AuditLogController.list);

export default router;
