import { Router } from 'express';
import { ClientRepository } from '#repositories/client.js';


const router = Router();

// GET /consent - Renders the scope validation and approval prompt screen
router.get('/consent', async (req, res, next) => {
  try {
    // 1. Verify user session and cached authentication request context
    if (!req.session || !req.session.user || !req.session.authRequest) {
      return res.redirect('/oauth/login');
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
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authorize App - DAuth</title>
        <meta name="description" content="Authorize Client Application Access — DAuth Identity Provider">
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
          .header { text-align: center; margin-bottom: 1.5rem; position: relative; z-index: 1; }

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

          /* ─── Client Box ─── */
          .client-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1rem;
            text-align: center;
            margin-bottom: 1.5rem;
            position: relative;
            z-index: 1;
            transition: background-color 0.3s ease, border-color 0.3s ease;
          }
          .client-name { font-weight: 700; color: #0f172a; font-size: 1rem; transition: color 0.3s ease; }
          .client-meta { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; transition: color 0.3s ease; }

          /* ─── Scope Sections ─── */
          .scope-title {
            font-size: 0.8125rem;
            font-weight: 600;
            color: #475569;
            margin-bottom: 0.75rem;
            letter-spacing: 0.01em;
            position: relative;
            z-index: 1;
            transition: color 0.3s ease;
          }
          .scope-list { list-style: none; margin-bottom: 1.75rem; position: relative; z-index: 1; }
          .scope-item {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            font-size: 0.8125rem;
            color: #334155;
            margin-bottom: 0.875rem;
            line-height: 1.5;
            transition: color 0.3s ease;
          }
          .scope-icon {
            color: #16a34a;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 0.125rem;
          }
          .scope-text { flex: 1; }
          .scope-codename { font-family: monospace; font-size: 0.6875rem; color: #64748b; display: block; margin-top: 0.15rem; transition: color 0.3s ease; }

          /* ─── Button Group ─── */
          .btn-group { display: flex; flex-direction: column; gap: 0.75rem; position: relative; z-index: 1; }
          .btn {
            width: 100%;
            padding: 0.8125rem;
            font-size: 0.875rem;
            font-weight: 600;
            font-family: inherit;
            border-radius: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
            letter-spacing: 0.01em;
          }
          .btn-approve {
            color: #ffffff;
            background: linear-gradient(135deg, #2563eb, #7c3aed);
            border: none;
            box-shadow: 0 2px 12px rgba(37,99,235,0.3);
          }
          .btn-approve:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 20px rgba(37,99,235,0.4);
            filter: brightness(1.08);
          }
          .btn-approve:active { transform: translateY(0) scale(0.99); }

          .btn-deny {
            color: #475569;
            background-color: #ffffff;
            border: 1px solid #cbd5e1;
          }
          .btn-deny:hover {
            background-color: #f9fafb;
            border-color: #9ca3af;
            box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          }
          .btn-deny:active { transform: scale(0.99); }

          /* ─── User Banner ─── */
          .user-banner {
            font-size: 0.8125rem;
            color: #64748b;
            text-align: center;
            margin-top: 1.5rem;
            border-top: 1px solid #e2e8f0;
            padding-top: 1.25rem;
            position: relative;
            z-index: 1;
            transition: border-color 0.3s ease, color 0.3s ease;
          }
          .user-banner strong { color: #334155; transition: color 0.3s ease; }
          .user-banner a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 500;
            margin-left: 0.25rem;
            transition: color 0.2s ease;
          }
          .user-banner a:hover { color: #1d4ed8; text-decoration: underline; }

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

          .dark .client-box {
            background-color: rgba(255, 255, 255, 0.02);
            border-color: rgba(255, 255, 255, 0.06);
          }
          .dark .client-name { color: #fafafa; }
          .dark .client-meta { color: #71717a; }

          .dark .scope-title { color: #a1a1aa; }
          .dark .scope-item { color: #d4d4d8; }
          .dark .scope-codename { color: #52525b; }

          .dark .btn-approve {
            box-shadow: 0 2px 16px rgba(99,102,241,0.25);
          }
          .dark .btn-approve:hover {
            box-shadow: 0 4px 24px rgba(99,102,241,0.35);
          }

          .dark .btn-deny {
            background-color: #0c0d12;
            border-color: rgba(255,255,255,0.1);
            color: #d4d4d8;
          }
          .dark .btn-deny:hover {
            background-color: #161720;
            border-color: rgba(255,255,255,0.15);
          }

          .dark .user-banner {
            border-top-color: rgba(255,255,255,0.08);
            color: #71717a;
          }
          .dark .user-banner strong { color: #d4d4d8; }
          .dark .user-banner a { color: #818cf8; }
          .dark .user-banner a:hover { color: #a5b4fc; }

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
              <div class="brand-subtitle">Access Request Approval Gateway</div>
            </div>

            <div class="client-box">
              <span class="client-name">${client.name}</span>
              <p class="client-meta">wants to access your account details</p>
            </div>

            <h3 class="scope-title">Permissions Requested:</h3>
            <ul class="scope-list">
              ${formattedScopes
                .map(
                  (scope) => `
                <li class="scope-item">
                  <span class="scope-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </span>
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
                <button class="btn btn-approve" type="submit" name="approval" value="approve">
                  Authorize and Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
                <button class="btn btn-deny" type="submit" name="approval" value="cancel">Deny Access</button>
              </div>
            </form>

            <div class="user-banner">
              Signed in as <strong>${req.session.user.email}</strong>. Not you? <a href="/login?error=Switch+account">Sign in with another account</a>
            </div>
          </div>
        </div>

        <script>
          // Theme toggle
          document.getElementById('theme-toggle').addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('dauth-theme', isDark ? 'dark' : 'light');
          });
        </script>
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
      return res.redirect('/oauth/login');
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
