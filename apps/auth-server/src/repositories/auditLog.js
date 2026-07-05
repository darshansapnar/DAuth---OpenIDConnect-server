import { prisma } from '#config/db.js';

/**
 * Handles database operations for AuditLog records.
 * Provides immutable append-only audit trail storage.
 */
export class AuditLogRepository {
  /**
   * Fetches recent audit log entries with related user/client data.
   * @param {Object} options
   * @param {number} [options.limit=100] - Maximum number of records to return.
   * @returns {Promise<Array>}
   */
  static async findAll({ limit = 100 } = {}) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        client: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Persists a new audit log entry.
   * @param {Object} data
   * @param {string} [data.userId] - The acting user's ID (nullable for anonymous events).
   * @param {string} [data.clientId] - The related OAuth client ID (nullable).
   * @param {string} data.action - The event action identifier (e.g. 'user.login').
   * @param {string} [data.ipAddress] - Source IP address.
   * @param {string} [data.userAgent] - Browser/client user agent string.
   * @param {Object} [data.details] - Additional JSON metadata about the event.
   * @returns {Promise<Object>}
   */
  static async create({ userId, clientId, action, ipAddress, userAgent, details }) {
    return prisma.auditLog.create({
      data: {
        userId: userId || null,
        clientId: clientId || null,
        action,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        details: details || null,
      },
    });
  }
}
