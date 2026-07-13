import { Router } from 'express';
import { AuthService } from '#services/auth.js';
import { ClientRepository } from '#repositories/client.js';
import { env } from '#config/env.js';

const router = Router();

// GET /oauth/login - Renders the client-hosted OIDC login view
router.get('/oauth/login', async (req, res, next) => {
  try {
    // Clear the active user session if Switch Account is requested
    if (req.query.error && req.query.error.startsWith('Switch')) {
      if (req.session) {
        delete req.session.user;
      }
    }

    // If already authenticated, redirect back to OIDC authorization
    if (req.session && req.session.user) {
      if (req.session.authRequest) {
        const q = new URLSearchParams(req.session.authRequest).toString();
        return res.redirect(`/authorize?${q}`);
      }
      return res.redirect(`${env.DASHBOARD_URL}/dashboard`);
    }

    const errorMessage = req.query.error ? decodeURIComponent(req.query.error) : '';
    const successMessage = req.query.success ? decodeURIComponent(req.query.success) : '';

    // Fetch the client details to display on the OIDC login screen
    let clientName = 'your application';
    const authRequest = req.session.authRequest || {};
    const clientId = authRequest.client_id;
    if (clientId) {
      try {
        const client = await ClientRepository.findById(clientId);
        if (client) {
          clientName = client.name;
        }
      } catch (err) {
        console.error('[SERVER] Failed to query client details for OIDC login view:', err);
      }
    }

    // Google Identity Federation configuration status check
    const googleEnabled = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sign In - DAuth</title>
      <meta name="description" content="Sign in to authenticate with DAuth Client Applications">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
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
        /* ─── Reset & Base ─── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #f8fafc;
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          overflow: hidden;
          transition: background-color 0.4s ease, color 0.4s ease;
        }

        /* ─── Background Layers ─── */
        .bg-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, #000 50%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, #000 50%, transparent 100%);
          pointer-events: none;
          z-index: 0;
        }

        .bg-glow {
          position: fixed;
          top: -120px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(37,99,235,0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* ─── Card ─── */
        .card-wrapper {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          padding: 0 1rem;
          animation: fadeInUp 0.6s ease both;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .card-glow {
          position: absolute;
          inset: -1px;
          border-radius: 17px;
          background: linear-gradient(160deg, rgba(37,99,235,0.12), rgba(139,92,246,0.06));
          filter: blur(6px);
          opacity: 0;
          transition: opacity 0.5s ease;
          z-index: -1;
        }

        .card-wrapper:hover .card-glow { opacity: 1; }

        .card {
          position: relative;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 2.5rem 2.25rem 2rem;
          box-shadow:
            0 1px 3px rgba(0,0,0,0.04),
            0 6px 24px rgba(0,0,0,0.03);
          transition: background-color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
          overflow: hidden;
        }

        .card-inner-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at top center, rgba(37,99,235,0.03) 0%, transparent 65%);
          pointer-events: none;
        }

        /* ─── Theme Toggle ─── */
        .theme-toggle-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 5;
          width: 36px;
          height: 36px;
          background: rgba(0,0,0,0.03);
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 50%;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.25s ease, color 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
        }
        .theme-toggle-btn:hover {
          background: rgba(0,0,0,0.06);
          color: #334155;
          transform: scale(1.1);
        }
        .theme-toggle-btn svg { transition: transform 0.35s ease; }
        .sun-icon { display: block; }
        .moon-icon { display: none; }

        /* ─── Header ─── */
        .header { text-align: center; margin-bottom: 2rem; position: relative; z-index: 1; }

        .logo-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          box-shadow: 0 4px 16px rgba(37,99,235,0.25);
          position: relative;
        }
        .logo-icon svg { position: relative; z-index: 1; }
        .logo-icon::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(37,99,235,0.3), rgba(139,92,246,0.15));
          filter: blur(10px);
          z-index: 0;
        }

        .brand-name {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e3a8a;
          letter-spacing: -0.03em;
          transition: color 0.4s ease;
        }

        .brand-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 0.25rem;
          font-weight: 400;
          transition: color 0.4s ease;
        }

        .client-highlight {
          color: #2563eb;
        }

        /* ─── Forms ─── */
        .form-group { margin-bottom: 1.25rem; position: relative; z-index: 1; }

        .label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #475569;
          margin-bottom: 0.5rem;
          transition: color 0.4s ease;
        }

        .input-wrapper { position: relative; }

        .input {
          width: 100%;
          height: 44px;
          padding: 0 1rem 0 2.5rem;
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          color: #0f172a;
          outline: none;
          transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.4s ease, color 0.4s ease;
        }
        .input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
        }

        .input-icon {
          position: absolute;
          top: 50%;
          left: 1rem;
          transform: translateY(-50%);
          color: #94a3b8;
          display: flex;
          align-items: center;
          pointer-events: none;
          transition: color 0.25s ease;
        }
        .input:focus + .input-icon,
        .input-wrapper:focus-within .input-icon {
          color: #2563eb;
        }

        .password-toggle {
          position: absolute;
          top: 50%;
          right: 1rem;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0.25rem;
          border-radius: 4px;
          transition: color 0.25s ease;
        }
        .password-toggle:hover { color: #475569; }

        .checkbox-group {
          display: flex;
          align-items: center;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .checkbox-input {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          cursor: pointer;
          accent-color: #2563eb;
        }

        .checkbox-label {
          font-size: 0.875rem;
          color: #475569;
          margin-left: 0.5rem;
          cursor: pointer;
          user-select: none;
          transition: color 0.4s ease;
        }

        /* ─── Buttons ─── */
        .btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          height: 46px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border: none;
          border-radius: 8px;
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(37,99,235,0.15);
          transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          position: relative;
          z-index: 1;
        }
        .btn-primary:hover {
          box-shadow: 0 6px 16px rgba(37,99,235,0.25);
        }
        .btn-primary:active {
          transform: scale(0.985);
        }

        /* ─── Social Login Buttons ─── */
        .btn-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          width: 100%;
          height: 48px;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 500;
          text-decoration: none;
          margin-bottom: 0.75rem;
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          color: #334155;
        }
        .btn-google:hover {
          background-color: #f8fafc;
          border-color: #cbd5e1;
        }

        /* ─── Layout Divider ─── */
        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 1.5rem 0;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #94a3b8;
          font-weight: 600;
          position: relative;
          z-index: 1;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e2e8f0;
          transition: border-color 0.4s ease;
        }
        .divider::before { margin-right: .75rem; }
        .divider::after { margin-left: .75rem; }

        /* ─── Alerts ─── */
        .alert {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border: 1px solid;
          border-radius: 8px;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
          line-height: 1.4;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .alert svg { flex-shrink: 0; margin-top: 2px; }

        .alert-error {
          background-color: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
        }
        .alert-success {
          background-color: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;
        }

        /* ─── Footer ─── */
        .footer-text {
          text-align: center;
          font-size: 0.875rem;
          margin-top: 1.5rem;
          position: relative;
          z-index: 1;
          transition: color 0.4s ease;
        }
        .footer-text span { color: #64748b; }
        .footer-text a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
          margin-left: 0.25rem;
          transition: color 0.2s ease;
        }
        .footer-text a:hover { color: #1d4ed8; text-decoration: underline; }

        /* ─── Dark Mode overrides ─── */
        .dark body {
          background-color: #09090b;
          color: #fafafa;
        }
        .dark .bg-grid {
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.015) 1px, transparent 1px);
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, #000 60%, transparent 100%);
        }
        .dark .bg-glow {
          background: radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%);
        }
        .dark .card {
          background: #0f0f12;
          border-color: rgba(255,255,255,0.05);
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.7);
        }
        .dark .theme-toggle-btn {
          background: rgba(255,255,255,0.03);
          border-color: rgba(255,255,255,0.05);
          color: #71717a;
        }
        .dark .theme-toggle-btn:hover {
          background: rgba(255,255,255,0.06);
          color: #e4e4e7;
        }
        .dark .brand-name { color: #ffffff; }
        .dark .brand-subtitle { color: #71717a; }
        .dark .client-highlight { color: #818cf8; }
        .dark .label { color: #a1a1aa; }
        .dark .input {
          background-color: #060608;
          border-color: rgba(255,255,255,0.08);
          color: #f4f4f5;
        }
        .dark .input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }
        .dark .checkbox-label { color: #a1a1aa; }
        .dark .divider::before, .dark .divider::after { border-color: rgba(255,255,255,0.05); }
        .dark .btn-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          box-shadow: 0 4px 12px rgba(99,102,241,0.15);
        }
        .dark .btn-primary:hover {
          box-shadow: 0 6px 16px rgba(99,102,241,0.25);
        }

        .dark .btn-google {
          background-color: #0b0c10;
          border-color: rgba(255,255,255,0.1);
          color: #d4d4d8;
        }
        .dark .btn-google:hover {
          background-color: #161720;
          border-color: rgba(255,255,255,0.15);
        }

        .dark .alert-error {
          background-color: rgba(220,38,38,0.08);
          border-color: rgba(220,38,38,0.15);
          color: #fca5a5;
        }
        .dark .alert-success {
          background-color: rgba(22,163,74,0.08);
          border-color: rgba(22,163,74,0.15);
          color: #86efac;
        }

        .dark .footer-text span { color: #71717a; }
        .dark .footer-text a { color: #818cf8; }
        .dark .footer-text a:hover { color: #a5b4fc; }

        .dark .sun-icon { display: none; }
        .dark .moon-icon { display: block; }

        /* ─── Responsive ─── */
        @media (max-width: 480px) {
          .card { padding: 2rem 1.5rem 1.5rem; }
          .brand-name { font-size: 1.5rem; }
        }
      </style>
    </head>
    <body>
      <!-- Background layers -->
      <div class="bg-grid"></div>
      <div class="bg-glow"></div>

      <div class="card-wrapper">
        <div class="card-glow"></div>
        <div class="card">
          <div class="card-inner-glow"></div>

          <!-- Theme Toggle -->
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

          <!-- Branding -->
          <div class="header">
            <div class="logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                <circle cx="12" cy="16" r="1"></circle>
              </svg>
            </div>
            <div class="brand-name">DAuth</div>
            <div class="brand-subtitle">Sign in to continue to <span class="client-highlight" style="font-weight:600;">${clientName}</span></div>
          </div>

          <!-- Alerts -->
          ${successMessage ? `<div class="alert alert-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            ${successMessage}
          </div>` : ''}
          ${errorMessage ? `<div class="alert alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            ${errorMessage}
          </div>` : ''}

          <!-- Login Form -->
          <form action="/oauth/login" method="POST">
            <input type="hidden" name="_csrf" value="${req.csrfToken || ''}">

            <div class="form-group">
              <label class="label" for="email">Email address</label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                </span>
                <input class="input" type="email" id="email" name="email" required placeholder="name@domain.com" autocomplete="email">
              </div>
            </div>

            <div class="form-group">
              <label class="label" for="password">Password</label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </span>
                <input class="input" type="password" id="password" name="password" required placeholder="••••••••" autocomplete="current-password" style="padding-right: 2.75rem;">
                <button type="button" class="password-toggle" id="password-toggle" aria-label="Toggle password visibility">
                  <svg id="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  <svg id="eye-closed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                </button>
              </div>
            </div>

            <div class="checkbox-group">
              <input class="checkbox-input" type="checkbox" id="rememberMe" name="rememberMe" value="true">
              <label class="checkbox-label" for="rememberMe">Remember me for 30 days</label>
            </div>

            <button class="btn-primary" type="submit">
              Sign In
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </form>

          ${googleEnabled ? `
            <div class="divider">OR</div>
            <a href="/auth/google" class="btn-google">
              <svg width="18" height="18" viewBox="0 0 18 18" style="display:block;flex-shrink:0;">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.938 5.48 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.32 0 2.505.453 3.44 1.346l2.582-2.58C13.463.896 11.426 0 9 0 5.48 0 2.438 2.062.957 5.039l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </a>
          ` : ''}

          <div class="footer-text">
            <span>Don't have an account?</span>
            <a href="/register">Create one</a>
          </div>
        </div>
      </div>

      <script>
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
          const isDark = document.documentElement.classList.toggle('dark');
          localStorage.setItem('dauth-theme', isDark ? 'dark' : 'light');
        });

        // Password visibility toggle
        document.getElementById('password-toggle').addEventListener('click', () => {
          const input = document.getElementById('password');
          const eyeOpen = document.getElementById('eye-open');
          const eyeClosed = document.getElementById('eye-closed');
          if (input.type === 'password') {
            input.type = 'text';
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = 'block';
          } else {
            input.type = 'password';
            eyeOpen.style.display = 'block';
            eyeClosed.style.display = 'none';
          }
        });
      </script>
    </body>
    </html>
  `);
  } catch (err) {
    next(err);
  }
});

// POST /oauth/login - Processes user credentials and redirects back to authorize
router.post('/oauth/login', async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.redirect('/oauth/login?error=' + encodeURIComponent('Email and password are required.'));
    }

    let user;
    try {
      user = await AuthService.login({ email, password });
    } catch {
      return res.redirect('/oauth/login?error=' + encodeURIComponent('Invalid email or password.'));
    }

    // Establish session profile with administrator status check
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.email === 'admin@dauth.io',
    };

    if (rememberMe === 'true') {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    } else {
      req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
    }

    // Resume OIDC authorization flow if cache parameters exist, else send user to dashboard console
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
