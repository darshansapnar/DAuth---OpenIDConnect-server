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

## 📦 Integrating DAuth into Your Application

This guide explains how to integrate authentication into a brand-new application using the DAuth React SDK. By following these steps, you can set up secure, standards-compliant user login without needing to write custom OIDC handshake code.

### 1. Prerequisites

Before writing any integration code, ensure you have the following ready:
* **Running DAuth Server**: A deployed or locally running DAuth Authorization Server (defaults to `http://localhost:3001` in local development).
* **Access to Admin Dashboard**: The administrative portal (`http://localhost:5173/dashboard/` locally) to configure your integration credentials.
* **React Application**: A React project (Vite or Create React App) where you want to add user authentication.
* **Registered OAuth Client**: A client profile registered inside the DAuth Admin Dashboard.

---

### 2. Register an OAuth Client

To connect your React application to the DAuth server, you must register it as a Client:
1. Log in to the **DAuth Dashboard** using your administrator credentials.
2. Navigate to the **OAuth Clients** section and click **Create Client**.
3. Fill out the registration form:
   * **Client Name**: A display name for your application (e.g., `My Cool Portal`).
   * **Client Type**: Set this to **`PUBLIC`**. Single-Page React apps run directly in the user's browser, meaning they are considered "public clients" that cannot securely protect a client secret. Setting this option enforces PKCE security and disables client secret checks.
   * **Redirect URI**: The callback route in your application where the DAuth server will send the authorization code (e.g., `http://localhost:5175/callback` during local development).
   * **Allowed Scopes**: Scopes dictate what information your application is allowed to ask for. Select `openid` (required for identity claims), `profile` (requested user profile data), and `email`.

**Example Registration Parameters:**
* **Client ID**: Generated automatically or input as `my_cool_react_app`.
* **Client Type**: `PUBLIC`
* **Redirect URIs**: `http://localhost:5175/callback`
* **Allowed Scopes**: `openid profile email`

---

### 3. Install the SDK

> [!IMPORTANT]  
> **Current SDK Distribution:**  
> The `@dauth/react` and `@dauth/sdk` libraries are currently contained inside the DAuth monorepo workspace for development purposes and are not yet published to the public npm registry. Running `npm install @dauth/react` directly from the npm registry will fail.
> 
> To integrate the SDK into a standalone React application on your local machine, install it by specifying the relative file path to the package directory on your local filesystem:
> ```bash
> npm install "/absolute/or/relative/path/to/DAuth---OpenIDConnect-server/packages/react"
> ```
> This installs the `@dauth/react` package and dynamically links `@dauth/sdk` as a nested dependency. Once the SDK is published to the public npm registry, you will be able to install it via standard package names.

---

### 4. Configure DAuthProvider

The `<DAuthProvider>` container initializes the SDK instance and wraps your React application inside an authentication context. It coordinates background token expiration checks and dynamic parameter updates.

Import the provider and wrap your routing layout:

```jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DAuthProvider } from '@dauth/react';
import Home from './Home';
import Callback from './Callback';

export default function App() {
  return (
    <DAuthProvider
      issuer="http://localhost:3001"
      clientId="my_cool_react_app"
      redirectUri="http://localhost:5175/callback"
      scope="openid profile email"
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/callback" element={<Callback />} />
        </Routes>
      </BrowserRouter>
    </DAuthProvider>
  );
}
```

#### Provider Properties Explained:
* **`issuer`**: *[String - Required]* The root URL of the DAuth server. The SDK uses this base URL to retrieve the OIDC discovery parameters dynamically.
* **`clientId`**: *[String - Required]* The client identifier matching the record in the Admin Dashboard.
* **`redirectUri`**: *[String - Required]* The endpoint in your application that receives OIDC callbacks. This URL must match one of the registered Redirect URIs in your Dashboard client configuration exactly.
* **`scope`**: *[String - Optional]* Space-separated list of scopes to request. Defaults to `"openid profile email"`.

---

### 5. Login Integration

Use the `useDAuth()` hook to request user logins. When `loginWithRedirect()` is triggered, the SDK dynamically manages the login sequence:

