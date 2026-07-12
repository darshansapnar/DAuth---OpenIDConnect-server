import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@dauth/ui';

const AUTH_SERVER_URL = import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:3001';

export default function Callback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const executionRef = useRef(false);

  const code = searchParams.get('code');
  const state = searchParams.get('state');

  useEffect(() => {
    // Avoid double-execution during React StrictMode mount cycles
    if (executionRef.current) return;
    executionRef.current = true;

    async function handleCallback() {
      // Check if server returned an error parameter
      const urlError = searchParams.get('error');
      const urlErrorDescription = searchParams.get('error_description');
      if (urlError) {
        setError(urlErrorDescription || `Authentication error: ${urlError}`);
        return;
      }

      // 1. Verify code and state parameter presence
      if (!code || !state) {
        setError('Missing required OIDC response parameters (code, state).');
        return;
      }

      // 2. Validate state against sessionStorage parameter to mitigate CSRF
      const cachedState = sessionStorage.getItem('dauth_oauth_state');
      const verifier = sessionStorage.getItem('dauth_oauth_verifier');
      if (!cachedState || cachedState !== state) {
        setError('Security validation failed: State parameter mismatch (CSRF threat detected).');
        return;
      }

      try {
        // 3. Exchange code for Access & ID tokens
        const tokenResponse = await fetch(`${AUTH_SERVER_URL}/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: `${window.location.origin}/callback`,
            client_id: 'dauth_cli_sample_client',
            client_secret: 'dauth_sec_89dfj19h0fas89d12fjlkjas',
            code_verifier: verifier || '',
          }),
        });

        if (!tokenResponse.ok) {
          const errData = await tokenResponse.json().catch(() => ({}));
          throw new Error(errData.error_description || `Token exchange returned HTTP status ${tokenResponse.status}`);
        }

        const tokens = await tokenResponse.json();

        // 4. Query UserInfo profile using the acquired Access Token
        const userInfoResponse = await fetch(`${AUTH_SERVER_URL}/userinfo`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });

        if (!userInfoResponse.ok) {
          throw new Error(`UserInfo query returned HTTP status ${userInfoResponse.status}`);
        }

        const userInfo = await userInfoResponse.json();

        // 5. Store session and clean up temporary storage
        localStorage.setItem(
          'dauth_session',
          JSON.stringify({
            tokens,
            userInfo,
          })
        );
        sessionStorage.removeItem('dauth_oauth_state');
        sessionStorage.removeItem('dauth_oauth_verifier');

        // Navigate back to the home page
        navigate('/');
      } catch (err) {
        console.error('Error during OIDC callback processing:', err);
        setError(err.message || 'An unexpected error occurred during OIDC processing.');
      }
    }

    handleCallback();
  }, [code, state, navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-500/20 rounded-xl p-8 shadow-sm">
          <span className="text-4xl block mb-4">✘</span>
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-600 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
            {error}
          </p>
          <Button variant="primary" className="w-full" onClick={() => navigate('/')}>
            Back to Sandbox Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="space-y-4">
        {/* Animated custom loader spinner ring */}
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">
          Exchanging authorization credentials with DAuth...
        </p>
      </div>
    </div>
  );
}
