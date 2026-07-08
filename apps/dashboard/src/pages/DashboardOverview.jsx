import React, { useState, useEffect } from 'react';
import { Users, Key, RefreshCw, Activity, Loader2, XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
} from '@dauth/ui';

const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER_URL || '';

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${AUTH_SERVER}/api/stats/overview`);
        if (!res.ok) throw new Error('Failed to fetch stats overview.');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        <span className="ml-2 text-sm text-gray-500 dark:text-zinc-400">Loading metrics...</span>
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

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.users || 0,
      icon: Users,
    },
    {
      label: 'OAuth Clients',
      value: stats?.clients || 0,
      icon: Key,
    },
    {
      label: 'Active Refresh Tokens',
      value: stats?.refreshTokens || 0,
      icon: RefreshCw,
    },
    {
      label: 'Auth Codes Issued',
      value: stats?.authorizationCodes || 0,
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Live statistics from your self-hosted OIDC Identity Provider instance.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
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
          );
        })}
      </div>
    </div>
  );
}