```jsx
import React from 'react';
import { useDAuth } from '@dauth/react';

export default function Home() {
  const { loginWithRedirect, isAuthenticated, user } = useDAuth();

  if (isAuthenticated) {
    return <h2>Welcome back, {user.name}!</h2>;
  }

  return (
    <div className="login-container">
      <h1>Protected Portal</h1>
      <button onClick={loginWithRedirect}>Sign In with DAuth</button>
    </div>
  );
}
```

#### What happens internally when `loginWithRedirect()` is called:
1. **OIDC Discovery**: The SDK queries `/.well-known/openid-configuration` on the issuer URL to find the server's authorization and token endpoints dynamically.
2. **PKCE Parameter Generation**: The SDK generates a cryptographically secure random `code_verifier` string and computes its SHA-256 Base64URL hash to generate the `code_challenge`.
3. **State Parameter Generation**: A random string (`state`) is created to defend against CSRF attacks.
4. **Caching**: The SDK saves `code_verifier` and `state` parameters in browser local storage.
5. **Redirection**: Redirects the browser to the `/authorize` endpoint passing the client ID, code challenge, state, and scopes as URL query parameters.

---

### 6. Callback Integration

Create a dedicated `/callback` page element to receive the OIDC server's response. This route must call the `handleRedirectCallback()` hook method on mount to swap the authorization code for access tokens:

```jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDAuth } from '@dauth/react';

export default function Callback() {
  const navigate = useNavigate();
  const { handleRedirectCallback } = useDAuth();
  const [error, setError] = useState(null);
  const executionRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (executionRef.current) return;
    executionRef.current = true;

    async function swapCode() {
      try {
        await handleRedirectCallback();
        navigate('/'); // Redirect back to Home page on success
      } catch (err) {
        console.error('OIDC exchange failed:', err);
        setError(err.message || 'An authentication error occurred.');
      }
    }

    swapCode();
  }, [handleRedirectCallback, navigate]);

  if (error) {
    return (
      <div className="error-panel">
        <h3>Authentication Failed</h3>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="loader">
      <p>Finalizing credentials handshake with DAuth...</p>
    </div>
  );
}
```

#### What happens internally when `handleRedirectCallback()` is called:
1. **Query Extraction**: Reads the `code` and `state` parameters from the page's URL query string.
2. **State Validation**: Asserts that the URL `state` matches the cached local storage state to verify the request wasn't forged.
3. **Token Swap request**: Sends a POST request to the `/token` endpoint carrying the `code` and the cached `code_verifier`.
4. **Token Decoding**: Decodes the returned ID Token JWT to extract the profile claims.
5. **UserInfo Request**: Calls the `/userinfo` endpoint with the new Access Token to fetch the full user profile.
6. **Session Storing**: Saves the active token bundle and profile object in local storage, and clears the temporary PKCE verifiers.

---

### 7. User Information

Once authenticated, the SDK exposes the user's properties directly:
* **`user`**: An object containing the claims returned by the OIDC server. Typically:
  * `sub`: Subject identifier (unique user ID).
  * `name`: Full name of the user.
  * `email`: Email address.
* **`isAuthenticated`**: Boolean flag indicating if there is a valid, active user session.

```jsx
const { user, isAuthenticated } = useDAuth();

if (isAuthenticated && user) {
  return (
    <div>
      <p>Logged in as: <strong>{user.name}</strong></p>
      <p>Email address: {user.email}</p>
      <p>User Subject ID: <code>{user.sub}</code></p>
    </div>
  );
}
```

---

### 8. Logout

The logout function destroys browser credentials and alerts the identity provider to invalidate active sessions:

```jsx
const { logout } = useDAuth();

return <button onClick={logout}>Sign Out</button>;
```

#### What happens internally when `logout()` is called:
1. **Local Clear**: Evicts token payloads, claims, and storage sessions from the local cache.
2. **OIDC end_session**: Queries the OIDC Discovery configuration for the server's `end_session_endpoint`.
3. **Redirection**: Redirects the browser to the logout route, passing `post_logout_redirect_uri` to bring the user back to the application homepage. The server destroys the active cookie session.

---

### 9. Protected Routes

