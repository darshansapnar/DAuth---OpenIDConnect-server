import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { ClientRepository } from '#repositories/client.js';
import { OidcRepository } from '#repositories/oidc.js';
import { UserRepository } from '#repositories/user.js';
import { TokenRepository } from '#repositories/token.js';
import { signJwt } from '#utils/keys.js';

/**
 * Handles core business rules for OIDC handshake sequences.
 */
export class OidcService {
  /**
   * Validates client registration parameters and OIDC scopes.
   *
   * @param {Object} params
   * @param {string} params.clientId
   * @param {string} params.redirectUri
   * @param {string} params.responseType
   * @param {string} params.scope
   * @returns {Promise<Object>} The authenticated client details
   */
  static async validateAuthorizeParams({ clientId, redirectUri, responseType, scope }) {
    // 1. Locate Client
    if (!clientId) {
      const err = new Error('Missing parameter: client_id is required.');
      err.status = 400;
      err.shouldRedirect = false;
      throw err;
    }

    const client = await ClientRepository.findById(clientId);
    if (!client) {
      const err = new Error(`Unauthorized client: client_id "${clientId}" is not registered.`);
      err.status = 400;
      err.shouldRedirect = false;
      throw err;
    }

    // 2. Validate Redirect URI
    if (!redirectUri) {
      const err = new Error('Missing parameter: redirect_uri is required.');
      err.status = 400;
      err.shouldRedirect = false;
      throw err;
    }

    const isMatch = client.redirectUris.includes(redirectUri);
    if (!isMatch) {
      const err = new Error(
        `Redirect URI mismatch: "${redirectUri}" is not registered for this client.`
      );
      err.status = 400;
      err.shouldRedirect = false;
      throw err;
    }

    // 3. Validate Response Type
    if (!responseType || responseType !== 'code') {
      const err = new Error('Unsupported response_type: only "code" is allowed.');
      err.status = 400;
      err.code = 'unsupported_response_type';
      err.shouldRedirect = true;
      throw err;
    }

    // 4. Validate Scope
    if (!scope || !scope.split(' ').includes('openid')) {
      const err = new Error('Invalid scope: must include "openid" to establish OIDC handshakes.');
      err.status = 400;
      err.code = 'invalid_scope';
      err.shouldRedirect = true;
      throw err;
    }

    return client;
  }

  /**
   * Generates a short-lived authorization code for a client redirect.
   */
  static async issueAuthorizationCode({
    clientId,
    userId,
    redirectUri,
    scope,
    codeChallenge,
    codeChallengeMethod,
    nonce,
  }) {
    // Generate secure cryptographically random token prefix
    let code = `dauth_code_${crypto.randomBytes(16).toString('hex')}`;
    if (nonce) {
      const encodedNonce = Buffer.from(nonce).toString('base64url');
      code = `${code}.${encodedNonce}`;
    }

    // Set 10-minute expiration
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const scopesString = Array.isArray(scope) ? scope.join(' ') : (scope || '');

    const authCode = await OidcRepository.createCode({
      code,
      clientId,
      userId,
      redirectUri,
      scope: scopesString,
      expiresAt,
      codeChallenge: codeChallenge || '',
      codeChallengeMethod: codeChallengeMethod || '',
    });

    return authCode;
  }

