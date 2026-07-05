import { prisma } from '#config/db.js';

/**
 * Handles database operations for User records.
 */
export class UserRepository {
  /**
   * Fetches all user profiles without sensitive data.
   * @returns {Promise<Array>}
   */
  static async findAll() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Finds a unique user profile by their normalized email address.
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Finds a unique user profile by their ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Persists a new user profile record.
   * @param {Object} userData
   * @param {string} userData.email
   * @param {string} userData.passwordHash
   * @param {string} [userData.name]
   * @returns {Promise<Object>}
   */
  static async create({ email, passwordHash, name }) {
    return prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
      },
    });
  }
}
