import { SessionRepository } from '#repositories/session.js';

/**
 * Handles HTTP requests for session management.
 */
export class SessionController {
  /**
   * GET /api/sessions — Lists all active user sessions.
   */
  static async list(req, res, next) {
    try {
      const sessions = await SessionRepository.findAll();

      res.status(200).json({
        success: true,
        count: sessions.length,
        sessions,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/sessions/:id — Revokes a specific session.
   */
  static async revoke(req, res, next) {
    try {
      const { id } = req.params;

      const session = await SessionRepository.findById(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found.',
        });
      }

      await SessionRepository.deleteById(id);

      res.status(200).json({
        success: true,
        message: 'Session revoked successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}