  /**
   * Validates code grant credentials and signs Access, ID, and Refresh tokens.
   *
   * @param {Object} params
   * @param {string} params.code
   * @param {string} params.redirectUri
   * @param {string} params.clientId
   * @param {string} params.clientSecret
   * @param {string} [params.codeVerifier]
   * @returns {Promise<Object>} Token Endpoint Response object
   */
  static async exchangeCodeForTokens({ code, redirectUri, clientId, clientSecret, codeVerifier }) {
    // 1. Verify Client ID presence
    if (!clientId) {
      const err = new Error('Missing parameter: client_id is required.');
      err.status = 400;
      err.name = 'InvalidRequest';
      throw err;
    }

    // 2. Fetch Client Details
    const client = await ClientRepository.findById(clientId);
    if (!client) {
      const err = new Error('Client not found.');
      err.status = 401;
      err.name = 'InvalidClient';
      throw err;
    }

    // 3. Verify clientType constraints
    if (client.clientType === 'CONFIDENTIAL') {
      if (!clientSecret) {
        const err = new Error('Missing parameter: client_secret is required for confidential clients.');
        err.status = 401;
        err.name = 'InvalidClient';
        throw err;
      }
      const isSecretMatch = await bcrypt.compare(clientSecret, client.clientSecret);
      if (!isSecretMatch) {
        const err = new Error('Invalid client credentials.');
        err.status = 401;
        err.name = 'InvalidClient';
        throw err;
      }
    } else if (client.clientType === 'PUBLIC') {
      // Public clients must use PKCE
      if (!codeVerifier) {
        const err = new Error('Missing parameter: code_verifier is required for public clients.');
        err.status = 400;
        err.name = 'InvalidRequest';
        throw err;
      }
      // Public clients must not send client secrets
      if (clientSecret) {
        const err = new Error('Invalid request: Public clients must not send a client_secret.');
        err.status = 400;
        err.name = 'InvalidRequest';
        throw err;
      }
    }

    // 4. Retrieve and Validate Authorization Code
    if (!code) {
      const err = new Error('Missing parameter: code is required.');
      err.status = 400;
      err.name = 'InvalidRequest';
      throw err;
    }

    const authCode = await OidcRepository.findCode(code);
    if (!authCode) {
      const err = new Error('Invalid authorization code.');
      err.status = 400;
      err.name = 'InvalidGrant';
      throw err;
    }

    // Single-Use protection verification
    if (authCode.used) {
      // In compliance with OAuth 2.0 Security BCP, revoke all active refresh tokens for this client/user
      await TokenRepository.revokeAllForUserAndClient(authCode.userId, authCode.clientId);
      const err = new Error('Authorization code has already been used. Revoking all sessions for security.');
      err.status = 400;
      err.name = 'InvalidGrant';
      throw err;
    }

    // Expiration verification
    if (new Date() > authCode.expiresAt) {
      const err = new Error('Authorization code has expired.');
      err.status = 400;
      err.name = 'InvalidGrant';
      throw err;
    }

    // Context bindings match validation
    if (authCode.clientId !== clientId) {
      const err = new Error('Client ID mismatch.');
      err.status = 400;
      err.name = 'InvalidGrant';
      throw err;
    }

    if (authCode.redirectUri !== redirectUri) {
      const err = new Error('Redirect URI mismatch.');
      err.status = 400;
      err.name = 'InvalidGrant';
      throw err;
    }

    // PKCE (RFC 7636) code verifier validation
    if (authCode.codeChallenge) {
      if (!codeVerifier) {
        const err = new Error('Missing parameter: code_verifier is required for PKCE validation.');
        err.status = 400;
        err.name = 'InvalidGrant';
        throw err;
      }

      let isValid = false;
      if (authCode.codeChallengeMethod === 'S256') {
        const hash = crypto.createHash('sha256').update(codeVerifier).digest();
        const computedChallenge = hash.toString('base64url');
        isValid = computedChallenge === authCode.codeChallenge;
      } else if (authCode.codeChallengeMethod === 'plain' || !authCode.codeChallengeMethod) {
        isValid = codeVerifier === authCode.codeChallenge;
      } else {
        const err = new Error(`Unsupported code_challenge_method: "${authCode.codeChallengeMethod}"`);
        err.status = 400;
        err.name = 'InvalidRequest';
        throw err;
      }

      if (!isValid) {
        const err = new Error('PKCE verification failed: code_verifier mismatch.');
        err.status = 400;
        err.name = 'InvalidGrant';
        throw err;
      }
    }

    // 5. Mark authorization code as used immediately to mitigate replay attacks
    await OidcRepository.markAsUsed(authCode.id);

    const user = authCode.user;
    const requestedScopes = authCode.scope;
    const scopesArray = typeof requestedScopes === 'string' ? requestedScopes.split(' ') : (requestedScopes || []);

    // Extract nonce from authorization code suffix if present
    let nonce = null;
    if (authCode.code.includes('.')) {
      const parts = authCode.code.split('.');
      if (parts[1]) {
        try {
          nonce = Buffer.from(parts[1], 'base64url').toString('utf8');
        } catch {
          // ignore parsing issues
        }
      }
    }

    // 6. Generate RS256 signed Access Token
    const accessTokenClaims = {
      client_id: clientId,
      scope: scopesArray.join(' '),
    };
    const accessToken = await signJwt(accessTokenClaims, user.id, clientId, '1h');

    // 7. Generate RS256 signed ID Token
    const idTokenClaims = {};
    if (scopesArray.includes('email')) {
      idTokenClaims.email = user.email;
      idTokenClaims.email_verified = true;
    }
    if (scopesArray.includes('profile')) {
      idTokenClaims.name = user.name || '';
    }
    if (nonce) {
      idTokenClaims.nonce = nonce;
    }
    const idToken = await signJwt(idTokenClaims, user.id, clientId, '1h');

    // 8. Generate and Persist Opaque Refresh Token
    const rawRefreshToken = `dauth_rt_${crypto.randomBytes(24).toString('hex')}`;
    const rtExpiry = new Date();
    rtExpiry.setDate(rtExpiry.getDate() + 30); // 30 days expiry

    await TokenRepository.createRefreshToken({
      token: rawRefreshToken,
      clientId,
      userId: user.id,
      scope: scopesArray.join(' '),
      expiresAt: rtExpiry,
    });

    // 9. Format response payload (compliant with OAuth 2.0 specs)
    return {
      access_token: accessToken,
      id_token: idToken,
      refresh_token: rawRefreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: scopesArray.join(' '),
    };
  }

