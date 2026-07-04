import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, UserCheck, UserMinus, Calendar, Mail, ShieldAlert } from 'lucide-react';
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

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([
    {
      id: '1',
      name: 'Alice Smith',
      email: 'alice.smith@example.com',
      role: 'End User',
      joined: 'Jul 04, 2026',
      status: 'active',
    },
    {
      id: '2',
      name: 'Developer Bob',
      email: 'bob.dev@dauth.io',
      role: 'Administrator',
      joined: 'Jul 03, 2026',
      status: 'active',
    },
    {
      id: '3',
      name: 'Sarah Connor',
      email: 'sarah@skynet.com',
      role: 'End User',
      joined: 'Jun 28, 2026',
      status: 'suspended',
    },
  ]);

  const toggleBlock = (userId) => {
    setUsers(
      users.map((u) => {
        if (u.id === userId) {
          return { ...u, status: u.status === 'active' ? 'suspended' : 'active' };
        }
        return u;
      })
    );
  };

  // Filter user directory listings
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
          Users Directory
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Monitor user accounts, roles authorization, and account states.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
          <div>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>
              Registered user profiles inside the authentication server database.
            </CardDescription>
          </div>
          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search user profile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-zinc-400">
              No user profiles match your query.
            </div>
          ) : (
            <TableContainer className="border-0 rounded-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Email Address</TableHead>
                    <TableHead>System Role</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((usr) => (
                    <TableRow key={usr.id}>
                      <TableCell className="font-semibold text-gray-900 dark:text-zinc-100">
                        {usr.name}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-zinc-300 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                          <span>{usr.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={usr.role === 'Administrator' ? 'primary' : 'default'} className="text-[10px] px-2">
                          {usr.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400 dark:text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{usr.joined}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={usr.status === 'active' ? 'success' : 'danger'}>
                          {usr.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleBlock(usr.id)}
                          className="flex items-center gap-1 ml-auto"
                        >
                          {usr.status === 'active' ? (
                            <>
                              <UserMinus className="h-3.5 w-3.5 text-red-500" />
                              <span>Suspend</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3.5 w-3.5 text-green-500" />
                              <span>Activate</span>
                            </>
                          )}
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
