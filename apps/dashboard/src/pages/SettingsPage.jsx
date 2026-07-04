import React, { useState } from 'react';
import { Save, Key, Lock, ShieldCheck } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Button,
  Alert,
  Badge,
} from '@dauth/ui';

export default function SettingsPage() {
  const [issuerUrl, setIssuerUrl] = useState('http://localhost:3001');
  const [accessTokenExpiry, setAccessTokenExpiry] = useState('3600');
  const [sessionTimeout, setSessionTimeout] = useState('86400');
  const [showAlert, setShowAlert] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
          System Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Configure public keys, issuer endpoints, and default token lifetimes.
        </p>
      </div>

      {showAlert && (
        <Alert variant="success" title="Settings Saved">
          Configurations updated successfully.
        </Alert>
      )}

      <form onSubmit={handleSave}>
        <Card className="divide-y divide-gray-200 dark:divide-white/5">
          <CardHeader>
            <CardTitle>OIDC Provider Core Configurations</CardTitle>
            <CardDescription>Adjust settings for the OIDC discovery endpoints.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <Input
              label="Issuer (iss) URL"
              value={issuerUrl}
              onChange={(e) => setIssuerUrl(e.target.value)}
              placeholder="e.g. https://auth.dauth.io"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Access Token Lifetime (seconds)"
                type="number"
                value={accessTokenExpiry}
                onChange={(e) => setAccessTokenExpiry(e.target.value)}
                required
              />
              <Input
                label="SSO Session Timeout (seconds)"
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                required
              />
            </div>
          </CardContent>

          <CardHeader className="pt-6">
            <CardTitle>Signing Credentials</CardTitle>
            <CardDescription>JWT cryptographic signature configurations.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-6">
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Active Cryptographic Keys
              </p>
              <div className="bg-gray-50 dark:bg-zinc-900/30 border border-gray-200 dark:border-white/5 rounded-xl p-4 flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-500">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-zinc-100">RS256 Private/Public Pair</p>
                    <p className="text-gray-500 dark:text-zinc-400 font-mono mt-0.5">
                      Key ID: kid_dauth_rs256_active_2026
                    </p>
                  </div>
                </div>
                <Badge variant="success" className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Active
                </Badge>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-gray-50 dark:bg-zinc-900/40 p-4 border-t border-gray-200 dark:border-white/5 flex justify-end gap-3">
            <Button variant="primary" type="submit" className="flex items-center gap-1">
              <Save className="h-4 w-4" /> Save Configurations
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
