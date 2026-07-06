import { Router } from 'express';
import { AuthService } from '#services/auth.js';
import { UserRepository } from '#repositories/user.js';
import { isValidEmail } from '@dauth/shared';
import { env } from '#config/env.js';

const router = Router();

// GET /register - Renders the public user registration view
router.get('/register', (req, res) => {
  // If already authenticated, redirect back to authorization or dashboard console
  if (req.session && req.session.user) {
    if (req.session.authRequest) {
      const q = new URLSearchParams(req.session.authRequest).toString();
      return res.redirect(`/authorize?${q}`);
    }
    return res.redirect(`${env.DASHBOARD_URL}/dashboard`);
  }

  const errorMessage = req.query.error ? decodeURIComponent(req.query.error) : '';

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Create Account - DAuth</title>
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
          max-width: 420px;
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
        .btn-secondary {
          width: 100%;
          padding: 0.625rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #475569;
          background-color: transparent;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          display: block;
          margin-top: 0.75rem;
          transition: all 0.15s ease;
        }
        .btn-secondary:hover {
          background-color: #f1f5f9;
          color: #0f172a;
        }
        .error {
          padding: 0.75rem 1rem;
          background-color: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 6px;
          color: #b91c1c;
          font-size: 0.875rem;
          margin-bottom: 1.25rem;
        }
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #09090b;
            color: #fafafa;
          }
          .container {
            background: #18181b;
            border-color: rgba(255,255,255,0.1);
          }
          .logo {
            color: #3b82f6;
          }
          .subtitle {
            color: #a1a1aa;
          }
          .label {
            color: #e4e4e7;
          }
          .input {
            background-color: #18181b;
            border-color: #3f3f46;
            color: #fafafa;
          }
          .input:focus {
            border-color: #3b82f6;
          }
          .btn-secondary {
            border-color: #3f3f46;
            color: #e4e4e7;
          }
          .btn-secondary:hover {
            background-color: #27272a;
            color: #fafafa;
          }
          .error {
            background-color: rgba(220,38,38,0.1);
            border-color: rgba(220,38,38,0.2);
            color: #fca5a5;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔐 DAuth Platform</div>
          <div class="subtitle">Create your OIDC developer account</div>
        </div>
        
        ${errorMessage ? `<div class="error">${errorMessage}</div>` : ''}

        <form action="/register" method="POST">
          <input type="hidden" name="_csrf" value="${req.csrfToken || ''}">
          
          <div class="form-group">
            <label class="label" for="name">Full Name</label>
            <input class="input" type="text" id="name" name="name" required placeholder="John Doe">
          </div>

          <div class="form-group">
            <label class="label" for="email">Email Address</label>
            <input class="input" type="email" id="email" name="email" required placeholder="name@domain.com">
          </div>

          <div class="form-group">
            <label class="label" for="password">Password</label>
            <input class="input" type="password" id="password" name="password" required placeholder="Min 8 characters">
          </div>

          <div class="form-group">
            <label class="label" for="confirmPassword">Confirm Password</label>
            <input class="input" type="password" id="confirmPassword" name="confirmPassword" required placeholder="••••••••">
          </div>

          <button class="btn" type="submit">Create Account</button>
          <a href="/login" class="btn-secondary">Back to Sign In</a>
        </form>
      </div>
    </body>
    </html>
  `);
});

// POST /register - Processes public registration form data
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // 1. All fields validation
    if (!name || !email || !password || !confirmPassword) {
      return res.redirect('/register?error=' + encodeURIComponent('All fields are required.'));
    }

    // 2. Email format validation
    if (!isValidEmail(email)) {
      return res.redirect('/register?error=' + encodeURIComponent('Please enter a valid email address.'));
    }

    // 3. Password length validation
    if (password.length < 8) {
      return res.redirect('/register?error=' + encodeURIComponent('Password must be at least 8 characters long.'));
    }

    // 4. Password confirmation validation
    if (password !== confirmPassword) {
      return res.redirect('/register?error=' + encodeURIComponent('Passwords do not match.'));
    }

    // 5. Unique email validation
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      return res.redirect('/register?error=' + encodeURIComponent('This email address is already registered.'));
    }

    // 6. Create user using AuthService (hashes password with bcrypt automatically)
    await AuthService.register({ email, password, name });

    // 7. Success redirect
    return res.redirect('/login?success=' + encodeURIComponent('Account created successfully. Please sign in.'));
  } catch (err) {
    next(err);
  }
});

export default router;
