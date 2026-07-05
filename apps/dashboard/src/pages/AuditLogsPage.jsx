import React, { useState, useEffect } from 'react';
import { Clock, User, Terminal, Globe, Search, Loader2, XCircle, RefreshCw } from 'lucide-react';
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

const AUTH_SERVER = 'http://localhost:3001';

/**
 * Maps audit log action names to a display status for badge coloring.
 */
const getActionStatus = (action) => {
  if (action.includes('failed') || action.includes('denied')) return 'danger';
  if (action.includes('rotated') || action.includes('revoked')) return 'warning';
  return 'success';
};

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchLogs() {
    try {
      setLoading(true);
      const res = await fetch(`${AUTH_SERVER}/api/audit-logs`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      const data = await res.json();
      setLogs(data.logs || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs based on search query and status filter
  const filteredLogs = logs.filter((log) => {
    const status = getActionStatus(log.action);
    const actor = log.user?.email || 'system';
    const target = log.client?.name || '—';

    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ipAddress || '').includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        <span className="ml-2 text-sm text-gray-500 dark:text-zinc-400">Loading audit logs...</span>
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
            Make sure the Auth Server is running and you are logged in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
            Audit Logs
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Immutable audit trail of authentication events, token exchanges, and consent decisions.
          </p>
        </div>
        <Button variant="secondary" onClick={fetchLogs} className="flex items-center gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
          <div>
            <CardTitle>Event Log</CardTitle>
            <CardDescription>{logs.length} events tracked.</CardDescription>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-md w-full">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All Events</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="danger">Errors</option>
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
              {logs.length === 0
                ? 'No audit events recorded yet. Events will appear after authentication actions.'
                : 'No audit logs match your query.'}
            </div>
          ) : (
            <TableContainer className="border-0 rounded-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const status = getActionStatus(log.action);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-gray-400 dark:text-zinc-400 font-mono">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{new Date(log.createdAt).toLocaleString()}</span>
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
                            <span>{log.user?.email || 'anonymous'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 dark:text-zinc-400">
                          {log.client?.name || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-400 dark:text-zinc-500">
                          <div className="flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5" />
                            <span>{log.ipAddress || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status}>
                            {status === 'danger' ? 'error' : status === 'warning' ? 'warning' : 'success'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
