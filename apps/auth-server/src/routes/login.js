import { Router } from 'express';
import { AuthService } from '#services/auth.js';

const router = Router();

// GET /login - Renders the provider-hosted login view
router.get('/login', (req, res) => {
  // If already authenticated, redirect back to authorization or dashboard console
  if (req.session && req.session.user) {
    if (req.session.authRequest) {
      const q = new URLSearchParams(req.session.authRequest).toString();
      return res.redirect(`/authorize?${q}`);
    }
    return res.redirect('http://localhost:5173/dashboard');
  }

  const errorMessage = req.query.error ? decodeURIComponent(req.query.error) : '';

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sign In - DAuth</title>
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
          max-width: 400px;
          padding: 2.5rem 2rem;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }
        .header { text-align: center; margin-bottom: 2rem; }
        .logo { font-size: 1.5rem; font-weight: bold; color: #1e3a8a; letter-spacing: -0.025em; }
        .subtitle { font-size: 0.875rem; color: #64748b; margin-top: 0.5rem; }
        .form-group { margin-bottom: 1.25rem; }
        .label { display: block; font-size: 0.875rem; font-weight: 500; color: #334155; margin-bottom: 0.5rem; }
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          outline: none;
          transition: border-color 0.15s ease;
        }
        .input:focus { border-color: #2563eb; }
        .checkbox-group { display: flex; align-items: center; gap: 0.5rem; margin: 1rem 0; }
        .checkbox-label { font-size: 0.875rem; color: #475569; user-select: none; }
        .btn {
          width: 100%;
          padding: 0.625rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #ffffff;
          background-color: #2563eb;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .btn:hover { background-color: #1d4ed8; }
        .error {
          padding: 0.75rem 1rem;
          background-color: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 6px;
          color: #b91c1c;
          font-size: 0.875rem;
          margin-bottom: 1.25rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔐 DAuth Platform</div>
          <div class="subtitle">Sign in to your OIDC developer identity</div>
        </div>
        
        ${errorMessage ? `<div class="error">${errorMessage}</div>` : ''}

        <form action="/login" method="POST">
          <input type="hidden" name="_csrf" value="${req.csrfToken || ''}">
          <div class="form-group">
            <label class="label" for="email">Email address</label>
            <input class="input" type="email" id="email" name="email" required placeholder="name@domain.com">
          </div>
          <div class="form-group">
            <label class="label" for="password">Password</label>
            <input class="input" type="password" id="password" name="password" required placeholder="••••••••">
          </div>
          <div class="checkbox-group">
            <input type="checkbox" id="rememberMe" name="rememberMe" value="true">
            <label class="checkbox-label" for="rememberMe">Remember me for 30 days</label>
          </div>
          <button class="btn" type="submit">Sign In</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// POST /login - Processes administrative credentials and resumes authorization flow
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.redirect('/login?error=' + encodeURIComponent('Email and password are required.'));
    }

    let user;
    try {
      user = await AuthService.login({ email, password });
    } catch {
      return res.redirect('/login?error=' + encodeURIComponent('Invalid email or password.'));
    }

    // Attach user profile to session state
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    if (rememberMe === 'true') {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    } else {
      req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
    }

    // Resume OIDC authorization flow if cache parameters exist, else send user to dashboard console
    if (req.session.authRequest) {
      const authParams = req.session.authRequest;
      // Scrub query parameters from user session
      delete req.session.authRequest;
      const q = new URLSearchParams(authParams).toString();
      return res.redirect(`/authorize?${q}`);
    }

    return res.redirect('http://localhost:5173/dashboard');
  } catch (err) {
    next(err);
  }
});

export default router;
