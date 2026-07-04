import React, { useState } from 'react';
import { Shield, Clock, User, Terminal, Globe, Search } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  Button,
} from '@dauth/ui';

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const logs = [
    {
      id: '1',
      time: '2026-07-04 15:10:22',
      action: 'user.login',
      actor: 'bob.dev@dauth.io',
      target: 'Dashboard Console',
      ip: '127.0.0.1',
      status: 'success',
    },
    {
      id: '2',
      time: '2026-07-04 15:05:43',
      action: 'token.issued',
      actor: 'alice.smith@example.com',
      target: 'Sample OIDC Client',
      ip: '192.168.1.45',
      status: 'success',
    },
    {
      id: '3',
      time: '2026-07-04 14:59:12',
      action: 'client.secret_rotated',
      actor: 'bob.dev@dauth.io',
      target: 'Billing Gateway API',
      ip: '127.0.0.1',
      status: 'warning',
    },
    {
      id: '4',
      time: '2026-07-04 14:12:05',
      action: 'oauth.authorize_failed',
      actor: 'unknown',
      target: 'Sample OIDC Client',
      ip: '203.0.113.88',
      status: 'danger',
    },
    {
      id: '5',
      time: '2026-07-04 13:44:59',
      action: 'user.register',
      actor: 'alice.smith@example.com',
      target: 'Local Database',
      ip: '192.168.1.45',
      status: 'success',
    },
  ];

  // Filter logs based on search query and status filter
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
            Security Audit Logs
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Immutable audit trails monitoring account registration, logins, and OIDC token exchanges.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
          <div>
            <CardTitle>System Logs</CardTitle>
            <CardDescription>Security events tracked by the DAuth middleware layers.</CardDescription>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-md w-full">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger</option>
            </select>

            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-sm rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-zinc-400">
              No audit logs match your query.
            </div>
          ) : (
            <TableContainer className="border-0 rounded-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Target Resource</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-gray-400 dark:text-zinc-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{log.time}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-gray-950 dark:text-zinc-50 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Terminal className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 dark:text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span>{log.actor}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 dark:text-zinc-400">
                        {log.target}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-400 dark:text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5" />
                          <span>{log.ip}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.status === 'success'
                              ? 'success'
                              : log.status === 'warning'
                                ? 'warning'
                                : 'danger'
                          }
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
