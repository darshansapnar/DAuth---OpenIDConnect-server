# DAuth — Self-Hosted OpenID Connect Identity Provider

DAuth is a production-inspired OIDC Identity Provider built from scratch for learning and portfolio purposes. It implements real OAuth 2.0 and OpenID Connect flows with a clean, layered architecture.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React, Vite, Tailwind CSS, React Router |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (Neon), Prisma ORM |
| **Auth** | jose (RS256 JWT), bcrypt, express-session |
| **Language** | JavaScript (ES Modules) |

## Project Structure

```
apps/
  auth-server/      # OIDC provider backend (Express)
  dashboard/        # Admin console (React + Vite)
  sample-client/    # Demo relying party app (React + Vite)
packages/
  ui/               # Shared component library
  shared/           # Shared utilities
```

## OIDC Features Implemented

- **Authorization Code Flow** — Full redirect-based authentication
- **PKCE** — Proof Key for Code Exchange (S256)
- **Consent Screen** — Scope approval/denial before code issuance
- **Refresh Tokens** — `grant_type=refresh_token` at `/token`
- **Discovery Endpoint** — `GET /.well-known/openid-configuration`
- **JWKS Endpoint** — `GET /jwks`
- **UserInfo Endpoint** — `GET /userinfo`
- **RS256 Token Signing** — Asymmetric JWT signatures via jose

## Dashboard Navigation

| Page | Description |
|------|-------------|
| **Overview** | Live stats (users, clients, tokens) and system health |
| **OAuth Clients** | Create, view, and manage OIDC client applications |
| **Users** | View registered user accounts |
| **Sessions** | View active SSO sessions |
| **Audit Logs** | Security event trail |
| **Settings** | OIDC provider configuration and signing key details |

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (Neon recommended)

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd DAuth

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and SESSION_SECRET

# 4. Generate Prisma client and run migrations
npx prisma generate --schema=apps/auth-server/prisma/schema.prisma
npx prisma db push --schema=apps/auth-server/prisma/schema.prisma

# 5. Seed the database
node apps/auth-server/prisma/seed.js

# 6. Start all services
npm run dev
```

### Running Services

| Service | URL |
|---------|-----|
| Auth Server | http://localhost:3001 |
| Dashboard | http://localhost:5173 |
| Sample Client | http://localhost:5174 |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/.well-known/openid-configuration` | OIDC Discovery |
| `GET` | `/authorize` | Authorization endpoint |
| `POST` | `/token` | Token exchange (auth code + refresh) |
| `GET` | `/jwks` | JSON Web Key Set |
| `GET` | `/userinfo` | User profile claims |
| `GET` | `/login` | Server-rendered login form |
| `GET` | `/consent` | Consent screen |
| `GET` | `/api/health` | Health check with DB probe |
| `GET` | `/api/stats/overview` | Database counts |
| `GET` | `/api/users` | List registered users |
| `GET` | `/api/sessions` | List active sessions |
| `DELETE` | `/api/sessions/:id` | Revoke a session |
| `GET` | `/api/audit-logs` | List audit log entries |
| `POST` | `/api/auth/register` | User registration |
| `GET/POST` | `/api/clients` | Client management (CRUD) |

## Architecture

```
Routes → Controllers → Services → Repositories → Database
```

Business logic lives in Services. Database queries live in Repositories. Route files only handle HTTP concerns.

## RSA Key Management

DAuth automatically manages the RSA keys used to sign ID Tokens (`RS256` algorithm).

### How keys are generated
On server startup, `KeyManagerService` checks for existing keys:
- If `apps/auth-server/keys/private.pem` and `public.pem` already exist, they are loaded.
- If they do not exist, a new 2048-bit RSA key pair is generated using Node's `crypto` library and stored on disk.
- If generation fails, server startup is halted with a fatal error.

### Where keys are stored
- Private Key: `apps/auth-server/keys/private.pem` (ignored by Git, never commit this to repository control).
- Public Key: `apps/auth-server/keys/public.pem`.

### How to rotate keys in the future
To rotate keys manually:
1. Delete the files `private.pem` and `public.pem` in `apps/auth-server/keys/`.
2. Restart the auth server. A new key pair will automatically be generated and saved.
*Note: Rotating keys will invalidate all previously signed JWT tokens (such as ID Tokens) since the verification signature has changed.*

## License

MIT
