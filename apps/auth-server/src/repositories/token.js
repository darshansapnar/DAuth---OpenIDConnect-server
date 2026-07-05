import { prisma } from '#config/db.js';

/**
 * Handles database operations for RefreshToken records.
 */
export class TokenRepository {
  /**
   * Persists a new RefreshToken record.
   */
  static async createRefreshToken({ token, clientId, userId, scope, expiresAt }) {
    return prisma.refreshToken.create({
      data: {
        token,
        clientId,
        userId,
        scope,
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

  /**
   * Revokes a single RefreshToken (sets revoked = true).
   */
  static async revokeRefreshToken(token) {
    return prisma.refreshToken.update({
      where: { token },
      data: { revoked: true },
    });
  }

  /**
   * Invalidate/revoke all active refresh tokens associated with a given user/client pair.
   */
  static async revokeAllForUserAndClient(userId, clientId) {
    return prisma.refreshToken.updateMany({
      where: {
        userId,
        clientId,
        revoked: false,
      },
      data: { revoked: true },
    });
  }
}