  /**
   * Refreshes access and ID tokens using a valid refresh token.
   *
   * @param {Object} params
   * @param {string} params.refreshToken
   * @param {string} params.clientId
   * @param {string} params.clientSecret
   * @param {string} [params.scope]
   * @returns {Promise<Object>} Token Endpoint Response object
   */
  static async refreshTokens({ refreshToken, clientId, clientSecret, scope }) {
    // 1. Verify Client ID presence
    if (!clientId) {
      const err = new Error('Missing parameter: client_id is required.');
      err.status = 400;
      err.name = 'InvalidRequest';
      throw err;
    }

    // 2. Fetch Client Details
    const client = await ClientRepository.findById(clientId);
    if (!client) {
      const err = new Error('Client not found.');
      err.status = 401;
      err.name = 'InvalidClient';
      throw err;
    }

    // 3. Verify clientType constraints for token refreshes
    if (client.clientType === 'CONFIDENTIAL') {
      if (!clientSecret) {
        const err = new Error('Missing parameter: client_secret is required for confidential clients.');
        err.status = 401;
        err.name = 'InvalidClient';
        throw err;
      }
      const isSecretMatch = await bcrypt.compare(clientSecret, client.clientSecret);
      if (!isSecretMatch) {
        const err = new Error('Invalid client credentials.');
        err.status = 401;
        err.name = 'InvalidClient';
        throw err;
      }
    } else if (client.clientType === 'PUBLIC') {
      if (clientSecret) {
        const err = new Error('Invalid request: Public clients must not send a client_secret.');
        err.status = 400;
        err.name = 'InvalidRequest';
        throw err;
      }
    }

    // 4. Retrieve Refresh Token Record
    if (!refreshToken) {
      const err = new Error('Missing parameter: refresh_token is required.');
      err.status = 400;
      err.name = 'InvalidRequest';
      throw err;
    }

    const tokenRecord = await TokenRepository.findRefreshToken(refreshToken);
    if (!tokenRecord) {
      const err = new Error('Invalid refresh token.');
      err.status = 400;
      err.name = 'InvalidGrant';
      throw err;
    }

    // Revocation status check
    if (tokenRecord.revoked) {
      const err = new Error('Refresh token has been revoked.');
      err.status = 400;
      err.name = 'InvalidGrant';
      throw err;
    }

    // Expiration verification
    if (new Date() > tokenRecord.expiresAt) {
      const err = new Error('Refresh token has expired.');
      err.status = 400;
      err.name = 'InvalidGrant';
      throw err;
    }

    // Client ID match check
    if (tokenRecord.clientId !== clientId) {
      const err = new Error('Client ID mismatch.');
      err.status = 400;
      err.name = 'InvalidGrant';
      throw err;
    }

    const user = tokenRecord.user;
    const originalScopes = typeof tokenRecord.scope === 'string' ? tokenRecord.scope.split(' ') : [];

    // 5. Evaluate requested scope (if specified) to assert it is a subset of granted scopes
    let activeScopes = originalScopes;
    if (scope) {
      const requestedScopes = scope.split(' ');
      const isSubset = requestedScopes.every((s) => originalScopes.includes(s));
      if (!isSubset) {
        const err = new Error('Requested scope exceeds originally granted scopes.');
        err.status = 400;
        err.name = 'InvalidRequest';
        throw err;
      }
      activeScopes = requestedScopes;
    }

    // 6. Generate new Access Token
    const accessTokenClaims = {
      client_id: clientId,
      scope: activeScopes.join(' '),
    };
    const accessToken = await signJwt(accessTokenClaims, user.id, clientId, '1h');

    // 7. Generate new ID Token
    const idTokenClaims = {};
    if (activeScopes.includes('email')) {
      idTokenClaims.email = user.email;
      idTokenClaims.email_verified = true;
    }
    if (activeScopes.includes('profile')) {
      idTokenClaims.name = user.name || '';
    }
    const idToken = await signJwt(idTokenClaims, user.id, clientId, '1h');

    return {
      access_token: accessToken,
      id_token: idToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: activeScopes.join(' '),
    };
  }

  /**
   * Compiles user details profile claims allowed under token scopes.
   *
   * @param {string} userId
   * @param {string|string[]} scope
   * @returns {Promise<Object>} The OIDC userinfo claims object
   */
  static async getUserInfo(userId, scope) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      const err = new Error('User profile associated with this token could not be found.');
      err.status = 401;
      err.name = 'InvalidGrant';
      throw err;
    }

    const scopesArray = typeof scope === 'string' ? scope.split(' ') : scope;

    const claims = {
      sub: user.id,
    };

    if (scopesArray.includes('email')) {
      claims.email = user.email;
      claims.email_verified = true;
    }

    if (scopesArray.includes('profile')) {
      claims.name = user.name || '';
    }

    return claims;
  }
}
