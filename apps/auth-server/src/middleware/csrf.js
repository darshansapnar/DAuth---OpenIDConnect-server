import crypto from 'crypto';
import { env } from '#config/env.js';

/**
 * Custom Double-Submit Cookie CSRF Protection Middleware.
 */
export function csrfProtection(req, res, next) {
  // 1. Generate CSRF token if not present in cookies
  let csrfToken = req.cookies?.dauth_csrf;
  if (!csrfToken) {
    csrfToken = crypto.randomBytes(24).toString('hex');
    res.cookie('dauth_csrf', csrfToken, {
      httpOnly: false, // Must be readable by client JS to copy into request headers
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
  req.csrfToken = csrfToken;

  // 2. Exclude OIDC API endpoints (like /token) which are API-only and use Client Secrets/Basic Auth
  const isOidcApi =
    req.path === '/token' || req.path === '/api/auth/register' || req.path === '/api/auth/login';
  if (isOidcApi) {
    return next();
  }

  // 3. Enforce CSRF verification for state-changing requests
  const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (stateChangingMethods.includes(req.method)) {
    const headerToken = req.headers['x-csrf-token'];
    const bodyToken = req.body?._csrf;
    const submittedToken = headerToken || bodyToken;

    if (!csrfToken || !submittedToken || csrfToken !== submittedToken) {
      return res.status(403).json({
        error: 'Forbidden',
        message:
          'CSRF token validation failed. State-changing requests require a valid CSRF token.',
      });
    }
  }

  next();
}
