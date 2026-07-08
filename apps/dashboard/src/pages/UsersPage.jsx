import React, { useState, useEffect } from 'react';
import { Search, Mail, Calendar, Loader2, XCircle } from 'lucide-react';
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
} from '@dauth/ui';

const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER_URL || '';

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch(`${AUTH_SERVER}/api/users`, { credentials: 'include' });

        if (!res.ok) {
          switch (res.status) {
            case 401:
              setError('Your session has expired. Please sign in again.');
              setTimeout(() => {
                window.location.href = `${AUTH_SERVER}/login`;
              }, 2000);
              return;
            case 403:
              setError('You do not have permission to access the DAuth Console.');
              return;
            case 500:
              setError('An unexpected server error occurred. Please try again later.');
              return;
            case 503:
              setError('DAuth services are temporarily unavailable.');
              return;
            default:
              setError(`Request failed with status ${res.status}. Please try again.`);
              return;
          }
        }

        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        // Network errors, CORS failures, or server unreachable
        setError(
          'Unable to connect to the DAuth server. Please check your connection or try again later.'
        );
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Filter user directory listings
  const filteredUsers = users.filter(
    (u) =>
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        <span className="ml-2 text-sm text-gray-500 dark:text-zinc-400">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
          Users
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Registered user accounts in the authentication server database.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
          <div>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>
              {users.length} registered {users.length === 1 ? 'user' : 'users'}.
            </CardDescription>
          </div>
          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-zinc-400">
              {users.length === 0
                ? 'No users have registered yet.'
                : 'No users match your search.'}
            </div>
          ) : (
            <TableContainer className="border-0 rounded-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>User ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((usr) => (
                    <TableRow key={usr.id}>
                      <TableCell className="font-semibold text-gray-900 dark:text-zinc-100">
                        {usr.name || '—'}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-zinc-300 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                          <span>{usr.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400 dark:text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{new Date(usr.createdAt).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-gray-400 dark:text-zinc-500">
                        {usr.id.substring(0, 8)}...
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
