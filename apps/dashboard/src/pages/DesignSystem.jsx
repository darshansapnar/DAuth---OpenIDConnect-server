import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Settings,
  User,
  Shield,
  Trash2,
  Lock,
  ChevronDown,
  Info,
  CheckCircle,
  AlertTriangle,
  Key,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Modal,
  Alert,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Dropdown,
  DropdownItem,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarLink,
  SidebarFooter,
  Navbar,
  NavbarBrand,
  NavbarContent,
  Toast,
  EmptyState,
  Skeleton,
  SkeletonText,
  SkeletonCard,
} from '@dauth/ui';

export default function DesignSystem() {
  // Component interactive states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  const triggerToast = (message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setIsToastOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 flex flex-col">
      {/* 1. Navbar Section */}
      <Navbar>
        <NavbarBrand className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-indigo-500" />
          <Link to="/" className="hover:opacity-95 text-gray-900 dark:text-zinc-50">
            DAuth Design System
          </Link>
        </NavbarBrand>
        <NavbarContent>
          <Link to="/" className="text-sm font-medium text-gray-650 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200">
            Back to Dashboard
          </Link>
        </NavbarContent>
      </Navbar>

      <div className="flex flex-1">
        {/* 2. Sidebar Section */}
        <Sidebar className="hidden md:flex">
          <div>
            <SidebarHeader>
              <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                Navigation
              </span>
            </SidebarHeader>
            <SidebarContent>
              <SidebarLink active icon={<FileText className="h-4.5 w-4.5" />}>
                Overview
              </SidebarLink>
              <SidebarLink icon={<Settings className="h-4.5 w-4.5" />}>Config</SidebarLink>
              <SidebarLink icon={<User className="h-4.5 w-4.5" />}>Users</SidebarLink>
            </SidebarContent>
          </div>
          <SidebarFooter>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                JD
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 truncate">John Doe</p>
                <p className="text-[10px] text-gray-500 dark:text-zinc-450 truncate">admin@dauth.io</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <main className="flex-1 max-w-5xl mx-auto p-8 space-y-12 bg-slate-50 dark:bg-zinc-950">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-50 mb-2">
              DAuth Design System
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 leading-normal max-w-xl">
              This sandbox displays all reusable UI components compiled under the DAuth design
              guidelines. All items are interactive and aligned with standard SaaS user interfaces.
            </p>
          </div>

          <hr className="border-gray-200 dark:border-white/5" />

          {/* 3. Buttons & Inputs Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>Styled variants and disabled states.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="danger">Danger Action</Button>
                <Button variant="primary" isLoading>
                  Loading
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inputs & Forms</CardTitle>
                <CardDescription>Keyboard navigable inputs with feedback handlers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label="Email address" placeholder="john.doe@example.com" />
                <Input
                  label="Password"
                  type="password"
                  error="Password must be at least 8 characters long."
                />
              </CardContent>
            </Card>
          </section>

          {/* 4. Interactive Components Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Modals & Triggers</CardTitle>
                <CardDescription>Prompts focusing accessible overlays.</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                  Launch Test Modal
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Toasts & Dropdowns</CardTitle>
                <CardDescription>Interactive menus and notifications.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                {/* Dropdown test */}
                <Dropdown
                  isOpen={isDropdownOpen}
                  onClose={() => setIsDropdownOpen(false)}
                  trigger={
                    <Button variant="secondary" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-1.5">
                      <span>Options Menu</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  }
                >
                  <DropdownItem onClick={() => triggerToast('Client details loaded', 'info')}>
                    View Details
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => triggerToast('Client secrets refreshed', 'success')}
                  >
                    Rotate Secrets
                  </DropdownItem>
                  <div className="border-t border-gray-150 dark:border-white/5 my-1" />
                  <DropdownItem
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                    onClick={() => triggerToast('Client deletion cancelled', 'danger')}
                  >
                    Delete Client
                  </DropdownItem>
                </Dropdown>

                {/* Toast triggers */}
                <Button
                  variant="secondary"
                  onClick={() => triggerToast('Operation processed successfully!', 'success')}
                >
                  Trigger Success Toast
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* 5. Alerts & Badges Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Alerts & Badges</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Alert
                  variant="info"
                  title="System Notice"
                  onClose={() => triggerToast('Info closed', 'info')}
                >
                  New client endpoints are registered on https://localhost:3001.
                </Alert>
                <Alert variant="success" title="Verification Successful">
                  OAuth client has completed handshakes.
                </Alert>
                <Alert variant="danger" title="Validation Failed">
                  Invalid redirect uri domain signature provided.
                </Alert>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Status Badges</CardTitle>
                  <CardDescription>Color-coded state indicators.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Badge variant="default">Inactive</Badge>
                  <Badge variant="primary">Pending</Badge>
                  <Badge variant="success">Active</Badge>
                  <Badge variant="warning">Suspended</Badge>
                  <Badge variant="danger">Failed</Badge>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 6. Tables Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Tables</h2>
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Client ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold text-gray-900 dark:text-zinc-100">Sample React App</TableCell>
                    <TableCell className="font-mono text-xs">dauth_cli_839fj20a</TableCell>
                    <TableCell>
                      <Badge variant="success">Active</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="secondary" size="sm">
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-gray-900 dark:text-zinc-100">
                      Localhost Test Client
                    </TableCell>
                    <TableCell className="font-mono text-xs">dauth_cli_028fj9a4</TableCell>
                    <TableCell>
                      <Badge variant="primary">Pending</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="secondary" size="sm">
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </section>

          {/* 7. Empty State & Skeletons Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-50 mb-4">Empty State</h2>
              <EmptyState
                icon={<Key className="h-8 w-8 text-gray-400 dark:text-zinc-550" />}
                title="No OIDC clients yet"
                description="Create a client credential profile to start delegating authorization tokens."
                action={<Button variant="primary">Register Client</Button>}
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-50 mb-4">Loading Skeletons</h2>
              <div className="space-y-6">
                <SkeletonCard />
                <div className="p-4 bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/5 rounded-xl space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <SkeletonText lines={3} />
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Modal Dialog portal rendering */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Delete OAuth Client Profile?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setIsModalOpen(false);
                triggerToast('Client deleted successfully', 'danger');
              }}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete this OIDC client? This operation is permanent and will
          revoke all active access tokens.
        </p>
      </Modal>

      {/* Toast popup trigger */}
      <Toast
        isOpen={isToastOpen}
        onClose={() => setIsToastOpen(false)}
        message={toastMessage}
        variant={toastVariant}
      />
    </div>
  );
}
