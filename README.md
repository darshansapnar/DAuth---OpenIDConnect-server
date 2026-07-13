# 🔐 DAuth - Self-Hosted OpenID Connect Identity Provider

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**DAuth** is a production-inspired, self-hosted **OpenID Connect (OIDC) Identity Provider** built from the ground up with a modular, layered architecture. It serves as a secure authentication blueprint supporting standard OIDC flows, Proof Key for Code Exchange (PKCE), dynamic discovery, and built-in client SDKs.

---

## ✨ Features

* **Authorization Code Flow + PKCE (RFC 7636):** Secure redirect-based handshake with automatic SHA-256 verifiers, tailored for public and confidential clients.
* **OIDC Client Types:** Distinguishes between `PUBLIC` clients (SPAs/Mobile apps - secret-free PKCE-enforced) and `CONFIDENTIAL` clients (Server-side backends - requiring client secret verification).
* **Asymmetric RS256 JWTs:** ID Tokens are signed using RSA key pairs, with public keys exposed via JWKS.
* **Automatic Token Rotation:** Full support for OAuth 2.0 refresh tokens, with automated token refreshing in client libraries before access token expiry.
* **OIDC Discovery & JWKS:** Built-in dynamic configuration mapping (`/.well-known/openid-configuration`) and signature validation key lists (`/jwks`).
* **Google Identity Federation:** Integrated Google social login linking directly out of the box.
* **Security Hardening:** Single-use authorization codes, Double-Submit CSRF cookies, dynamic CORS origins checking, and replay-attack protection (revokes all refresh tokens on code reuse).

---

## 🏗 System Architecture

DAuth separates HTTP layers from database interactions and business logic across clean workspaces:

```mermaid
graph TD
    Client[Relying Client Application] -->|1. OIDC Requests| Auth[DAuth Auth Server]
    Auth -->|2. Route Handler| Routes
    Routes --> Controllers
    Controllers --> Services
    Services --> Repositories
    Repositories --> DB[(Neon PostgreSQL)]
    
    Auth -.->|Federated Login| Google[Google IDP]
    Admin[Admin Dashboard] -->|Manage Users & Clients| Auth
```

### 🗂 Workspace Packages
* **`apps/auth-server`**: Express.js backend exposing RESTful OIDC routes and administrative controls.
* **`apps/dashboard`**: React + Vite administrator management console (seeding and registering OAuth clients).
* **`apps/sample-client`**: React + Vite playground client demonstrating end-to-end integration.
* **`packages/sdk`**: Reusable, framework-agnostic Vanilla JS client SDK.
* **`packages/react`**: Reusable React Context and hook library wrapper.
* **`packages/ui`** & **`packages/shared`**: Reusable design blocks and crypto helpers.

---

## 🚀 Installation & Local Development

### 1. Clone & Install
```bash
git clone https://github.com/darshansapnar/DAuth---OpenIDConnect-server.git
cd DAuth---OpenIDConnect-server
npm install
```

### 2. Configure Environment
Create a `.env` file at the root:
```env
DATABASE_URL="postgresql://user:pass@host/neondb?sslmode=require"
SESSION_SECRET="your-express-session-cookie-secret"
GOOGLE_CLIENT_ID="optional-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="optional-google-oauth-client-secret"
```

### 3. Setup Database (Prisma)
Sync schemas and seed default administrative credentials (`admin@dauth.io` / `AdminPass123`):
```bash
npx prisma db push --schema=apps/auth-server/prisma/schema.prisma
node apps/auth-server/prisma/seed.js
```

### 4. Start Local Environment
```bash
npm run dev
```
* **Auth Server**: `http://localhost:3001`
* **Admin Dashboard**: `http://localhost:5173/dashboard/`
* **Sample Client**: `http://localhost:5174/`

---

