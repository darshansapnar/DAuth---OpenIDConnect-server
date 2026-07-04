import { prisma } from '#config/db.js';

/**
 * Handles database operations for RefreshToken records.
 */
export class TokenRepository {
  /**
   * Persists a new RefreshToken record.
   */
  static async createRefreshToken({ token, clientId, userId, expiresAt }) {
    return prisma.refreshToken.create({
      data: {
        token,
        clientId,
        userId,
        expiresAt,
      },
    });
  }

  /**
   * Locates a RefreshToken in the database.
   */
  static async findRefreshToken(token) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: {
        client: true,
        user: true,
      },
    });
  }

  /**
   * Deletes a RefreshToken (revoking access).
   */
  static async deleteRefreshToken(token) {
    return prisma.refreshToken.delete({
      where: { token },
    });
  }
}
