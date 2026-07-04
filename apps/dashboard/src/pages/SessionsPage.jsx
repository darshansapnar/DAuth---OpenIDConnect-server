import React, { useState } from 'react';
import { Laptop, Smartphone, Key, AlertTriangle, ShieldAlert, Trash2, Search } from 'lucide-react';
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

export default function SessionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sessions, setSessions] = useState([
    {
      id: 'sess_1',
      email: 'alice.smith@example.com',
      type: 'OIDC SSO Session',
      ip: '192.168.1.45',
      device: 'Chrome on macOS',
      expires: '23 hours from now',
    },
    {
      id: 'sess_2',
      email: 'bob.dev@dauth.io',
      type: 'Dashboard Session',
      ip: '127.0.0.1',
      device: 'Firefox on Windows',
      expires: '5 hours from now',
    },
    {
      id: 'sess_3',
      email: 'alice.smith@example.com',
      type: 'OIDC SSO Session',
      ip: '203.0.113.19',
      device: 'Safari on iPhone',
      expires: '28 days from now',
    },
  ]);

  const handleRevoke = (id) => {
    setSessions(sessions.filter((s) => s.id !== id));
  };

  // Filter session records
  const filteredSessions = sessions.filter(
    (s) =>
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.device.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
          Active Sessions
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Monitor browser SSO sessions and active administrative console connections.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
          <div>
            <CardTitle>Browser SSO & Console Sessions</CardTitle>
            <CardDescription>
              Revoking a session will immediately log out the user from subsequent OIDC client requests.
            </CardDescription>
          </div>
          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search active session..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-zinc-400">
              No active sessions match your query.
            </div>
          ) : (
            <TableContainer className="border-0 rounded-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Account</TableHead>
                    <TableHead>Session Type</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Device / Browser</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((sess) => (
                    <TableRow key={sess.id}>
                      <TableCell className="font-semibold text-gray-900 dark:text-zinc-100">
                        {sess.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sess.type.includes('SSO') ? 'primary' : 'default'} className="text-[10px] px-2">
                          {sess.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-600 dark:text-zinc-300">
                        {sess.ip}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          {sess.device.includes('macOS') || sess.device.includes('Windows') ? (
                            <Laptop className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Smartphone className="h-4 w-4 text-gray-400" />
                          )}
                          <span>{sess.device}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-450 dark:text-zinc-400">
                        {sess.expires}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRevoke(sess.id)}
                          className="flex items-center gap-1.5 ml-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
