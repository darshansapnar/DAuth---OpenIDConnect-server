# OIDC Authorization Code Flow

DAuth implements the OpenID Connect (OIDC) Authorization Code Flow to securely authenticate user identities and delegate authorization to Relying Client applications.

---

## 🔄 Interaction Sequence

Below is the complete message handshake sequence between the browser, Relying Client, and DAuth:

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant Client as Relying Client (OIDC App)
    participant AuthServer as DAuth Identity Provider

    Client->>User: Redirects to DAuth /authorize
    Note over User,AuthServer: GET /authorize?client_id=...&redirect_uri=...&scope=openid&response_type=code&state=...
    AuthServer->>AuthServer: Validate client_id & redirect_uri (exact match)

    alt User is not logged in
        AuthServer->>User: Redirects to /login (saves query to session)
        User->>AuthServer: Submits username & password (POST /login)
        AuthServer->>User: Redirects back to /authorize with saved params
    end

    AuthServer->>AuthServer: Generates temporary code (expires in 10 mins)
    AuthServer->>AuthServer: Persists code to Database (AuthorizationCode table)
    AuthServer->>User: Redirects back to Client callback
    Note over User,Client: Location: redirect_uri?code=dauth_code_...&state=...

    Client->>AuthServer: Exchange Code (POST /token)
    Note over Client,AuthServer: body: client_id, client_secret, code, redirect_uri
    AuthServer->>AuthServer: Match client secret (bcrypt) & Code expiry/use
    AuthServer->>Client: Send signed Access/ID tokens & Refresh token

    Client->>AuthServer: Request User Profile (GET /userinfo)
    Note over Client,AuthServer: Header: Authorization: Bearer <Access Token>
    AuthServer->>AuthServer: Verify JWT signature (RS256)
    AuthServer->>Client: Return profile claims (sub, email, name)
```

---

## 🛠️ Step-by-Step Flow Details

### 1. Authorization Endpoint (`GET /authorize`)

- The client redirects the user's browser to DAuth with registration parameters.
- DAuth validates the client profile and checks that the callback exactly matches registered URLs.
- If not logged in, the user signs in via `/login`.
- DAuth issues a cryptographically secure random single-use code (`dauth_code_<32-hex-chars>`) with a 10-minute lifetime.
- Redirects the browser to `redirect_uri?code=dauth_code_...&state=...`.

### 2. Token Endpoint (`POST /token`)

- The client exchanges the authorization code for tokens by providing its credentials (secret) and redirect URI.
- DAuth verifies the client's secret hash via `bcrypt` and checks the code's status.
- Once verified, the code is marked as `used` immediately.
- DAuth issues:
  - **Access Token**: Signed RS256 JWT mapping permissions and scopes.
  - **ID Token**: Signed RS256 JWT detailing user identity claims.
  - **Refresh Token**: Opaque string to request subsequent access keys.

### 3. UserInfo Endpoint (`GET /userinfo`)

- The client requests user profile claims by providing the Access Token in the `Authorization: Bearer <Access Token>` header.
- DAuth verifies the signature using the public key and returns user profile claims based on scopes (`sub`, `email`, `name`).

---

## 🔐 Token Cryptography (RS256)

DAuth generates 2048-bit RSA keys in memory on startup. Token signatures are generated using the private key using **RS256** and verified using the public key.

### JWKS (`GET /jwks`)

Clients can fetch the public key configuration from `/jwks` to verify issued tokens independently:

- **`kid`**: Unique key ID.
- **`kty`**: Key type (`RSA`).
- **`alg`**: Signature algorithm (`RS256`).
- **`n` / `e`**: Modulus and exponent parameters for public key reconstruction.
