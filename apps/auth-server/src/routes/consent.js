import { Router } from 'express';
import { ClientRepository } from '#repositories/client.js';


const router = Router();

// GET /consent - Renders the scope validation and approval prompt screen
router.get('/consent', async (req, res, next) => {
  try {
    // 1. Verify user session and cached authentication request context
    if (!req.session || !req.session.user || !req.session.authRequest) {
      return res.redirect('/login');
    }

    const { client_id: clientId, scope } = req.session.authRequest;

    // 2. Fetch requesting OAuth/OIDC client details
    const client = await ClientRepository.findById(clientId);
    if (!client) {
      return res.status(400).send('Invalid OIDC client configuration.');
    }

    // 3. Match scopes to readable descriptions
    const scopeDescriptions = {
      openid: 'Sign you in using your DAuth developer identity.',
      profile: 'Read your basic profile claims (such as name and avatar).',
      email: 'Read your email address.',
    };

    const requestedScopes = typeof scope === 'string' ? scope.split(' ') : [];
    const formattedScopes = requestedScopes.map((s) => ({
      name: s,
      description: scopeDescriptions[s] || `Access scope permission "${s}".`,
    }));

    // 4. Render OIDC Consent Page
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authorize App - DAuth</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .container {
            width: 100%;
            max-width: 440px;
            padding: 2.5rem 2rem;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
          }
          .header { text-align: center; margin-bottom: 2rem; }
          .logo { font-size: 1.5rem; font-weight: bold; color: #1e3a8a; letter-spacing: -0.025em; }
          .subtitle { font-size: 0.875rem; color: #64748b; margin-top: 0.5rem; }
          .client-box {
            background-color: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 1rem;
            text-align: center;
            margin-bottom: 1.5rem;
          }
          .client-name { font-weight: bold; color: #1e293b; font-size: 1rem; }
          .scope-title { font-size: 0.875rem; font-weight: 600; color: #475569; margin-bottom: 0.75rem; }
          .scope-list { list-style: none; margin-bottom: 2rem; }
          .scope-item {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            font-size: 0.875rem;
            color: #334155;
            margin-bottom: 0.75rem;
            line-height: 1.4;
          }
          .scope-icon { color: #16a34a; font-weight: bold; font-size: 1.1rem; line-height: 1; }
          .scope-text { flex: 1; }
          .scope-codename { font-family: monospace; font-size: 0.75rem; color: #64748b; display: block; margin-top: 0.15rem; }
          .btn-group { display: flex; flex-direction: column; gap: 0.75rem; }
          .btn {
            width: 100%;
            padding: 0.625rem;
            font-size: 0.875rem;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            text-align: center;
            transition: all 0.15s ease;
          }
          .btn-approve {
            color: #ffffff;
            background-color: #2563eb;
            border: none;
          }
          .btn-approve:hover { background-color: #1d4ed8; }
          .btn-deny {
            color: #475569;
            background-color: #ffffff;
            border: 1px solid #cbd5e1;
          }
          .btn-deny:hover {
            background-color: #f8fafc;
            color: #0f172a;
          }
          .user-banner {
            font-size: 0.75rem;
            color: #64748b;
            text-align: center;
            margin-top: 1.5rem;
            border-top: 1px solid #e2e8f0;
            padding-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔐 DAuth Permission</div>
            <div class="subtitle">Access Request Approval Gateway</div>
          </div>

          <div class="client-box">
            <span class="client-name">${client.name}</span>
            <p style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem;">wants to access your account details</p>
          </div>

          <h3 class="scope-title">Permissions Requested:</h3>
          <ul class="scope-list">
            ${formattedScopes
              .map(
                (scope) => `
              <li class="scope-item">
                <span class="scope-icon">✓</span>
                <div class="scope-text">
                  <span>${scope.description}</span>
                  <span class="scope-codename">Scope: ${scope.name}</span>
                </div>
              </li>
            `
              )
              .join('')}
          </ul>

          <form action="/consent" method="POST">
            <input type="hidden" name="_csrf" value="${req.csrfToken || ''}">
            <div class="btn-group">
              <button class="btn btn-approve" type="submit" name="approval" value="approve">Authorize and Continue</button>
              <button class="btn btn-deny" type="submit" name="approval" value="cancel">Deny Access</button>
            </div>
          </form>

          <div class="user-banner">
            Signed in as <strong>${req.session.user.email}</strong>. Not you? <a href="/login?error=Switch+account" style="color: #2563eb; text-decoration: none;">Sign in with another account</a>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    next(err);
  }
});

// POST /consent - Processes scope approvals and redirects back to authorize or client callbacks
router.post('/consent', async (req, res, next) => {
  try {
    if (!req.session || !req.session.user || !req.session.authRequest) {
      return res.redirect('/login');
    }

    const { approval } = req.body;
    const authParams = req.session.authRequest;

    if (approval === 'approve') {
      // 1. Grant consent approval flag for the current sequence
      req.session.consentApproved = true;

      // Audit: consent approved


      // 2. Save session explicitly before redirecting to avoid race condition
      req.session.save((err) => {
        if (err) return next(err);
        const query = new URLSearchParams(authParams).toString();
        return res.redirect(`/authorize?${query}`);
      });
    } else {
      // 3. Clean up the cached request variables
      delete req.session.authRequest;



      // 4. Save session explicitly before redirecting
      req.session.save((err) => {
        if (err) return next(err);
        const redirectUri = new URL(authParams.redirect_uri);
        redirectUri.searchParams.append('error', 'access_denied');
        redirectUri.searchParams.append('error_description', 'User denied consent to access the requested scopes.');
        if (authParams.state) {
          redirectUri.searchParams.append('state', authParams.state);
        }
        return res.redirect(redirectUri.toString());
      });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
