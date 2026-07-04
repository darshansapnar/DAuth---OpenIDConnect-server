import { prisma } from '#config/db.js';

/**
 * Handles database operations for OIDC handshake codes.
 */
export class OidcRepository {
  /**
   * Persists a new AuthorizationCode record.
   */
  static async createCode({
    code,
    clientId,
    userId,
    redirectUri,
    scope,
    expiresAt,
    codeChallenge,
    codeChallengeMethod,
  }) {
    return prisma.authorizationCode.create({
      data: {
        code,
        clientId,
        userId,
        redirectUri,
        scope,
        expiresAt,
        codeChallenge,
        codeChallengeMethod,
      },
    });
  }

  /**
   * Retrieves an AuthorizationCode by its code string.
   */
  static async findCode(code) {
    return prisma.authorizationCode.findUnique({
      where: { code },
      include: {
        client: true,
        user: true,
      },
    });
  }

  /**
   * Marks a code as used to prevent replay attacks.
   */
  static async markAsUsed(id) {
    return prisma.authorizationCode.update({
      where: { id },
      data: { used: true },
    });
  }
}
