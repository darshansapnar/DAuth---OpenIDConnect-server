import { prisma } from '#config/db.js';

/**
 * Handles database operations for OAuthClient records.
 */
export class ClientRepository {
  /**
   * Retrieves all clients.
   */
  static async findAll() {
    return prisma.oauthClient.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Finds a unique client profile by ID.
   */
  static async findById(id) {
    return prisma.oauthClient.findUnique({
      where: { id },
    });
  }

  /**
   * Persists a new client profile record.
   */
  static async create({ name, clientSecretHash, redirectUris, allowedScopes }) {
    return prisma.oauthClient.create({
      data: {
        name,
        clientSecret: clientSecretHash,
        redirectUris,
        allowedScopes,
      },
    });
  }

  /**
   * Updates an existing client profile details.
   */
  static async update(id, { name, redirectUris, allowedScopes }) {
    return prisma.oauthClient.update({
      where: { id },
      data: {
        name,
        redirectUris,
        allowedScopes,
      },
    });
  }

  /**
   * Updates the client secret hash (for secret rotation).
   */
  static async updateSecret(id, clientSecretHash) {
    return prisma.oauthClient.update({
      where: { id },
      data: {
        clientSecret: clientSecretHash,
      },
    });
  }

  /**
   * Deletes a client profile.
   */
  static async delete(id) {
    return prisma.oauthClient.delete({
      where: { id },
    });
  }
}
