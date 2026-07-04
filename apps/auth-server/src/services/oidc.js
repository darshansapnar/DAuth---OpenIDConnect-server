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
      throw err;
    }

    const client = await ClientRepository.findById(clientId);
    if (!client) {
      const err = new Error(`Unauthorized client: client_id "${clientId}" is not registered.`);
      err.status = 400;
      throw err;
    }

    // 2. Validate Redirect URI
    if (!redirectUri) {
      const err = new Error('Missing parameter: redirect_uri is required.');
      err.status = 400;
      throw err;
    }

    const isMatch = client.redirectUris.includes(redirectUri);
    if (!isMatch) {
      const err = new Error(
        `Redirect URI mismatch: "${redirectUri}" is not registered for this client.`
      );
      err.status = 400;
      throw err;
    }

    // 3. Validate Response Type
    if (!responseType || responseType !== 'code') {
      const err = new Error('Unsupported response_type: only "code" is allowed.');
      err.status = 400;
      throw err;
    }

    // 4. Validate Scope
    if (!scope || !scope.split(' ').includes('openid')) {
      const err = new Error('Invalid scope: must include "openid" to establish OIDC handshakes.');
      err.status = 400;
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
  }) {
    // Generate secure cryptographically random token prefix
    const code = `dauth_code_${crypto.randomBytes(16).toString('hex')}`;

    // Set 10-minute expiration
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const scopesArray = typeof scope === 'string' ? scope.split(' ') : scope;

    const authCode = await OidcRepository.createCode({
      code,
      clientId,
      userId,
      redirectUri,
      scope: scopesArray,
      expiresAt,
      codeChallenge,
      codeChallengeMethod,
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
   * @returns {Promise<Object>} Token Endpoint Response object
   */
  static async exchangeCodeForTokens({ code, redirectUri, clientId, clientSecret }) {
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

    // 3. Match Client Secret Hash
    if (!clientSecret) {
      const err = new Error('Missing parameter: client_secret is required.');
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
      const err = new Error('Authorization code has already been used.');
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

    // 5. Mark authorization code as used immediately to mitigate replay attacks
    await OidcRepository.markAsUsed(authCode.id);

    const user = authCode.user;
    const requestedScopes = authCode.scope;

    // 6. Generate RS256 signed Access Token
    const accessTokenClaims = {
      client_id: clientId,
      scope: requestedScopes.join(' '),
    };
    const accessToken = await signJwt(accessTokenClaims, user.id, clientId, '1h');

    // 7. Generate RS256 signed ID Token
    const idTokenClaims = {};
    if (requestedScopes.includes('email')) {
      idTokenClaims.email = user.email;
      idTokenClaims.email_verified = true;
    }
    if (requestedScopes.includes('profile')) {
      idTokenClaims.name = user.name || '';
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
      expiresAt: rtExpiry,
    });

    // 9. Format response payload (compliant with OAuth 2.0 specs)
    return {
      access_token: accessToken,
      id_token: idToken,
      refresh_token: rawRefreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: requestedScopes.join(' '),
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
