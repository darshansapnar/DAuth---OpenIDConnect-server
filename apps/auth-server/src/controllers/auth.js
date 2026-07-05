import { AuthService } from '#services/auth.js';
import { AuditLogService } from '#services/auditLog.js';

/**
 * Handles HTTP requests relating to authentication entry points.
 */
export class AuthController {
  /**
   * Registers a new user account.
   */
  static async register(req, res, next) {
    try {
      const { email, password, name } = req.body;
      const user = await AuthService.register({ email, password, name });

      // Audit: user registration
      AuditLogService.log({
        req,
        userId: user.id,
        action: 'user.register',
        details: { email: user.email },
      });

      res.status(201).json({
        success: true,
        message: 'User account created successfully.',
        user,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Logs in a user, establishes active cookie sessions, and configures Remember Me lifetimes.
   */
  static async login(req, res, next) {
    try {
      const { email, password, rememberMe } = req.body;
      const user = await AuthService.login({ email, password });

      // Establish session payload
      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
      };

      // Set cookie duration (Remember Me = 30 days, Default = 24 hours)
      if (rememberMe === true) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
      } else {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
      }

      // Audit: successful login
      AuditLogService.log({
        req,
        userId: user.id,
        action: 'user.login',
        details: { email: user.email },
      });

      res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        user,
      });
    } catch (err) {
      // Audit: failed login attempt
      AuditLogService.log({
        req,
        action: 'user.login_failed',
        details: { email: req.body?.email, reason: err.message },
      });
      next(err);
    }
  }

  /**
   * Logs out user, invalidates server session, and clears browser cookie.
   */
  static async logout(req, res, next) {
    const userId = req.session?.user?.id;

    if (!req.session) {
      return res.status(200).json({
        success: true,
        message: 'Already logged out.',
      });
    }

    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }

      // Audit: user logout
      AuditLogService.log({
        req,
        userId,
        action: 'user.logout',
      });

      res.clearCookie('dauth_sid');
      res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
      });
    });
  }

  /**
   * Returns details of currently authenticated user session.
   */
  static async me(req, res) {
    res.status(200).json({
      success: true,
      user: req.session.user,
    });
  }
}
