import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Key,
  RefreshCw,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@dauth/ui';

const AUTH_SERVER = 'http://localhost:3001';

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsRes, healthRes] = await Promise.all([
          fetch(`${AUTH_SERVER}/api/stats/overview`),
          fetch(`${AUTH_SERVER}/api/health`),
        ]);

        if (!statsRes.ok) throw new Error('Failed to fetch stats');
        if (!healthRes.ok) throw new Error('Failed to fetch health');

        const statsData = await statsRes.json();
        const healthData = await healthRes.json();

        setStats(statsData);
        setHealth(healthData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const statCards = stats
    ? [
        {
          label: 'Total Users',
          value: stats.users,
          icon: Users,
          color: 'indigo',
        },
        {
          label: 'OAuth Clients',
          value: stats.clients,
          icon: Key,
          color: 'violet',
        },
        {
          label: 'Refresh Tokens',
          value: stats.refreshTokens,
          icon: RefreshCw,
          color: 'emerald',
        },
        {
          label: 'Auth Codes Issued',
          value: stats.authorizationCodes,
          icon: Activity,
          color: 'amber',
        },
      ]
    : [];

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
        <span className="ml-2 text-sm text-gray-500 dark:text-zinc-400">Loading dashboard...</span>
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
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">Overview</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Live metrics from your self-hosted OIDC provider.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <Card className="relative overflow-hidden group">
                {/* Accent Gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-80" />
                
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-white/5">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-zinc-50">{stat.value}</h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Server Health + System Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health Panel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>OIDC server endpoint health indicators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {healthChecks.map((check, idx) => {
                const isDbCheck = check.path === 'PostgreSQL (Prisma)';
                const isUp = isDbCheck ? health?.database?.status === 'UP' : health?.status !== 'DOWN';
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-zinc-900/30 rounded-xl border border-gray-100 dark:border-white/5 hover:border-indigo-500/20 transition-colors">
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
                            <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Healthy</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-500" />
                            <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Down</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Server Info Panel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Server Information</CardTitle>
              <CardDescription>Runtime details for the DAuth Auth Server instance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Status', value: health?.status || '—' },
                { label: 'Uptime', value: health?.uptime ? `${Math.floor(health.uptime / 60)}m ${health.uptime % 60}s` : '—' },
                { label: 'Database', value: health?.database?.status || '—' },
                { label: 'DB Latency', value: health?.database?.latencyMs != null ? `${health.database.latencyMs}ms` : '—' },
                { label: 'Server Time', value: health?.timestamp ? new Date(health.timestamp).toLocaleString() : '—' },
                { label: 'Issuer', value: AUTH_SERVER },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-zinc-900/30 rounded-xl border border-gray-100 dark:border-white/5">
                  <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">{item.label}</span>
                  <span className="text-xs font-mono text-gray-900 dark:text-zinc-100">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
