import { UserRepository } from '#repositories/user.js';

/**
 * Handles HTTP requests for user directory management.
 */
export class UserController {
  /**
   * GET /api/users — Lists all registered user profiles.
   */
  static async list(req, res, next) {
    try {
      const users = await UserRepository.findAll();

      res.status(200).json({
        success: true,
        count: users.length,
        users,
      });
    } catch (err) {
      next(err);
    }
  }
}
