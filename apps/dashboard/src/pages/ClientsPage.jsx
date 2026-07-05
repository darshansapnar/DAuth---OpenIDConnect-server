import React, { useState, useEffect } from 'react';
import {
  Plus,
  Copy,
  Edit2,
  Trash2,
  RefreshCw,
  MoreVertical,
  Search,
} from 'lucide-react';
import {
  Button,
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
  Modal,
  Input,
  Alert,
  Toast,
  Badge,
  Dropdown,
  DropdownItem,
} from '@dauth/ui';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Modal control states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSecretOpen, setIsSecretOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [redirectUris, setRedirectUris] = useState('');
  const [allowedScopes, setAllowedScopes] = useState('openid profile email');
  const [selectedClient, setSelectedClient] = useState(null);

  // One-time credential visibility
  const [revealedSecret, setRevealedSecret] = useState('');
  const [revealedClientId, setRevealedClientId] = useState('');

  // Toast states
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  const triggerToast = (msg, variant = 'success') => {
    setToastMessage(msg);
    setToastVariant(variant);
    setToastOpen(true);
  };

  const forceRefresh = () => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  // Fetch clients from the API
  useEffect(() => {
    let active = true;

    async function loadClients() {
      try {
        const res = await fetch('/api/clients');
        const data = await res.json();
        if (active) {
          if (res.ok) {
            setClients(data.clients || []);
          } else {
            triggerToast(data.message || 'Failed to fetch clients', 'danger');
          }
        }
      } catch {
        if (active) {
          triggerToast('Network error: Auth server offline', 'danger');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadClients();

    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  // Handle Client Creation
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !redirectUris) return;

    try {
      const splitUris = redirectUris.split(',').map((u) => u.trim());
      const splitScopes = allowedScopes.split(' ').map((s) => s.trim());

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, redirectUris: splitUris, allowedScopes: splitScopes }),
      });
      const data = await res.json();

      if (res.ok) {
        setRevealedSecret(data.client.clientSecret);
        setRevealedClientId(data.client.id);
        setIsSecretOpen(true);

        setIsCreateOpen(false);
        setName('');
        setRedirectUris('');
        forceRefresh();
        triggerToast('OAuth Client created successfully.', 'success');
      } else {
        triggerToast(data.message || 'Validation failed', 'danger');
      }
    } catch {
      triggerToast('Failed to connect to backend', 'danger');
    }
  };

  // Open Edit Modal
  const openEdit = (cli) => {
    setSelectedClient(cli);
    setName(cli.name);
    setRedirectUris(cli.redirectUris.join(', '));
    setAllowedScopes(cli.allowedScopes.join(' '));
    setIsEditOpen(true);
  };

  // Handle Client Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedClient) return;

    try {
      const splitUris = redirectUris.split(',').map((u) => u.trim());
      const splitScopes = allowedScopes.split(' ').map((s) => s.trim());

      const res = await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, redirectUris: splitUris, allowedScopes: splitScopes }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsEditOpen(false);
        setSelectedClient(null);
        setName('');
        setRedirectUris('');
        forceRefresh();
        triggerToast('OAuth Client updated successfully.', 'success');
      } else {
        triggerToast(data.message || 'Update failed', 'danger');
      }
    } catch {
      triggerToast('Failed to connect to backend', 'danger');
    }
  };

  // Rotate Client Secret
  const handleRotateSecret = async (clientId) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/secret`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok) {
        setRevealedSecret(data.clientSecret);
        setRevealedClientId(data.clientId);
        setIsSecretOpen(true);
        triggerToast('Client secret rotated successfully.', 'success');
      } else {
        triggerToast(data.message || 'Rotation failed', 'danger');
      }
    } catch {
      triggerToast('Failed to connect to backend', 'danger');
    }
  };

  // Delete Client Profile
  const handleDelete = async (clientId) => {
    if (!confirm('Are you sure you want to delete this OIDC client? This operation is permanent.'))
      return;

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        forceRefresh();
        triggerToast('OAuth Client deleted successfully.', 'success');
      } else {
        const data = await res.json();
        triggerToast(data.message || 'Delete failed', 'danger');
      }
    } catch {
      triggerToast('Failed to connect to backend', 'danger');
    }
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(
    (cli) =>
      cli.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cli.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
            OAuth & OIDC Clients
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Configure client configurations, scope access, and callback redirect locations.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Register Client
        </Button>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
          <div>
            <CardTitle>Registered Client Profiles</CardTitle>
            <CardDescription>
              OIDC applications authorized to authenticate user identities.
            </CardDescription>
          </div>
          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-zinc-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
              Loading client registry...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-zinc-400">
              No client profiles match your query.
            </div>
          ) : (
            <TableContainer className="border-0 rounded-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Client ID</TableHead>
                    <TableHead>Redirect URIs</TableHead>
                    <TableHead>Allowed Scopes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((cli) => (
                    <TableRow key={cli.id}>
                      <TableCell className="font-semibold text-gray-900 dark:text-zinc-100">
                        {cli.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-500 dark:text-zinc-400">
                        {cli.id}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 dark:text-zinc-300 max-w-xs truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{cli.redirectUris.join(', ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {cli.allowedScopes.map((scope) => (
                            <Badge key={scope} variant="default" className="text-[10px] px-2 py-0">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dropdown
                          isOpen={activeDropdownId === cli.id}
                          onClose={() => setActiveDropdownId(null)}
                          trigger={
                            <button
                              onClick={() => setActiveDropdownId(activeDropdownId === cli.id ? null : cli.id)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          }
                        >
                          <DropdownItem
                            onClick={() => {
                              openEdit(cli);
                              setActiveDropdownId(null);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5 text-gray-400" />
                            <span>Edit Client</span>
                          </DropdownItem>
                          <DropdownItem
                            onClick={() => {
                              handleRotateSecret(cli.id);
                              setActiveDropdownId(null);
                            }}
                          >
                            <RefreshCw className="h-3.5 w-3.5 text-gray-400" />
                            <span>Rotate Secret</span>
                          </DropdownItem>
                          <div className="border-t border-gray-150 dark:border-white/5 my-1" />
                          <DropdownItem
                            onClick={() => {
                              handleDelete(cli.id);
                              setActiveDropdownId(null);
                            }}
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete Client</span>
                          </DropdownItem>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 1. Register Client Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register OIDC Client Profile"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Create Client
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Client Name"
            placeholder="e.g. Marketing Dashboard App"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Allowed Redirect URIs (comma separated)"
            placeholder="e.g. http://localhost:5174/callback"
            value={redirectUris}
            onChange={(e) => setRedirectUris(e.target.value)}
            required
          />
          <Input
            label="Allowed Scopes (space separated)"
            value={allowedScopes}
            onChange={(e) => setAllowedScopes(e.target.value)}
            required
          />
        </form>
      </Modal>

      {/* 2. Edit Client Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Client Configuration"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdate}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Client Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Allowed Redirect URIs (comma separated)"
            value={redirectUris}
            onChange={(e) => setRedirectUris(e.target.value)}
            required
          />
          <Input
            label="Allowed Scopes (space separated)"
            value={allowedScopes}
            onChange={(e) => setAllowedScopes(e.target.value)}
            required
          />
        </form>
      </Modal>

      {/* 3. One-Time Credentials Modal */}
      <Modal
        isOpen={isSecretOpen}
        onClose={() => setIsSecretOpen(false)}
        title="One-Time Client Credentials"
        footer={
          <Button variant="primary" onClick={() => setIsSecretOpen(false)}>
            I have copied the secret
          </Button>
        }
      >
        <div className="space-y-4">
          <Alert variant="warning" title="Save this secret safely!">
            For security, the client secret is hashed using bcrypt. We only show the plain secret
            **once**. You cannot view it again later.
          </Alert>

          <Input label="Client ID" value={revealedClientId} readOnly />
          
          <div className="relative">
            <Input label="Client Secret" value={revealedSecret} readOnly />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(revealedSecret);
                triggerToast('Client Secret copied to clipboard.', 'success');
              }}
              className="absolute right-2 top-8 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg hover:bg-gray-150 dark:hover:bg-zinc-800 transition-colors"
              title="Copy Client Secret"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Modal>

      {/* Operations Toasts */}
      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        variant={toastVariant}
      />
    </div>
  );
}
