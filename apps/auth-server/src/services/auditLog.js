import { AuditLogRepository } from '#repositories/auditLog.js';

/**
 * Provides a convenient utility for writing audit log entries
 * from anywhere in the auth server. Automatically extracts IP
 * and User-Agent from the Express request object.
 */
export class AuditLogService {
  /**
   * Writes an audit log entry. Fire-and-forget — errors are logged
   * but never bubble up to interrupt the main request flow.
   *
   * @param {Object} options
   * @param {import('express').Request} options.req - The Express request (used for IP/UA extraction).
   * @param {string} [options.userId] - The acting user's database ID.
   * @param {string} [options.clientId] - The related OAuth client ID.
   * @param {string} options.action - Event action identifier (e.g. 'user.login').
   * @param {Object} [options.details] - Additional JSON metadata.
   */
  static async log({ req, userId, clientId, action, details }) {
    try {
      const ipAddress = req?.ip || req?.connection?.remoteAddress || null;
      const userAgent = req?.get?.('user-agent') || null;

      await AuditLogRepository.create({
        userId,
        clientId,
        action,
        ipAddress,
        userAgent,
        details,
      });
    } catch (err) {
      // Audit logging must never break the main request flow
      console.error('[AUDIT] Failed to write audit log:', err.message);
    }
  }

  /**
   * Fetches recent audit log entries.
   * @param {Object} [options]
   * @param {number} [options.limit=100]
   * @returns {Promise<Array>}
   */
  static async list({ limit = 100 } = {}) {
    return AuditLogRepository.findAll({ limit });
  }
}
