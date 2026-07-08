import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import * as jose from 'jose';
import { env } from '#config/env.js';
import { UserRepository } from '#repositories/user.js';

const router = Router();

// GET /auth/google - Redirects user to Google OAuth 2.0 endpoint
router.get('/auth/google', (req, res) => {
  // 1. Verify Google Identity configuration
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Configuration Error</title>
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #f8fafc; color: #0f172a; margin: 0; }
          .card { max-width: 450px; padding: 2rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center; }
          h2 { color: #dc2626; margin-top: 0; }
          p { color: #475569; font-size: 0.875rem; line-height: 1.5; }
          .code { font-family: monospace; background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; color: #0f172a; }
          @media (prefers-color-scheme: dark) {
            body { background-color: #09090b; color: #fafafa; }
            .card { background: #18181b; border-color: rgba(255,255,255,0.1); }
            .code { background: #27272a; color: #f4f4f5; }
            p { color: #a1a1aa; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Configuration Missing</h2>
          <p>Google Identity Federation is not fully configured on this DAuth server.</p>
          <p>Please configure <span class="code">GOOGLE_CLIENT_ID</span> and <span class="code">GOOGLE_CLIENT_SECRET</span> in your local <span class="code">.env</span> configuration file to enable this sign-in flow.</p>
        </div>
      </body>
      </html>
    `);
  }

  // 2. Generate secure random state token to prevent CSRF attacks
  const state = crypto.randomBytes(16).toString('hex');
  req.session.googleState = state;

  // 3. Build Google OAuth Redirect URI
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid profile email',
    state: state,
    prompt: 'select_account',
  });

  const googleAuthorizeUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.redirect(googleAuthorizeUrl);
});

// GET /api/auth/federation/google/callback - Processes Google authentication redirect response
router.get('/api/auth/federation/google/callback', async (req, res, next) => {
  try {
    const { code, state, error: googleError } = req.query;

    // 1. Handle Google-level authorization errors
    if (googleError) {
      return res.redirect('/login?error=' + encodeURIComponent(`Google authentication failed: ${googleError}`));
    }

    // 2. Verify state token match to block CSRF replays
    const cachedState = req.session.googleState;
    if (!state || !cachedState || state !== cachedState) {
      return res.redirect('/login?error=' + encodeURIComponent('Security verification failed: State token mismatch.'));
    }

    // Clean state verification token from session
    delete req.session.googleState;

    if (!code) {
      return res.redirect('/login?error=' + encodeURIComponent('Google did not return an authorization code.'));
    }

    // 3. Exchange authorization code for Google ID Token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokens = await tokenResponse.json();
    if (tokens.error) {
      return res.redirect('/login?error=' + encodeURIComponent(`Google token exchange failed: ${tokens.error_description || tokens.error}`));
    }

    const idToken = tokens.id_token;
    if (!idToken) {
      return res.redirect('/login?error=' + encodeURIComponent('Google response did not contain an ID Token.'));
    }

    // 4. Verify Google ID Token signature and claims
    let payload;
    try {
      const JWKS = jose.createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
      const verification = await jose.jwtVerify(idToken, JWKS, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = verification.payload;
    } catch (verifyErr) {
      console.error('[ERROR] Google ID Token verification failed:', verifyErr);
      return res.redirect('/login?error=' + encodeURIComponent('Google ID Token validation failed.'));
    }

    const { sub, email, name, picture, email_verified } = payload;

    if (!email) {
      return res.redirect('/login?error=' + encodeURIComponent('Google account must share an email address to proceed.'));
    }

    // 5. Query existing user by email
    let user = await UserRepository.findByEmail(email);

    // 6. If user doesn't exist, create a new DAuth federated account
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 12);
      user = await UserRepository.create({
        email,
        passwordHash,
        name: name || null,
        avatarUrl: picture || null,
      });
    } else {
      // Proactively update name or avatar if updated on Google
      if (picture && user.avatarUrl !== picture) {
        // Optional path updates can be done here. Since the repository holds db models, we keep it simple.
      }
    }

    // 7. Establish clean administrator or OIDC session
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    // 8. Redirect back to client OIDC flow context if active, otherwise load console dashboard
    if (req.session.authRequest) {
      const authParams = req.session.authRequest;
      delete req.session.authRequest;
      const q = new URLSearchParams(authParams).toString();
      return req.session.save((err) => {
        if (err) return next(err);
        return res.redirect(`/authorize?${q}`);
      });
    }

    return req.session.save((err) => {
      if (err) return next(err);
      return res.redirect(`${env.DASHBOARD_URL}/dashboard`);
    });
  } catch (err) {
    next(err);
  }
});

export default router;
