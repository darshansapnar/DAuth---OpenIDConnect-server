import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { DAuthClient } from '@dauth/sdk';

const DAuthContext = createContext(null);

export function DAuthProvider({ children, issuer, clientId, redirectUri, scope, storage }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the SDK client instance so it persists across renders
  const client = useMemo(() => {
    return new DAuthClient({
      issuer,
      clientId,
      redirectUri,
      scope,
      storage,
    });
  }, [issuer, clientId, redirectUri, scope, storage]);

  useEffect(() => {
    // Read session cache from localStorage on mount
    const session = client.getSession();
    if (session) {
      setUser(session.userInfo);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [client]);

  const loginWithRedirect = async () => {
    setIsLoading(true);
    try {
      await client.loginWithRedirect();
    } catch (err) {
      console.error('[DAUTH-REACT] Failed to initiate login redirect:', err);
      setIsLoading(false);
      throw err;
    }
  };

  const handleRedirectCallback = async () => {
    setIsLoading(true);
    try {
      const session = await client.handleRedirectCallback();
      if (session) {
        setUser(session.userInfo);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
      return session;
    } catch (err) {
      console.error('[DAUTH-REACT] Failed to handle redirect callback:', err);
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    setIsLoading(true);
    client.logout();
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  const getAccessToken = () => {
    return client.getAccessToken();
  };

  const getIdTokenClaims = () => {
    return client.getIdTokenClaims();
  };

  const getTokens = () => {
    return client.getTokens();
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    handleRedirectCallback,
    logout,
    getAccessToken,
    getIdTokenClaims,
    getTokens,
  };

  return (
    <DAuthContext.Provider value={value}>
      {children}
    </DAuthContext.Provider>
  );
}

export function useDAuth() {
  const context = useContext(DAuthContext);
  if (!context) {
    throw new Error('[DAUTH-REACT] useDAuth must be used inside a DAuthProvider');
  }
  return context;
}

// Declarative route-guard helper component for React developers
export function ProtectedRoute({ children, fallback }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useDAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect().catch(console.error);
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  if (isLoading || !isAuthenticated) {
    return fallback || (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#05050a' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return children;
}
