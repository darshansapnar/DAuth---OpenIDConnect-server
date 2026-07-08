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
      <meta name="description" content="Create your DAuth account — OpenID Connect Identity Provider">
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
          justify-content: center;
          align-items: flex-start;
          min-height: 100vh;
          padding: 5rem 1rem 7rem;
          overflow-y: auto;
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
          font-size: 0.8125rem;
          color: #64748b;
          margin-top: 0.375rem;
          font-weight: 400;
          letter-spacing: 0.01em;
          transition: color 0.4s ease;
        }

        /* ─── Alerts ─── */
        .alert {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.8125rem;
          margin-bottom: 1.25rem;
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          line-height: 1.5;
          transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
        }
        .alert-error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }

        /* ─── Form ─── */
        .form-group { margin-bottom: 1.25rem; position: relative; z-index: 1; }

        .label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
          letter-spacing: 0.01em;
          transition: color 0.3s ease;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 0.875rem;
          color: #94a3b8;
          pointer-events: none;
          display: flex;
          align-items: center;
          transition: color 0.3s ease;
        }

        .input {
          width: 100%;
          padding: 0.75rem 0.875rem 0.75rem 2.75rem;
          font-size: 0.875rem;
          font-family: inherit;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          outline: none;
          background-color: #f8fafc;
          color: #0f172a;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease, color 0.3s ease;
        }
        .input::placeholder { color: #94a3b8; }
        .input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
          background-color: #ffffff;
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          transition: color 0.2s ease;
        }
        .password-toggle:hover { color: #475569; }

        /* ─── Primary Button ─── */
        .btn-primary {
          position: relative;
          z-index: 1;
          width: 100%;
          padding: 0.8125rem;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: inherit;
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 2px 12px rgba(37,99,235,0.3);
          transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
          letter-spacing: 0.01em;
          margin-top: 0.5rem;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(37,99,235,0.4);
          filter: brightness(1.08);
        }
        .btn-primary:active { transform: translateY(0) scale(0.99); }
        .btn-primary svg { transition: transform 0.2s ease; }
        .btn-primary:hover svg:last-child { transform: translateX(3px); }

        /* ─── Divider ─── */
        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 1.5rem 0;
          color: #94a3b8;
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 500;
          position: relative;
          z-index: 1;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e5e7eb;
          transition: border-bottom-color 0.3s ease;
        }
        .divider:not(:empty)::before { margin-right: 0.75em; }
        .divider:not(:empty)::after { margin-left: 0.75em; }

        /* ─── Google Button ─── */
        .btn-google {
          position: relative;
          z-index: 1;
          width: 100%;
          padding: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: inherit;
          color: #1f2937;
          background-color: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          text-decoration: none;
          transition: background-color 0.15s ease, transform 0.1s ease, border-color 0.3s ease, box-shadow 0.2s ease;
        }
        .btn-google:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .btn-google:active { transform: scale(0.99); }

        /* ─── Footer Link ─── */
        .footer-text {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.8125rem;
          position: relative;
          z-index: 1;
        }
        .footer-text span { color: #64748b; transition: color 0.3s ease; }
        .footer-text a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
          margin-left: 0.25rem;
          transition: color 0.2s ease;
        }
        .footer-text a:hover { color: #1d4ed8; text-decoration: underline; }

        /* ═══════════════════════════════════════
           DARK MODE OVERRIDES
        ═══════════════════════════════════════ */
        .dark body {
          background-color: #05050A;
          color: #fafafa;
        }

        .dark .bg-grid {
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px);
        }

        .dark .bg-glow {
          background: radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%);
        }

        .dark .card-glow {
          background: linear-gradient(160deg, rgba(99,102,241,0.25), rgba(139,92,246,0.1));
        }

        .dark .card {
          background: #0c0d12;
          border-color: rgba(255,255,255,0.08);
          box-shadow:
            0 0 0 1px rgba(99,102,241,0.06),
            0 8px 32px rgba(0,0,0,0.5);
        }

        .dark .card-inner-glow {
          background: radial-gradient(ellipse at top center, rgba(99,102,241,0.06) 0%, transparent 65%);
        }

        .dark .theme-toggle-btn {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.08);
          color: #71717a;
        }
        .dark .theme-toggle-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #e4e4e7;
        }

        .dark .brand-name { color: #e0e7ff; }
        .dark .brand-subtitle { color: #71717a; }

        .dark .label { color: #d4d4d8; }
        .dark .input {
          background-color: #0c0d12;
          border-color: rgba(255,255,255,0.1);
          color: #fafafa;
        }
        .dark .input::placeholder { color: #52525b; }
        .dark .input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
          background-color: #111218;
        }
        .dark .input-icon { color: #52525b; }

        .dark .password-toggle { color: #52525b; }
        .dark .password-toggle:hover { color: #a1a1aa; }

        .dark .btn-primary {
          box-shadow: 0 2px 16px rgba(99,102,241,0.25);
        }
        .dark .btn-primary:hover {
          box-shadow: 0 4px 24px rgba(99,102,241,0.35);
        }

        .dark .divider { color: #52525b; }
        .dark .divider::before, .dark .divider::after {
          border-bottom-color: rgba(255,255,255,0.08);
        }

        .dark .btn-google {
          background-color: #0c0d12;
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
            <div class="brand-subtitle">OpenID Connect Identity Provider</div>
          </div>

          <!-- Error Alert -->
          ${errorMessage ? `<div class="alert alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            ${errorMessage}
          </div>` : ''}

          <!-- Registration Form -->
          <form action="/register" method="POST">
            <input type="hidden" name="_csrf" value="${req.csrfToken || ''}">

            <div class="form-group">
              <label class="label" for="name">Full Name</label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </span>
                <input class="input" type="text" id="name" name="name" required placeholder="John Doe" autocomplete="name">
              </div>
            </div>

            <div class="form-group">
              <label class="label" for="email">Email Address</label>
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
                <input class="input" type="password" id="password" name="password" required placeholder="Min 8 characters" autocomplete="new-password" style="padding-right: 2.75rem;">
                <button type="button" class="password-toggle" data-target="password" aria-label="Toggle password visibility">
                  <svg class="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  <svg class="eye-closed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="label" for="confirmPassword">Confirm Password</label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </span>
                <input class="input" type="password" id="confirmPassword" name="confirmPassword" required placeholder="••••••••" autocomplete="new-password" style="padding-right: 2.75rem;">
                <button type="button" class="password-toggle" data-target="confirmPassword" aria-label="Toggle password visibility">
                  <svg class="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  <svg class="eye-closed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                </button>
              </div>
            </div>

            <button class="btn-primary" type="submit">
              Create Account
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </form>

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

          <div class="footer-text">
            <span>Already have an account?</span>
            <a href="/login">Sign In</a>
          </div>
        </div>
      </div>

      <script>
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
          const isDark = document.documentElement.classList.toggle('dark');
          localStorage.setItem('dauth-theme', isDark ? 'dark' : 'light');
        });

        // Password visibility toggles
        document.querySelectorAll('.password-toggle').forEach((btn) => {
          btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            const eyeOpen = btn.querySelector('.eye-open');
            const eyeClosed = btn.querySelector('.eye-closed');
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
        });
      </script>
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
