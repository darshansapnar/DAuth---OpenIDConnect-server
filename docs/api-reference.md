# API Documentation

The DAuth server handles three classes of API endpoints: Core Authentication, Client Management, and OIDC Handshakes.

---

## 🔐 1. Authentication APIs

Endpoints manage administrator logins and console sessions.

### POST `/api/auth/register`

Creates a new user profile.

- **Request Body**:
  ```json
  {
    "email": "dev@dauth.io",
    "password": "Password123",
    "name": "Jane Developer"
  }
  ```
- **Responses**:
  - `201 Created`: User created successfully. Returns user meta.
  - `400 Bad Request`: Email validation failed or password too weak.
  - `409 Conflict`: Email is already registered.

### POST `/api/auth/login`

Authenticates user profiles and establishes cookie session (`dauth_sid`).

- **Request Body**:
  ```json
  {
    "email": "dev@dauth.io",
    "password": "Password123",
    "rememberMe": true
  }
  ```
- **Responses**:
  - `200 OK`: Authenticated successfully. Returns cookie headers.
  - `401 Unauthorized`: Invalid email or password.

### POST `/api/auth/logout`

Destroys session and deletes active cookies.

- **Responses**:
  - `200 OK`: Cookie deleted successfully.

### GET `/api/auth/me`

Retrieves details of the currently authenticated console session. (Protected).

- **Responses**:
  - `200 OK`: Returns authenticated user JSON.
  - `401 Unauthorized`: Session missing or expired.

---

## 🔑 2. OIDC Client Management APIs

_(Protected: requires authenticated admin session. Header `x-csrf-token` matching `dauth_csrf` cookie is required)._

### GET `/api/clients`

Lists all registered clients. Secrets are masked.

- **Responses**: `200 OK` returning clients list.

### POST `/api/clients`

Registers a new OIDC client.

- **Request Body**:
  ```json
  {
    "name": "Sample React App",
    "redirectUris": ["http://localhost:5174/callback"],
    "allowedScopes": ["openid", "profile"]
  }
  ```
- **Responses**:
  - `201 Created`: Client created. Returns plaintext client secret **once**.

### POST `/api/clients/:id/secret`

Rotates client secret.

- **Responses**:
  - `200 OK`: Returns new plaintext client secret **once**.

---

## 🌐 3. OIDC handshakes APIs

Spec-compliant OIDC endpoints.

### GET `/authorize`

Initiates Authorization Code Flow.

- **Query Parameters**:
  - `client_id` (Required): Client UUID.
  - `redirect_uri` (Required): Callback URL.
  - `scope` (Required): Space-separated scopes (must include `openid`).
  - `response_type` (Required): Must be `code`.
  - `state` (Recommended): Roundtrip parameter.
- **Responses**:
  - Redirects browser to `/login` if unauthenticated.
  - Redirects browser to `redirect_uri?code=dauth_code_...&state=...` if authenticated.

### POST `/token`

Exchanges authorization code for tokens. Supports JSON and urlencoded payloads.

- **Request Parameters** (Body or HTTP Basic Authorization headers):
  - `grant_type`: Must be `authorization_code`.
  - `code`: Valid code.
  - `redirect_uri`: Matching callback.
  - `client_id` & `client_secret` (or Basic Auth).
- **Responses**:
  - `200 OK`: Returns Access JWT, ID JWT, opaque refresh token, and scope.
  - `400 Bad Request`/`401 Unauthorized`: Standardized OAuth error JSON (`error`, `error_description`).
