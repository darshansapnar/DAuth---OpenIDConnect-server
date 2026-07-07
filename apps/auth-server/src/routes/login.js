import { Router } from 'express';
import { AuthService } from '#services/auth.js';
import { env } from '#config/env.js';

const router = Router();

// GET /login - Renders the provider-hosted login view
router.get('/login', (req, res) => {
  // Clear the active user session if Switch Account is requested
  if (req.query.error && req.query.error.startsWith('Switch')) {
    if (req.session) {
      delete req.session.user;
    }
  }

  // If already authenticated, redirect back to authorization or dashboard console
  if (req.session && req.session.user) {
    if (req.session.authRequest) {
      const q = new URLSearchParams(req.session.authRequest).toString();
      return res.redirect(`/authorize?${q}`);
    }
    return res.redirect(`${env.DASHBOARD_URL}/dashboard`);
  }

  const errorMessage = req.query.error ? decodeURIComponent(req.query.error) : '';
  const successMessage = req.query.success ? decodeURIComponent(req.query.success) : '';

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sign In - DAuth</title>
      <script>
        (function() {
          const savedTheme = localStorage.getItem('dauth-theme');
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        })();
      </script>
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
          transition: background-color 0.3s ease, color 0.3s ease;
        }
        .container {
          position: relative;
          width: 100%;
          max-width: 400px;
          padding: 2.5rem 2rem;
          background: #ffffff;
          border: 1px solid rgba(37, 99, 235, 0.12);
          border-radius: 8px;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 8px -1px rgba(0, 0, 0, 0.03);
          transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
        }
        .container:hover {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 16px -6px rgba(37, 99, 235, 0.04);
          border-color: rgba(37, 99, 235, 0.22);
        }
        .header { text-align: center; margin-bottom: 2rem; }
        .logo { font-size: 1.5rem; font-weight: bold; color: #1e3a8a; letter-spacing: -0.025em; transition: color 0.3s ease; }
        .subtitle { font-size: 0.875rem; color: #64748b; margin-top: 0.5rem; transition: color 0.3s ease; }
        .form-group { margin-bottom: 1.25rem; }
        .label { display: block; font-size: 0.875rem; font-weight: 500; color: #334155; margin-bottom: 0.5rem; transition: color 0.3s ease; }
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          outline: none;
          background-color: #ffffff;
          color: #0f172a;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.3s ease, color 0.3s ease;
        }
        .input:focus { 
          border-color: #2563eb; 
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        .checkbox-group { display: flex; align-items: center; gap: 0.5rem; margin: 1rem 0; }
        .checkbox-label { font-size: 0.875rem; color: #475569; user-select: none; transition: color 0.3s ease; }
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
          transition: background-color 0.15s ease, transform 0.1s ease;
        }
        .btn:hover { background-color: #1d4ed8; }
        .btn:active { transform: scale(0.98); }
        .btn-google {
          width: 100%;
          padding: 0.625rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #1f2937;
          background-color: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          text-decoration: none;
          margin-top: 1rem;
          transition: background-color 0.15s ease, transform 0.1s ease, border-color 0.3s ease;
        }
        .btn-google:hover {
          background-color: #f9fafb;
        }
        .btn-google:active { transform: scale(0.98); }
        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 1.5rem 0;
          color: #9ca3af;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e5e7eb;
          transition: border-bottom-color 0.3s ease;
        }
        .divider:not(:empty)::before {
          margin-right: .5em;
        }
        .divider:not(:empty)::after {
          margin-left: .5em;
        }
        .error {
          padding: 0.75rem 1rem;
          background-color: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 6px;
          color: #b91c1c;
          font-size: 0.875rem;
          margin-bottom: 1.25rem;
          transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
        }
        .success {
          padding: 0.75rem 1rem;
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          color: #15803d;
          font-size: 0.875rem;
          margin-bottom: 1.25rem;
          text-align: center;
          transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
        }

        /* Theme Toggle Button Style */
        .theme-toggle-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          padding: 0.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s, color 0.2s, transform 0.2s;
        }
        .theme-toggle-btn:hover {
          background-color: #f1f5f9;
          color: #0f172a;
          transform: scale(1.05);
        }
        .theme-toggle-btn svg {
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .sun-icon { display: block; }
        .moon-icon { display: none; }

        /* Dark Mode Class overrides */
        .dark body {
          background-color: #09090b;
          color: #fafafa;
        }
        .dark .container {
          background: #18181b;
          border-color: rgba(99, 102, 241, 0.2);
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 2px 10px -2px rgba(255, 255, 255, 0.01);
        }
        .dark .container:hover {
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.6), 0 8px 16px -6px rgba(99, 102, 241, 0.08);
          border-color: rgba(99, 102, 241, 0.3);
        }
        .dark .logo {
          color: #3b82f6;
        }
        .dark .subtitle {
          color: #a1a1aa;
        }
        .dark .label {
          color: #e4e4e7;
        }
        .dark .input {
          background-color: #18181b;
          border-color: #3f3f46;
          color: #fafafa;
        }
        .dark .input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        .dark .checkbox-label {
          color: #a1a1aa;
        }
        .dark .btn-google {
          background-color: #18181b;
          border-color: #3f3f46;
          color: #e4e4e7;
        }
        .dark .btn-google:hover {
          background-color: #27272a;
        }
        .dark .divider::before, .dark .divider::after {
          border-bottom-color: #3f3f46;
        }
        .dark .error {
          background-color: rgba(220,38,38,0.1);
          border-color: rgba(220,38,38,0.2);
          color: #fca5a5;
        }
        .dark .success {
          background-color: rgba(22,163,74,0.1);
          border-color: rgba(22,163,74,0.2);
          color: #86efac;
        }
        .dark .theme-toggle-btn {
          color: #a1a1aa;
        }
        .dark .theme-toggle-btn:hover {
          background-color: #27272a;
          color: #fafafa;
        }
        .dark .sun-icon { display: none; }
        .dark .moon-icon { display: block; }
      </style>
    </head>
    <body>
      <div class="container">
        <button id="theme-toggle" class="theme-toggle-btn" aria-label="Toggle theme">
          <svg class="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <svg class="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
        <div class="header">
          <div class="logo">🔐 DAuth Platform</div>
          <div class="subtitle">Sign in to your OIDC developer identity</div>
        </div>
        
        ${successMessage ? `<div class="success">${successMessage}</div>` : ''}
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

        <div class="divider">or</div>

        <a href="/auth/google" class="btn-google">
          <svg width="18" height="18" viewBox="0 0 18 18" style="display: block; flex-shrink: 0;">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.938 5.48 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.32 0 2.505.453 3.44 1.346l2.582-2.58C13.463.896 11.426 0 9 0 5.48 0 2.438 2.062.957 5.039l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </a>

        <div style="text-align: center; margin-top: 1.25rem; font-size: 0.875rem;">
          <span style="color: #64748b;">Don't have an account?</span>
          <a href="/register" style="color: #2563eb; text-decoration: none; font-weight: 500; margin-left: 0.25rem;">Create one</a>
        </div>
      </div>
      <script>
        document.getElementById('theme-toggle').addEventListener('click', () => {
          const isDark = document.documentElement.classList.toggle('dark');
          localStorage.setItem('dauth-theme', isDark ? 'dark' : 'light');
        });
      </script>
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

    return res.redirect(`${env.DASHBOARD_URL}/dashboard`);
  } catch (err) {
    next(err);
  }
});

export default router;
