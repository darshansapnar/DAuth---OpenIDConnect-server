import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDAuth } from '@dauth/react';
import { Button } from '@dauth/ui';

export default function Callback() {
  const navigate = useNavigate();
  const { handleRedirectCallback } = useDAuth();
  const [error, setError] = useState(null);
  const executionRef = useRef(false);

  useEffect(() => {
    // Avoid double-execution during React StrictMode mount cycles
    if (executionRef.current) return;
    executionRef.current = true;

    async function processCallback() {
      try {
        await handleRedirectCallback();
        navigate('/');
      } catch (err) {
        console.error('[SAMPLE-CLIENT] Error during OIDC callback:', err);
        setError(err.message || 'An unexpected error occurred during OIDC processing.');
      }
    }

    processCallback();
  }, [handleRedirectCallback, navigate]);

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