## 📋 Registering OAuth Clients
1. Log in to the **Admin Dashboard** (`http://localhost:5173/dashboard/`).
2. Navigate to **Clients** -> **Create Client**.
3. Choose the appropriate Client Type:
   * **`PUBLIC`**: Select for Single-Page React/Vite/Vue apps or Mobile applications. Secrets are disallowed, and PKCE is enforced.
   * **`CONFIDENTIAL`**: Select for Node.js, Python, or Go backend servers. Requires presenting the client secret.
4. Input valid **Redirect URIs** (e.g. `http://localhost:5174/callback`) and allow target scopes.

---

## 📦 SDK Integration

### 1. Vanilla JavaScript SDK (`@dauth/sdk`)
Install or link `@dauth/sdk` in your application.

```javascript
import { DAuthClient } from '@dauth/sdk';

const dauth = new DAuthClient({
  issuer: "http://localhost:3001",
  clientId: "dauth_cli_sample_client",
  redirectUri: "http://localhost:5174/callback",
  scope: "openid profile email",
  // storage: window.sessionStorage // Optional custom storage (defaults to localStorage)
});

// Triggers login and redirects to DAuth Authorization Server
await dauth.loginWithRedirect();

// Handles callback code swap (run on your callback/redirect URI page)
const session = await dauth.handleRedirectCallback();
console.log("Logged in user:", session.userInfo);

// Retrieve active tokens & profiles
const token = await dauth.getAccessToken(); // Automatically refreshes token if expired!
const idClaims = dauth.getIdTokenClaims(); // Decoded JWT profile details
const isAuthed = dauth.isAuthenticated();

// Logout
await dauth.logout();
```

### 2. React SDK (`@dauth/react`)
Wrap your application in `DAuthProvider` to expose hooks and route guards.

#### Wrap Router:
```jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DAuthProvider } from '@dauth/react';
import Dashboard from './Dashboard';
import Callback from './Callback';

export default function App() {
  return (
    <DAuthProvider
      issuer="http://localhost:3001"
      clientId="dauth_cli_sample_client"
      redirectUri={`${window.location.origin}/callback`}
      scope="openid profile email"
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/callback" element={<Callback />} />
        </Routes>
      </BrowserRouter>
    </DAuthProvider>
  );
}
```

#### Hook Usage:
```jsx
import { useDAuth } from '@dauth/react';

export default function Profile() {
  const { user, isAuthenticated, loginWithRedirect, logout } = useDAuth();

  if (!isAuthenticated) {
    return <button onClick={loginWithRedirect}>Login</button>;
  }

  return (
    <div>
      <p>Hello, {user.name}!</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

#### Protected Routes (Declarative Guard):
```jsx
import { ProtectedRoute } from '@dauth/react';

// Automatically redirects user to login if unauthenticated
<Route 
  path="/private-dashboard" 
  element={
    <ProtectedRoute>
      <PrivateDashboard />
    </ProtectedRoute>
  } 
/>
```

---

## 🔒 Security Specifications

* **Proof Key for Code Exchange (PKCE)**: Implements SHA-256 Base64URL challenge hashing to prevent code interception attacks on public clients.
* **Double-Submit Cookie CSRF Checks**: State-changing endpoints are reinforced using double-submit matching session validation check blocks.
* **CORS Whitelist Protection**: Dynamic origin checking allows local preview parameters (Vercel wildcard domains) without opening endpoints globally.
* **Replay & Session Revocation**: Tracks authorization code usage; attempts to reuse authorization codes immediately invalidate all tokens associated with the client/user pair.

---

## ☁️ Production Deployment

1. **Prerequisites**: Provision Neon PostgreSQL database clusters.
2. **Auth Server (Render)**: Set the `NODE_ENV=production` environment variable to ensure Express.js utilizes secure HTTPS-only cookies. Maintain matching `ISSUER` configurations.
3. **Frontend (Vercel)**: Compile bundles (`npm run build`) and point the Vercel project deployment target directories to the `dist/` folders.

---

## 📜 License
MIT License.
