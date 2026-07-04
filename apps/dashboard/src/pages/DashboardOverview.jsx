import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Key,
  Globe,
  Activity,
  CheckCircle2,
  Cpu,
  Database,
  ArrowUpRight,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@dauth/ui';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function DashboardOverview() {
  const stats = [
    {
      label: 'Total Users',
      value: '1,240',
      trend: '+12%',
      desc: 'from last week',
      icon: Users,
      sparkline: 'M0 20 Q15 5, 30 18 T60 8 T90 12',
      color: 'indigo',
    },
    {
      label: 'Active Clients',
      value: '12',
      trend: '+8%',
      desc: 'Authorized OIDC apps',
      icon: Key,
      sparkline: 'M0 15 Q15 25, 30 10 T60 22 T90 5',
      color: 'violet',
    },
    {
      label: 'SSO Sessions',
      value: '84',
      trend: '+24%',
      desc: 'Active browser cookies',
      icon: Globe,
      sparkline: 'M0 25 Q15 15, 30 22 T60 12 T90 18',
      color: 'emerald',
    },
    {
      label: 'Handshake Success',
      value: '99.8%',
      trend: '0%',
      desc: 'Last 10k requests',
      icon: Activity,
      sparkline: 'M0 10 Q15 10, 30 10 T60 10 T90 10',
      color: 'indigo',
    },
  ];

  const recentActivity = [
    {
      action: 'User Sign-Up',
      target: 'sarah.jones@example.com',
      time: '10m ago',
      status: 'success',
    },
    {
      action: 'Token Issued',
      target: 'Sample React App',
      time: '15m ago',
      status: 'info',
    },
    {
      action: 'Client Created',
      target: 'Billing Gateway Service',
      time: '1h ago',
      status: 'success',
    },
    {
      action: 'Keys Rotated',
      target: 'RS256 Private Key',
      time: '3h ago',
      status: 'warning',
    },
    {
      action: 'Failed Handshake',
      target: 'Unauthorized redirect_uri',
      time: '5h ago',
      status: 'danger',
    },
  ];

  const healthChecks = [
    { name: 'OIDC Discovery', path: '/.well-known/openid-configuration', latency: '4ms', status: 'Healthy' },
    { name: 'Authorization Endpoint', path: '/authorize', latency: '12ms', status: 'Healthy' },
    { name: 'Token Endpoint', path: '/token', latency: '18ms', status: 'Healthy' },
    { name: 'JWKS Endpoint', path: '/jwks', latency: '6ms', status: 'Healthy' },
    { name: 'UserInfo Endpoint', path: '/userinfo', latency: '9ms', status: 'Healthy' },
    { name: 'Database Engine', path: 'PostgreSQL (Prisma)', latency: '15ms', status: 'Healthy' },
  ];

  const chartData = [
    { name: 'Mon', auths: 240, tokens: 180 },
    { name: 'Tue', auths: 320, tokens: 210 },
    { name: 'Wed', auths: 290, tokens: 190 },
    { name: 'Thu', auths: 410, tokens: 340 },
    { name: 'Fri', auths: 380, tokens: 290 },
    { name: 'Sat', auths: 480, tokens: 410 },
    { name: 'Sun', auths: 520, tokens: 460 },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">Overview</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Real-time status updates of your self-hosted OIDC provider.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
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
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-500/20">
                      <TrendingUp className="h-3 w-3" />
                      <span>{stat.trend}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-zinc-50">{stat.value}</h3>
                      <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{stat.label}</p>
                    </div>

                    {/* Mini SVG Sparkline */}
                    <div className="w-16 h-8 text-indigo-500 dark:text-indigo-400">
                      <svg className="w-full h-full" viewBox="0 0 100 30" fill="none">
                        <path
                          d={stat.sparkline}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
              <div>
                <CardTitle>Authentication activity</CardTitle>
                <CardDescription>OIDC token issuance and requests patterns (Last 7 Days)</CardDescription>
              </div>
              <Badge variant="primary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Live Audit Feed
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAuth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorToken" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.15)" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--tooltip-bg, #18181B)',
                        borderColor: 'var(--tooltip-border, rgba(255, 255, 255, 0.08))',
                        borderRadius: '0.75rem',
                        color: '#F8FAFC',
                        fontSize: '13px',
                      }}
                    />
                    <Area type="monotone" dataKey="auths" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorAuth)" name="Authentications" />
                    <Area type="monotone" dataKey="tokens" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorToken)" name="Tokens Issued" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Grid: Activity and System Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Live authentication events captured across client configurations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flow-root px-6 pb-6">
              <ul className="-mb-8">
                {recentActivity.map((act, idx) => (
                  <li key={idx}>
                    <div className="relative pb-8">
                      {idx !== recentActivity.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-zinc-800" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-[#18181B] ${
                            act.status === 'success' ? 'bg-green-50 dark:bg-green-500/10 text-green-500' :
                            act.status === 'danger' ? 'bg-red-50 dark:bg-red-500/10 text-red-500' :
                            act.status === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' :
                            'bg-blue-50 dark:bg-blue-500/10 text-blue-500'
                          }`}>
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-900 dark:text-zinc-100 font-semibold">{act.action}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{act.target}</p>
                          </div>
                          <div className="text-right text-xs whitespace-nowrap text-gray-500 dark:text-zinc-400">
                            <time>{act.time}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* System Health status panel */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>OIDC Server endpoint health indicators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {healthChecks.map((check, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-zinc-900/30 rounded-xl border border-gray-100 dark:border-white/5 hover:border-indigo-500/20 transition-colors">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-zinc-100 truncate">{check.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 truncate mt-0.5">{check.path}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-gray-500 dark:text-zinc-400">{check.latency}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">{check.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
