import { verifyJwt } from '#utils/keys.js';

/**
 * Middleware validating bearer access token signatures for UserInfo queries.
 */
export async function validateBearerToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.setHeader(
        'WWW-Authenticate',
        'Bearer error="invalid_request", error_description="Authorization header with Bearer token is required."'
      );
      return res.status(401).json({
        error: 'invalid_request',
        message: 'Bearer token is missing or incorrectly formatted.',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = await verifyJwt(token);
      req.user = payload;
      next();
    } catch (jwtErr) {
      res.setHeader(
        'WWW-Authenticate',
        `Bearer error="invalid_token", error_description="${jwtErr.message}"`
      );
      return res.status(401).json({
        error: 'invalid_token',
        error_description:
          'The access token is expired, revoked, or signature verification failed.',
      });
    }
  } catch (err) {
    next(err);
  }
}
