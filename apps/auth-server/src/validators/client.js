import { isValidRedirectUri, OIDC_SCOPES } from '@dauth/shared';

const VALID_SCOPES = Object.values(OIDC_SCOPES);

/**
 * Middleware validating input parameters for client registration and updates.
 */
export function validateClientInput(req, res, next) {
  const { name, redirectUris, allowedScopes } = req.body;

  // 1. Validate Client Name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Client name must be a non-empty string.',
    });
  }

  // 2. Validate Redirect URIs
  if (!redirectUris || !Array.isArray(redirectUris) || redirectUris.length === 0) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'At least one redirect URI is required.',
    });
  }

  for (const uri of redirectUris) {
    if (!isValidRedirectUri(uri)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: `Invalid redirect URI format: ${uri}. Only HTTPS URLs or HTTP localhost URLs are allowed.`,
      });
    }
  }

  // 3. Validate Allowed Scopes
  if (!allowedScopes || !Array.isArray(allowedScopes) || allowedScopes.length === 0) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'At least one allowed scope is required.',
    });
  }

  for (const scope of allowedScopes) {
    if (!VALID_SCOPES.includes(scope)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: `Invalid OIDC scope requested: ${scope}. Allowed scopes are: ${VALID_SCOPES.join(', ')}.`,
      });
    }
  }

  next();
}
