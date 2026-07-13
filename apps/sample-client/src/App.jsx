import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DAuthProvider } from '@dauth/react';
import Home from './components/Home.jsx';
import Callback from './components/Callback.jsx';

const AUTH_SERVER_URL = import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:3001';

export default function App() {
  return (
    <DAuthProvider
      issuer={AUTH_SERVER_URL}
      clientId="dauth_cli_sample_client"
      redirectUri={`${window.location.origin}/callback`}
      scope="openid profile email"
    >
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/callback" element={<Callback />} />
        </Routes>
      </BrowserRouter>
    </DAuthProvider>
  );
}
