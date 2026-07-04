/**
 * Middleware to enforce authentication.
 * Rejects requests if no active user session exists.
 */
export function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication is required to access this resource.',
    });
  }

  next();
}
