import { prisma } from '#config/db.js';

/**
 * Handles database operations for User records.
 */
export class UserRepository {
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
