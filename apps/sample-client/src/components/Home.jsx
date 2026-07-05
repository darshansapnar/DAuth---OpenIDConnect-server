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
  };

  const idTokenClaims = session?.tokens?.id_token ? decodeJwt(session.tokens.id_token) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col font-sans text-gray-900 dark:text-zinc-50 transition-colors duration-200">
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-white/5 h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
          <span className="font-bold text-gray-900 dark:text-zinc-50 tracking-tight">
            🧪 Sample OIDC Client Application
          </span>
          {session && (
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 w-full">
        {!session ? (
          <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-8 shadow-sm text-center">
            <span className="text-4xl block mb-4">🔐</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-50 mb-2">
              DAuth Integration Sandbox
            </h1>
            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
              Verify OAuth 2.0 Authorization Code flow and token claims mapping using DAuth.
            </p>
            <Button variant="primary" size="lg" className="w-full" onClick={handleLogin}>
              Login with DAuth
            </Button>
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
