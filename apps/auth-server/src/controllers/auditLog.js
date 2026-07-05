import { AuditLogService } from '#services/auditLog.js';

/**
 * Handles HTTP requests for audit log retrieval.
 */
export class AuditLogController {
  /**
   * GET /api/audit-logs — Returns recent audit log entries.
   */
  static async list(req, res, next) {
    try {
      const logs = await AuditLogService.list({ limit: 200 });

      res.status(200).json({
        success: true,
        count: logs.length,
        logs,
      });
    } catch (err) {
      next(err);
    }
  }
}
