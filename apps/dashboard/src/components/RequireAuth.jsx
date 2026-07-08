import React from 'react';
import { Loader2, ShieldAlert, WifiOff } from 'lucide-react';
import { Button } from '@dauth/ui';
import { useAuth } from '../contexts/AuthContext.jsx';

const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER_URL || '';

export default function RequireAuth({ children }) {
  const { user, loading, error, checkAuth } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto" />
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Network/Server connection failure
  if (error === 'network') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6 transition-colors duration-200">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5 rounded-2xl p-8 shadow-lg text-center space-y-6">
          <div className="h-16 w-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <WifiOff className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">Connection Failed</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Unable to connect to the DAuth server. Please check your connection or try again later.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button variant="primary" onClick={checkAuth} className="w-full sm:w-auto">
              Retry Connection
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = `${AUTH_SERVER}/login`;
              }}
              className="w-full sm:w-auto"
            >
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Unpermitted / non-admin user
  if (error === 'forbidden') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6 transition-colors duration-200">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5 rounded-2xl p-8 shadow-lg text-center space-y-6">
          <div className="h-16 w-16 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">Access Denied</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              You do not have permission to access the DAuth Console. Administrative rights are required.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = `${AUTH_SERVER}/login`;
              }}
              className="w-full"
            >
              Sign in with another account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return children;
}
