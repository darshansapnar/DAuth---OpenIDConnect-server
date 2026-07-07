import { OidcService } from '#services/oidc.js';
import { getActiveJwk } from '#utils/keys.js';


/**
 * Controller managing OIDC authorization endpoint sequences.
 */
export class OidcController {
  /**
   * Handles GET /authorize endpoints.
   */
  static async authorize(req, res, next) {
    try {
      const {
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        response_type: responseType,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod,
        nonce,
      } = req.query;

      try {
        await OidcService.validateAuthorizeParams({
          clientId,
          redirectUri,
          responseType,
          scope,
        });
      } catch (validationErr) {
        // If client details and redirect_uri are valid, we MUST redirect user back with OIDC error query parameters.
        if (validationErr.shouldRedirect && redirectUri) {
          const redirectUrl = new URL(redirectUri);
          redirectUrl.searchParams.append('error', validationErr.code || 'invalid_request');
          redirectUrl.searchParams.append('error_description', validationErr.message);
          if (state) {
            redirectUrl.searchParams.append('state', state);
          }
          return res.redirect(redirectUrl.toString());
        }

        // Otherwise (missing client_id or mismatching redirect_uri), render directly on page.
        return res.status(validationErr.status || 400).send(`
          <div style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 600px; margin: 4rem auto; border: 1px solid #e1e4e6; border-radius: 8px;">
            <h2 style="color: #d9383a; margin-top: 0;">OIDC Authorization Error</h2>
            <p style="color: #4a5568; font-size: 14px; line-height: 1.5;">${validationErr.message}</p>
            <p style="color: #718096; font-size: 12px; margin-top: 2rem; border-top: 1px solid #e1e4e6; padding-top: 1rem;">DAuth Server Gateway Protection Tier</p>
          </div>
        `);
      }

      // 2. Validate active administrator/user SSO session
      if (!req.session || !req.session.user) {
        // Cache parameters to session before redirecting to login view
        req.session.authRequest = req.query;
        return req.session.save((err) => {
          if (err) return next(err);
          return res.redirect('/login');
        });
      }

      // 2.5. Check if user consent has been approved for this request sequence
      if (!req.session.consentApproved) {
        // Cache parameters to session before redirecting to consent view
        req.session.authRequest = req.query;
        return req.session.save((err) => {
          if (err) return next(err);
          return res.redirect('/consent');
        });
      }

      // Clear the temporary consent flag so future flows require explicit approval
      delete req.session.consentApproved;

      // 3. Issue short-lived Authorization Code
      const authCode = await OidcService.issueAuthorizationCode({
        clientId,
        userId: req.session.user.id,
        redirectUri,
        scope,
        codeChallenge,
        codeChallengeMethod,
        nonce,
      });

      // 4. Construct response redirect URL parameters
      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.append('code', authCode.code);
      if (state) {
        redirectUrl.searchParams.append('state', state);
      }

      // 5. Redirect browser back to Relying Client Application callback
      return res.redirect(redirectUrl.toString());
    } catch (err) {
      next(err);
    }
  }

  /**
   * Handles POST /token endpoint.
   */
  static async token(req, res) {
    try {
      let clientId = req.body.client_id;
      let clientSecret = req.body.client_secret;
      const { grant_type: grantType, code, redirect_uri: redirectUri, code_verifier: codeVerifier } = req.body;

      // Extract credentials from HTTP Basic Authentication header if present
      if (req.headers.authorization && req.headers.authorization.startsWith('Basic ')) {
        const credentials = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString(
          'ascii'
        );
        const [basicId, basicSecret] = credentials.split(':').map((val) => val ? decodeURIComponent(val) : '');
        clientId = basicId;
        clientSecret = basicSecret;
      }

      // Assert grant_type is supported
      if (!grantType || (grantType !== 'authorization_code' && grantType !== 'refresh_token')) {
        return res.status(400).json({
          error: 'unsupported_grant_type',
          error_description: 'Only the "authorization_code" and "refresh_token" grant types are supported.',
        });
      }

      let result;
      if (grantType === 'refresh_token') {
        const { refresh_token: refreshToken, scope } = req.body;
        result = await OidcService.refreshTokens({
          refreshToken,
          clientId,
          clientSecret,
          scope,
        });
      } else {
        result = await OidcService.exchangeCodeForTokens({
          code,
          redirectUri,
          clientId,
          clientSecret,
          codeVerifier,
        });
      }



      // Send Standard Token Response (no-cache headers required by OIDC specs)
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Pragma', 'no-cache');
      return res.status(200).json(result);
    } catch (err) {
      // Map exceptions to standard OIDC/OAuth 2.0 error schemas
      const status = err.status || 400;
      const errorMap = {
        InvalidClient: 'invalid_client',
        InvalidGrant: 'invalid_grant',
        InvalidRequest: 'invalid_request',
        ValidationError: 'invalid_request',
      };

      const errorCode = errorMap[err.name] || 'invalid_request';

      return res.status(status).json({
        error: errorCode,
        error_description: err.message,
      });
    }
  }

  /**
   * Handles GET /.well-known/openid-configuration discovery endpoint.
   */
  static async discovery(_req, res) {
    const discoveryDoc = {
      issuer: 'http://localhost:3001',
      authorization_endpoint: 'http://localhost:3001/authorize',
      token_endpoint: 'http://localhost:3001/token',
      userinfo_endpoint: 'http://localhost:3001/userinfo',
      jwks_uri: 'http://localhost:3001/jwks',
      response_types_supported: ['code'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
      claims_supported: ['iss', 'sub', 'aud', 'exp', 'iat', 'email', 'name'],
    };

    res.status(200).json(discoveryDoc);
  }

  /**
   * Handles GET /jwks keys endpoint.
   */
  static async jwks(_req, res, next) {
    try {
      const activeJwk = await getActiveJwk();
      res.status(200).json({
        keys: [activeJwk],
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Handles GET /userinfo profiles endpoint.
   */
  static async userinfo(req, res, next) {
    try {
      const userId = req.user.sub;
      const scope = req.user.scope;

      const claims = await OidcService.getUserInfo(userId, scope);
      return res.status(200).json(claims);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Handles GET /logout (OIDC end_session_endpoint).
   */
  static async logout(req, res, next) {
    const postLogoutRedirectUri = req.query.post_logout_redirect_uri || '/';
    if (!req.session) {
      return res.redirect(postLogoutRedirectUri);
    }
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('dauth_sid');
      return res.redirect(postLogoutRedirectUri);
    });
  }
}
