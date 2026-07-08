import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(undefined);

const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER_URL || '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // 'network' | 'forbidden' | 'unauthorized'

  const checkAuth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${AUTH_SERVER}/api/auth/me`, { credentials: 'include' });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError('unauthorized');
          // Immediately redirect unauthenticated user to login
          window.location.href = `${AUTH_SERVER}/login`;
          return;
        }
        if (res.status === 403) {
          setError('forbidden');
          setLoading(false);
          return;
        }
        throw new Error('Server error during authentication check');
      }

      const data = await res.json();
      const currentUser = data.user;

      if (!currentUser) {
        setError('unauthorized');
        window.location.href = `${AUTH_SERVER}/login`;
        return;
      }

      // Role check: Only admin@dauth.io is permitted access to the Admin Dashboard Console
      if (currentUser.email !== 'admin@dauth.io') {
        setError('forbidden');
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setError(null);
    } catch (err) {
      console.error('[AUTH_GUARD] Verification request failed:', err);
      setError('network');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${AUTH_SERVER}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('[AUTH_GUARD] Logout API request failed:', err);
    } finally {
      setUser(null);
      setError('unauthorized');
      window.location.href = `${AUTH_SERVER}/login`;
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ user, loading, error, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
