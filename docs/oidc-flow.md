# OpenID Connect (OIDC) Authorization Code Flow in DAuth

This document explains the step-by-step implementation of the **OIDC Authorization Code Flow with PKCE (Proof Key for Code Exchange)** as executed by DAuth.

---

## 1. Flow Sequence Diagram

The following Mermaid sequence diagram illustrates the interactions between the User Agent (Browser), the Client Application, the DAuth Authorization Server, and the UserInfo API.

```mermaid
sequence diagram
    autonumber
    actor User as End User (Browser)
    participant Client as Client Application
    participant DAuth as DAuth Server (/authorize, /login, /consent)
    participant Token as DAuth Token Endpoints (/token)
    participant UI as DAuth UserInfo (/userinfo)

    %% Step 1: Initiate
    User->>Client: Click "Login with DAuth"
    Client->>User: Redirect to DAuth /authorize with query params (PKCE challenge, state, nonce)
    User->>DAuth: GET /authorize?...

    %% Step 2: Authentication
    alt No Active Session
        DAuth->>User: Redirect to /login
        User->>DAuth: POST /login (username & password)
        DAuth->>User: Set dauth_sid Cookie & Redirect to /authorize
    end

    %% Step 3: Consent
    alt Consent Not Yet Approved
        DAuth->>User: Redirect to /consent
        User->>DAuth: POST /consent (approval=approve)
        DAuth->>User: Set consentApproved & Redirect to /authorize
    end

    %% Step 4: Code Issuance
    DAuth->>User: Redirect to Client redirect_uri with Auth Code & state
    User->>Client: GET /callback?code=dauth_code_xyz&state=state_abc

    %% Step 5: Token Exchange
    Client->>Token: POST /token (code, client_secret, code_verifier)
    Token->>Client: Return Access Token, Refresh Token, and Signed ID Token (RS256)

    %% Step 6: UserInfo
    Client->>UI: GET /userinfo (Authorization: Bearer <access_token>)
    UI->>Client: Return User Profile Claims (sub, email, name)
    Client->>User: Display logged-in user dashboard
```

---

## 2. Step-by-Step Endpoint Specifications

### Step 1: Authorization Request (`GET /authorize`)
The Client redirects the User Agent to DAuth's authorization endpoint to initiate the handshake.

* **Example Request URL**:
  ```http
  GET http://localhost:3001/authorize?
      client_id=dauth_cli_sample_client&
      redirect_uri=http%3A%2F%2Flocalhost%3A5174%2Fcallback&
      response_type=code&
      scope=openid+profile+email+offline_access&
      state=state_handshake_123&
      nonce=nonce_secret_abc&
      code_challenge=ZAwnkX3iVYNGeP5p-TLrBr764zf5iibmZ5GcSzWI058&
      code_challenge_method=S256
  ```

* **Query Parameters**:
  - `client_id`: Registered client ID identifier.
  - `redirect_uri`: Target callback URI (must match registered redirect URIs).
  - `response_type`: Must be `code`.
  - `scope`: Space-separated list containing `openid`.
  - `state`: Anti-CSRF token passed back to the client callback.
  - `nonce`: Opaque value bound to the issued ID Token.
  - `code_challenge`: Base64url-encoded SHA-256 hash of the `code_verifier`.
  - `code_challenge_method`: Must be `S256`.

---

### Step 2: User Authentication (`POST /login`)
If no active session (`dauth_sid`) cookie is present, DAuth caches the query parameters in the session and redirects the browser to `/login`.

* **Request Payload**:
  ```json
  {
    "email": "admin@dauth.io",
    "password": "Password123"
  }
  ```
* **Response**: Sets the HttpOnly session cookie `dauth_sid` and redirects the user back to the `/authorize` endpoint with the original query parameters.

---

### Step 3: Scope Consent (`POST /consent`)
Before issuing a code, DAuth displays a Consent Screen detailing requested scopes (e.g., email, profile).

* **Request Payload**:
  ```http
  POST http://localhost:3001/consent
  Content-Type: application/x-www-form-urlencoded
  X-CSRF-Token: <token>

  approval=approve&_csrf=<token>
  ```
* **Response**: Redirects the user back to `/authorize`. (If denied via `approval=deny`, redirects the user back to the client `redirect_uri` with query parameters `error=access_denied` and `state`).

---

### Step 4: Authorization Code Redirect
Once authenticated and consented, `/authorize` issues a cryptographically secure, 10-minute short-lived **Authorization Code** containing the encoded `nonce` parameter as a dot-separated suffix (e.g., `dauth_code_xyz.encoded_nonce`), and redirects the browser:

* **Example Redirect**:
  ```http
  HTTP/1.1 302 Found
  Location: http://localhost:5174/callback?code=dauth_code_9a8df7d9...&state=state_handshake_123
  ```

---

### Step 5: Token Exchange (`POST /token`)
The client swaps the authorization code for tokens directly via a secure backchannel request.

* **Example Request**:
  ```http
  POST http://localhost:3001/token
  Content-Type: application/x-www-form-urlencoded

  grant_type=authorization_code&
  code=dauth_code_9a8df7d9...&
  redirect_uri=http%3A%2F%2Flocalhost%3A5174%2Fcallback&
  client_id=dauth_cli_sample_client&
  client_secret=dauth_sec_89dfj19h0fas89d12fjlkjas&
  code_verifier=my_cryptographic_pkce_verifier_string_xyz
  ```

* **Validations Executed**:
  - Matches client secrets.
  - Verifies that the code is not expired (within 10 minutes) and hasn't been used.
  - Computes the SHA-256 hash of `code_verifier` and matches it against the stored `code_challenge`.
  - Marks the code as used. (If a used code is re-submitted, all active refresh tokens for the user/client pair are revoked as replay protection).

* **Example Response**:
  ```json
  {
    "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
    "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
    "refresh_token": "dauth_rt_a9df8a...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "scope": "openid profile email"
  }
  ```

---

### Step 6: UserInfo Request (`GET` or `POST` `/userinfo`)
The Client fetches profile claims using the access token in HTTP Headers.

* **Example Request**:
  ```http
  GET http://localhost:3001/userinfo
  Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6...
  ```
* **Example Response**:
  ```json
  {
    "sub": "usr_7ad0f8a9...",
    "email": "admin@dauth.io",
    "email_verified": true,
    "name": "Admin User"
  }
  ```