The SDK offers a declarative `<ProtectedRoute>` wrapper to automatically guard private pages. Wrapping a page component in `<ProtectedRoute>` ensures that users cannot access the route without logging in.

```jsx
import { ProtectedRoute } from '@dauth/react';
import Dashboard from './Dashboard';

// Automatically redirects to DAuth login page if the user is unauthenticated
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

You can pass a custom loading fallback element if desired:
```jsx
<ProtectedRoute fallback={<p>Authenticating workspace...</p>}>
  <Dashboard />
</ProtectedRoute>
```

---

### 10. Complete Authentication Flow

```
+-------------+         Clicks Login          +----------------+
| Application | ----------------------------> |   dauth SDK    |
+-------------+                               +----------------+
       ^                                               |
       |                                               | Generates PKCE Challenge &
       |                                               v redirects browser
       |                                      +----------------+
       |                                      |  DAuth Server  |
       |                                      +----------------+
       |                                               |
       |                                               | Displays Login Form &
       |                                               v Consent Prompt
       |                                      +----------------+
       |                                      |   User Login   |
       |                                      +----------------+
       |                                               |
       |                                               | User approves scopes &
       |                                               v redirects with Code
       |                                      +----------------+
       |                                      | Callback Route |
       |                                      +----------------+
       |                                               |
       |                                               | Swaps Code + Verifier
       |                                               v via /token POST
       |                                      +----------------+
       |                                      | Token Exchange |
       |                                      +----------------+
       |                                               |
       |                                               | Query User Profile
       v                                               v via /userinfo
+----------------+      Exposes user claims   +----------------+
|  Authenticated | <------------------------- |    UserInfo    |
+----------------+                            +----------------+
```

---

### 11. Troubleshooting

Here are the most common OIDC integration errors and how to resolve them:

#### 1. Redirect URI Mismatch
* **Error**: `Redirect URI mismatch` displayed on the DAuth Server login screen.
* **Cause**: The `redirectUri` configured inside `<DAuthProvider>` does not match the allowed list for the client in the Admin Dashboard.
* **Resolution**: Log into the DAuth Admin Dashboard, edit your client configuration, and ensure the URL (including ports, subdomains, and trailing slashes) is exactly registered.

#### 2. Public Client Sending Client Secret
* **Error**: `Invalid request: Public clients must not send a client_secret.` returned from `/token`.
* **Cause**: Your client type is set to `PUBLIC` inside the Admin Dashboard, but your application code is passing a `clientSecret` configuration property.
* **Resolution**: Remove the `clientSecret` configuration key from your client application code. Public browser-side applications must never hold or send secrets.

#### 3. Discovery Endpoint Unavailable
* **Error**: `Failed to retrieve OIDC discovery endpoints...` warning in browser console.
* **Cause**: The DAuth backend server is offline, or the `issuer` URL provided in the `<DAuthProvider>` configuration is incorrect.
* **Resolution**: Verify that the DAuth backend server is online by opening `${issuer}/.well-known/openid-configuration` in a browser tab. Ensure the protocol (http vs https) and ports are correct.

#### 4. PKCE Verification Failed
* **Error**: `PKCE verification failed: code_verifier mismatch.` on code exchange.
* **Cause**: The `code_verifier` stored in browser storage was lost, mutated, or evicted due to cross-site domain redirects under strict browser cookie policies.
* **Resolution**: Ensure your browser supports `localStorage`. The DAuth SDK caches OIDC handshakes using storage interfaces to survive page loads.

#### 5. ESLint Empty Block Statements
* **Error**: Build errors stating `Empty block statement no-empty` inside your bundler logs.
* **Cause**: Standalone linter rules are flagging catch blocks inside dependency files.
* **Resolution**: Verify that the latest `@dauth/react` and `@dauth/sdk` workspaces are installed. The package code is formatted with ESLint-compliant ignore remarks.

---

### 12. Current SDK Distribution

* **Monorepo Packaging**: The SDK components reside strictly inside the DAuth workspace directories (`packages/sdk` and `packages/react`) for localized development.
* **Standalone Install**: Running `npm install @dauth/react` directly from the global npm registry will return package errors as the package is not yet published. Follow the **[local install guide](#3-install-the-sdk)** above to install it from your local project filesystem.

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
