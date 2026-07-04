# Database Design & Schema

DAuth uses **PostgreSQL** as the primary storage engine, with **Prisma ORM** managing migrations and database transactions.

---

## 🗺️ Entity Relationship (ER) Diagram

```mermaid
erDiagram
    USER {
        string id PK
        string email UK
        string passwordHash
        string name
        datetime createdAt
        datetime updatedAt
    }
    OAUTH_CLIENT {
        string id PK
        string name
        string clientSecret
        string_array redirectUris
        string_array allowedScopes
        datetime createdAt
        datetime updatedAt
    }
    AUTHORIZATION_CODE {
        string id PK
        string code UK
        string clientId FK
        string userId FK
        string redirectUri
        string_array scope
        datetime expiresAt
        boolean used
        string codeChallenge
        string codeChallengeMethod
        datetime createdAt
    }
    SESSION {
        string id PK
        string sid UK
        string userId FK
        string userAgent
        string ipAddress
        datetime expiresAt
        datetime createdAt
    }
    USER_SESSION {
        string id PK
        string sid UK
        string data
        datetime expiresAt
    }
    ACCESS_TOKEN {
        string id PK
        string token UK
        string clientId FK
        string userId FK
        string_array scope
        datetime expiresAt
        boolean revoked
        datetime createdAt
    }
    REFRESH_TOKEN {
        string id PK
        string token UK
        string clientId FK
        string userId FK
        datetime expiresAt
        datetime createdAt
    }
    AUDIT_LOG {
        string id PK
        string action
        string actor
        string userId FK
        string clientId FK
        string details
        string ipAddress
        datetime createdAt
    }

    USER ||--o{ AUTHORIZATION_CODE : issues
    USER ||--o{ SESSION : establishes
    USER ||--o{ ACCESS_TOKEN : grants
    USER ||--o{ REFRESH_TOKEN : rotates
    USER ||--o{ AUDIT_LOG : audits
    OAUTH_CLIENT ||--o{ AUTHORIZATION_CODE : requests
    OAUTH_CLIENT ||--o{ ACCESS_TOKEN : issues
    OAUTH_CLIENT ||--o{ REFRESH_TOKEN : issues
    OAUTH_CLIENT ||--o{ AUDIT_LOG : audits
```

---

## 🗄️ Model Mappings & Schema Specifications

### 1. `User`

Stores credentials for OIDC end-users and dashboard administrators.

- `email`: Normalized to lowercase; unique identifier constraint.
- `passwordHash`: Stored as a secure 12-round `bcrypt` signature.

### 2. `OAuthClient`

Stores registered OIDC Relying Client configurations.

- `clientSecret`: Stored as a secure `bcrypt` hash. Plaintext values are only shown once during creation/rotation.
- `redirectUris`: Array of validated callback URLs.
- `allowedScopes`: Array of permitted scopes (`openid`, `profile`, `email`, `offline_access`).

### 3. `AuthorizationCode`

Stores temporary authorization codes issued during code grants.

- `code`: Unique identifier, expires in 10 minutes.
- `used`: Single-use boolean flag to prevent replay attacks.
- `codeChallenge`/`codeChallengeMethod`: PKCE parameters.

### 4. `Session`

Stores active OIDC Single Sign-On (SSO) browser sessions linked by cookie identifier (`sid`).

### 5. `UserSession`

Internal session table backing `express-session` storage for the admin dashboard console.

### 6. `AccessToken` & `RefreshToken`

Tracks active token grants and revocation states for connected clients.

### 7. `AuditLog`

Audit trails recording key events (login, client creation, key rotations). Uses `onDelete: SetNull` on links so security logs remain intact even if user or client accounts are deleted.
