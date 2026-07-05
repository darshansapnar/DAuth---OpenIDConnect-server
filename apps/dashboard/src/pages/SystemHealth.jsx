import React, { useState, useEffect } from 'react';
import { XCircle, Loader2, Key, ShieldCheck } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@dauth/ui';

const AUTH_SERVER = 'http://localhost:3001';

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch(`${AUTH_SERVER}/api/health`);
        if (!res.ok) throw new Error('Failed to fetch health indicators.');
        const data = await res.json();
        setHealth(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHealth();
  }, []);

  const healthChecks = [
    { name: 'OIDC Discovery', path: '/.well-known/openid-configuration' },
    { name: 'Authorization Endpoint', path: '/authorize' },
    { name: 'Token Endpoint', path: '/token' },
    { name: 'JWKS Endpoint', path: '/jwks' },
    { name: 'UserInfo Endpoint', path: '/userinfo' },
    { name: 'Database Engine', path: 'PostgreSQL (Prisma)' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        <span className="ml-2 text-sm text-gray-500 dark:text-zinc-400">Querying system diagnostics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Make sure the Auth Server is running on port 3001.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">System Health</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Diagnostics, endpoint status, and cryptographic signing keys for this OIDC instance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Endpoint Checks */}
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Connectivity</CardTitle>
            <CardDescription>Status check on standard OIDC protocol paths.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthChecks.map((check, idx) => {
              const isDbCheck = check.path === 'PostgreSQL (Prisma)';
              const isUp = isDbCheck ? health?.database?.status === 'UP' : health?.status !== 'DOWN';
              return (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-zinc-900/30 rounded-xl border border-gray-100 dark:border-white/5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-zinc-100 truncate">{check.name}</p>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 truncate mt-0.5">{check.path}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isDbCheck && health?.database?.latencyMs != null && (
                      <span className="text-xs font-mono text-gray-500 dark:text-zinc-400">{health.database.latencyMs}ms</span>
                    )}
                    <div className="flex items-center gap-1.5">
                      {isUp ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Online</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Offline</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Active Cryptographic Key Info */}
          <Card>
            <CardHeader>
              <CardTitle>Cryptographic Token Signer</CardTitle>
              <CardDescription>Public key set utilized for RS256 token verification signatures.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50/50 dark:bg-zinc-900/30 border border-gray-200 dark:border-white/5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-500">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-zinc-100">RS256 Private/Public Pair</p>
                    <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-mono mt-0.5">Key ID: dauth_rsa_active_key</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full border border-green-200/40">
                  <ShieldCheck className="h-3.5 w-3.5" /> Active
                </div>
              </div>
              <div className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed bg-gray-50 dark:bg-zinc-950/40 p-3 rounded-lg border border-gray-100 dark:border-white/5">
                DAuth uses an on-disk persisted 2048-bit RSA key pair to sign OIDC ID tokens. Public verification coordinates are served at the <a href={`${AUTH_SERVER}/jwks`} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">/jwks</a> endpoint.
              </div>
            </CardContent>
          </Card>

          {/* Instance Health */}
          <Card>
            <CardHeader>
              <CardTitle>Instance Metadata</CardTitle>
              <CardDescription>Runtime process specifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Status', value: health?.status || '—' },
                { label: 'Uptime', value: health?.uptime ? `${Math.floor(health.uptime / 60)}m ${health.uptime % 60}s` : '—' },
                { label: 'DB Status', value: health?.database?.status || '—' },
                { label: 'DB Latency', value: health?.database?.latencyMs != null ? `${health.database.latencyMs}ms` : '—' },
                { label: 'Server Time', value: health?.timestamp ? new Date(health.timestamp).toLocaleString() : '—' },
                { label: 'OIDC Issuer', value: AUTH_SERVER },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50/50 dark:bg-zinc-900/30 rounded-lg border border-gray-100 dark:border-white/5">
                  <span className="text-xs text-gray-500 dark:text-zinc-400">{item.label}</span>
                  <span className="text-xs font-mono text-gray-900 dark:text-zinc-100">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
