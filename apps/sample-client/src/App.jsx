import React, { useState } from 'react';
import { Button } from '@dauth/ui';

export default function App() {
  const [tokenInfo, setTokenInfo] = useState(null);

  const handleMockLogin = () => {
    // Scaffold login state for subsequent OIDC integration
    setTokenInfo({
      access_token: 'mock_access_token_xyz',
      id_token: 'mock_id_token_abc',
      expires_in: 3600,
      scope: 'openid profile email',
    });
  };

  const handleLogout = () => {
    setTokenInfo(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-bold text-gray-900">🧪 Sample OIDC Client Application</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto py-12 px-4 w-full">
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Integrating with DAuth</h1>
          <p className="text-gray-600 mb-6 text-sm">
            This client application is configured to verify OIDC flow processes, such as
            Authorization Code Grant, PKCE, token exchanges, and profile fetching.
          </p>

          {!tokenInfo ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
              <p className="text-gray-500 mb-4 text-sm">No active OIDC session found.</p>
              <Button variant="primary" onClick={handleMockLogin}>
                Test Mock Login Flow
              </Button>
            </div>
          ) : (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <p className="text-green-800 text-sm font-semibold">Logged in successfully!</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm">Token Response Payloads</h3>
                <div className="bg-gray-950 text-emerald-400 p-4 rounded-md font-mono text-xs overflow-x-auto shadow-inner">
                  {JSON.stringify(tokenInfo, null, 2)}
                </div>

                <div className="flex gap-4 pt-2">
                  <Button variant="secondary" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
