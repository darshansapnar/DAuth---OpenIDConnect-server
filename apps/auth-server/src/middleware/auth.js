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

  // Enforce administrative privileges to access dashboard resources
  if (req.session.user.isAdmin !== true) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access Denied. Administrative rights are required.',
    });
  }

  next();
}
