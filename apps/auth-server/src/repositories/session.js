import { prisma } from '#config/db.js';

/**
 * Handles database operations for UserSession records.
 * UserSessions track SSO browser sessions with device metadata.
 */
export class SessionRepository {
  /**
   * Fetches all active user sessions with related user data.
   * @returns {Promise<Array>}
   */
  static async findAll() {
    return prisma.userSession.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  /**
   * Finds a single session by its ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    return prisma.userSession.findUnique({
      where: { id },
    });
  }

  /**
   * Deletes a session record, revoking the user's access.
   * @param {string} id
   * @returns {Promise<Object>}
   */
  static async deleteById(id) {
    return prisma.userSession.delete({
      where: { id },
    });
  }
}
