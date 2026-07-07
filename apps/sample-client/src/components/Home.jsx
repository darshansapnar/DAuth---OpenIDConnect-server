import React, { useEffect, useState } from 'react';
import { Button } from '@dauth/ui';

// Helper to decode OIDC ID token JWT payloads on the client side
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode ID Token JWT:', e);
    return null;
  }
}

// Generates a high-entropy cryptographically random verifier string
function generateCodeVerifier() {
  const array = new Uint8Array(43); // Min required length is 43 characters
  window.crypto.getRandomValues(array);
  return Array.from(array, (dec) => dec.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 128); // Standardize verifier length
}

// Generates an S256 Base64URL-encoded code challenge from the verifier
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export default function Home() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('dauth_session');
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch {
        localStorage.removeItem('dauth_session');
      }
    }
  }, []);

  const handleLogin = async () => {
    // Generate secure cryptographically random state parameter
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    const state = Array.from(array, (dec) => dec.toString(16).padStart(2, '0')).join('');

    // Persist state in sessionStorage for validation during OIDC Callback phase
    sessionStorage.setItem('dauth_oauth_state', state);

    // PKCE parameters generation
    const verifier = generateCodeVerifier();
    sessionStorage.setItem('dauth_oauth_verifier', verifier);
    const challenge = await generateCodeChallenge(verifier);

    // Build OIDC authorization request URL with PKCE params
    const authUrl = new URL('http://localhost:3001/authorize');
    authUrl.searchParams.append('client_id', 'dauth_cli_sample_client');
    authUrl.searchParams.append('redirect_uri', 'http://localhost:5174/callback');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'openid profile email');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', challenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    // Redirect browser to DAuth Authorization Server GET /authorize
    window.location.href = authUrl.toString();
  };

  const handleLogout = () => {
    localStorage.removeItem('dauth_session');
    setSession(null);
    window.location.href = 'http://localhost:3001/logout?post_logout_redirect_uri=http://localhost:5174/';
  };

  const idTokenClaims = session?.tokens?.id_token ? decodeJwt(session.tokens.id_token) : null;

  return (
    <div className="min-h-screen bg-[#05050A] flex flex-col font-sans text-zinc-50 relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
      
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <header className="relative z-10 border-b border-white/5 h-16 flex items-center bg-[#05050A]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🧪</span>
            <span className="font-bold text-zinc-100 tracking-tight text-sm">
              Sample OIDC Client Application
            </span>
          </div>
          <div className="flex items-center gap-4">
            {session && (
              <Button variant="secondary" size="sm" onClick={handleLogout} className="!bg-zinc-800 !text-white !border-white/10 hover:!bg-zinc-700">
                Logout
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 w-full relative z-10">
        {!session ? (
          <div className="relative w-full max-w-lg mx-auto group animate-fadeIn">
            {/* Soft background glow behind the card */}
            <div className="absolute -inset-[1px] bg-gradient-to-b from-indigo-500/30 to-purple-500/10 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition duration-700 -z-10"></div>
            
            <div className="bg-[#0b0c10] border border-white/10 rounded-2xl p-10 shadow-[0_0_40px_-10px_rgba(99,102,241,0.15)] text-center relative overflow-hidden backdrop-blur-sm">
              
              {/* Radial subtle gradient inside the card */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none"></div>

              {/* Icon Container */}
              <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-zinc-900/80 border border-white/10 shadow-inner">
                {/* Glow behind icon */}
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-md"></div>
                <span className="text-3xl relative z-10">🔐</span>
              </div>

              {/* Headings */}
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 tracking-tight relative z-10">
                Sample OpenID Connect Client
              </h1>
              
              {/* Divider Line */}
              <div className="h-[2px] w-12 bg-indigo-500/50 mx-auto rounded-full mb-6 relative z-10"></div>

              <p className="text-zinc-400 text-sm sm:text-base mb-10 leading-relaxed max-w-xs mx-auto relative z-10">
                Authenticate securely using DAuth with OAuth 2.0 Authorization Code Flow and PKCE.
              </p>

              {/* Action Button */}
              <div className="relative z-10">
                <Button variant="primary" size="lg" className="w-full !bg-indigo-600 hover:!bg-indigo-500 transition-all duration-300 shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] border border-indigo-400/20 text-white font-medium tracking-wide flex items-center justify-center gap-2 py-6 rounded-xl hover:shadow-[0_0_25px_-5px_rgba(79,70,229,0.6)]" onClick={handleLogin}>
                  <svg className="w-5 h-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Login with DAuth
                  <svg className="w-5 h-5 text-indigo-300 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </div>

              {/* Trust Message */}
              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-500 font-medium relative z-10">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Your identity is secure. We never share your information.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            {/* Success alert banner */}
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-4 flex items-center gap-3">
              <span className="text-emerald-500 dark:text-emerald-400 text-lg">✔</span>
              <p className="text-emerald-800 dark:text-emerald-400 text-sm font-semibold">
                OIDC Handshake Completed successfully!
              </p>
            </div>

            {/* Profile and Claims Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* UserInfo Profile */}
              <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-xs">
                <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-white/5 pb-2">
                  UserInfo Profile (/userinfo)
                </h3>
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-gray-400 dark:text-zinc-500 font-medium">Subject Identifier (sub)</dt>
                    <dd className="mt-1 font-mono text-xs text-indigo-600 dark:text-indigo-400 select-all">
                      {session.userInfo.sub}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 dark:text-zinc-500 font-medium">Full Name</dt>
                    <dd className="mt-1 text-gray-900 dark:text-zinc-100 font-semibold">
                      {session.userInfo.name || 'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 dark:text-zinc-500 font-medium">Email Address</dt>
                    <dd className="mt-1 text-gray-900 dark:text-zinc-100 font-mono">
                      {session.userInfo.email}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* ID Token Claims */}
              <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-xs">
                <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-white/5 pb-2">
                  ID Token Claims (Decoded)
                </h3>
                {idTokenClaims ? (
                  <div className="bg-slate-55 dark:bg-zinc-950/60 p-4 rounded-lg border border-gray-100 dark:border-white/5 max-h-56 overflow-y-auto">
                    <pre className="font-mono text-xs text-blue-600 dark:text-blue-400">
                      {JSON.stringify(idTokenClaims, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-gray-400 text-xs">No active ID Token detected</p>
                )}
              </div>
            </div>

            {/* Raw Token Response */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-xs">
              <h3 className="font-bold text-gray-900 dark:text-zinc-50 text-sm uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-white/5 pb-2">
                Raw Token Endpoint Response (/token)
              </h3>
              <div className="bg-gray-950 text-emerald-400 p-4 rounded-lg font-mono text-xs overflow-x-auto shadow-inner">
                <pre>{JSON.stringify(session.tokens, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
