import bcrypt from 'bcrypt';
import { UserRepository } from '#repositories/user.js';

/**
 * Handles core credentials business logic.
 */
export class AuthService {
  /**
   * Registers a user in the system after validating constraints.
   *
   * @param {Object} registrationParams
   * @param {string} registrationParams.email
   * @param {string} registrationParams.password
   * @param {string} [registrationParams.name]
   * @returns {Promise<Object>} The clean created user metadata (excluding passwordHash)
   */
  static async register({ email, password, name }) {
    // 1. Verify email uniqueness
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      const error = new Error('This email is already registered.');
      error.status = 409;
      error.name = 'DuplicateEmailError';
      throw error;
    }

    // 2. Hash raw password (Salt rounds = 12)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Persist record to DB
    const user = await UserRepository.create({
      email,
      passwordHash,
      name,
    });

    // 4. Return clean summary (do not leak hash)
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }

  /**
   * Logins user after matching bcrypt signatures.
   *
   * @param {Object} loginParams
   * @param {string} loginParams.email
   * @param {string} loginParams.password
   * @returns {Promise<Object>} The authenticated user profile (excluding passwordHash)
   */
  static async login({ email, password }) {
    // 1. Locate user by Normalized Email
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password.');
      error.status = 401;
      error.name = 'AuthenticationError';
      throw error;
    }

    // 2. Match Password Hash
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      const error = new Error('Invalid email or password.');
      error.status = 401;
      error.name = 'AuthenticationError';
      throw error;
    }

    // 3. Return clean summary
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }
}
