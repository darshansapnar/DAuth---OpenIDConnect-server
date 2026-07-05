import React, { useState, useEffect } from 'react';
import { Laptop, Smartphone, Trash2, Search, Loader2, XCircle, RefreshCw } from 'lucide-react';
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

export default function SessionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revoking, setRevoking] = useState(null);

  async function fetchSessions() {
    try {
      setLoading(true);
      const res = await fetch(`${AUTH_SERVER}/api/sessions`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      setSessions(data.sessions || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (id) => {
    setRevoking(id);
    try {
      const res = await fetch(`${AUTH_SERVER}/api/sessions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to revoke session');
      // Remove from local state
      setSessions(sessions.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Revoke failed:', err);
    } finally {
      setRevoking(null);
    }
  };

  /**
   * Determines if a device string indicates a mobile user agent.
   */
  const isMobileDevice = (ua) => {
    if (!ua) return false;
    return /mobile|iphone|android|ipad/i.test(ua);
  };

  /**
   * Computes a human-readable time-until-expiry string.
   */
  const formatExpiry = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    const mins = Math.floor(diff / (1000 * 60));
    return `${mins}m remaining`;
  };

  // Filter session records
  const filteredSessions = sessions.filter(
    (s) =>
      (s.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.ipAddress || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.userAgent || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        <span className="ml-2 text-sm text-gray-500 dark:text-zinc-400">Loading sessions...</span>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
            Sessions
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Active SSO sessions tracked by the authentication server.
          </p>
        </div>
        <Button variant="secondary" onClick={fetchSessions} className="flex items-center gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
          <div>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>
              {sessions.length} active {sessions.length === 1 ? 'session' : 'sessions'}. Revoking a session logs the user out immediately.
            </CardDescription>
          </div>
          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search by email, IP, or device..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-zinc-400">
              {sessions.length === 0
                ? 'No active sessions.'
                : 'No sessions match your search.'}
            </div>
          ) : (
            <TableContainer className="border-0 rounded-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Device / Browser</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((sess) => (
                    <TableRow key={sess.id}>
                      <TableCell className="font-semibold text-gray-900 dark:text-zinc-100">
                        {sess.user?.email || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-600 dark:text-zinc-300">
                        {sess.ipAddress || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          {isMobileDevice(sess.userAgent) ? (
                            <Smartphone className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Laptop className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="truncate max-w-[200px]">
                            {sess.userAgent || 'Unknown device'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-450 dark:text-zinc-400">
                        <Badge variant={new Date(sess.expiresAt) > new Date() ? 'success' : 'danger'}>
                          {formatExpiry(sess.expiresAt)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRevoke(sess.id)}
                          disabled={revoking === sess.id}
                          className="flex items-center gap-1.5 ml-auto"
                        >
                          {revoking === sess.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          <span>Revoke</span>
                        </Button>
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
