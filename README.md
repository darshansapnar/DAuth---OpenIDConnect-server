# DAuth 🔐

DAuth is a self-hosted, educational, and production-inspired **OpenID Connect (OIDC) Identity Provider** built from the ground up. It implements standard authentication and authorization protocol specifications with a highly legible, modular architecture.

Rather than relying on heavy third-party SaaS admin dashboards, DAuth serves as a clean, reference blueprint for developers wanting to master OAuth 2.0, OpenID Connect 1.0, PKCE validation, and cryptographic token management.

---

## Why DAuth?

- **Master the Specs**: Designed to help you learn exactly how authorization code redirects, consent states, client basic auth headers, and token signatures fit together under RFC 6749 and OpenID Connect specifications.
- **Zero Bloat**: Contains no complex SaaS metrics or heavy dependencies—just raw, minimal, and secure identity management handlers.
- **Production-Inspired Architecture**: Built with clear layered boundaries (Routes → Controllers → Services → Repositories → PostgreSQL Database) following standard enterprise software design rules.

---

## Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Core** | HTML5, CSS3, JavaScript (ES Modules) | Clean, vanilla markup and ES imports |
| **Frontend UI** | React 18, Vite, Tailwind CSS, React Router v6 | Single Page App for administration |
| **Backend API** | Node.js, Express.js | REST routing and session handlers |
| **Database** | PostgreSQL, Prisma ORM | Relational models and key stores |
| **Security** | jose, bcrypt, express-session, cookie-parser | Asymmetric signatures and hashing |

---

## Features

- **Authorization Code Flow** - Strict redirect-based authentication flow.
- **Proof Key for Code Exchange (PKCE)** - Secure PKCE flow utilizing SHA-256 verifiers (`S256`).
- **Cryptographic Token Rotation & Signatures** - ID Tokens signed via `RS256` asymmetric keys, backing active verification endpoints.
- **Discovery Endpoint** - Compliant standard `GET /.well-known/openid-configuration`.
- **JWKS Endpoint** - Serves JSON Web Key Set (`GET /jwks`) maps to active keys.
- **UserInfo Endpoint** - Supports GET and POST `Authorization: Bearer` claims verification.
- **Replay Attack Protections** - Revokes all active refresh tokens for the user/client pair if an authorization code is re-submitted.
- **Double-Submit CSRF Cookies** - Custom state-changing request checks.
- **Session & Consent Screens** - User permissions panel supporting approvals and denials.

---

## Architecture

DAuth separates HTTP layers from database interactions and business logic:

```
Routes ──> Controllers ──> Services ──> Repositories ──> Database (Prisma)
```

- **Routes**: Define HTTP boundaries and apply validators or protection middlewares.
- **Controllers**: Parse input parameters and format JSON responses.
- **Services**: Execute domain-specific business actions (like token signing or code verifications).
- **Repositories**: Execute database queries using Prisma.

---

## Folder Structure

```
dauth-monorepo/
├── apps/
│   ├── auth-server/         # OIDC authentication backend (Express.js)
│   │   ├── prisma/          # Prisma database schema and seeds
│   │   └── src/             # Node.js source folders
│   │       ├── controllers/ # Route handlers
│   │       ├── middleware/  # CSRF and Session protection filters
│   │       ├── repositories/# Prisma queries
│   │       ├── services/    # Key signing & PKCE business rules
│   │       └── utils/       # Jose & crypto utilities
│   ├── dashboard/           # Administrator Console (React + Vite)
│   └── sample-client/       # Demo Relying Party Client (React + Vite)
├── packages/
│   ├── ui/                  # Shared styling components
│   └── shared/              # Shared helper functions
├── docs/                    # Step-by-step OIDC specifications
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database instance (local or Neon cloud)

### 1. Installation
Clone the repository and install dependencies at the root of the monorepo:
```bash
git clone https://github.com/yourusername/dauth.git
cd dauth
npm install
```

### 2. Configure Environment Variables
Create a `.env` file at the monorepo root:
```bash
cp .env.example .env
```

Define the following environment values:
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Connection URI to your PostgreSQL database |
| `SESSION_SECRET` | `dauth_super_secret_session_key` | Secret used to sign session cookies |
| `PORT` | `3001` | Auth Server port (must be 3001 for sample client) |
| `NODE_ENV` | `development` | Environment mode |

### 3. Database Sync & Seed
Sync your PostgreSQL database schema with Prisma and seed the default administrator user and client registers:
```bash
# Sync database
npx prisma db push --schema=apps/auth-server/prisma/schema.prisma

# Seed data (Creates user admin@dauth.io / Password123)
npx prisma db seed --schema=apps/auth-server/prisma/schema.prisma
```

---

## Creating and Using Accounts

### Public User Registration
New user accounts can be registered directly from the web interface:
1. When navigating to the login page (e.g. during a sign-in prompt or by visiting `http://localhost:3001/login`), click the **"Create one"** link below the sign-in form.
2. Fill out your details: **Full Name**, **Email Address**, and a secure **Password** (minimum 8 characters).
3. Click **"Create Account"** to submit.
4. You will be redirected back to the login page showing a confirmation message: *"Account created successfully. Please sign in."*

### Signing In
Once registered, the newly created account credentials can be used immediately to:
* Authorize client applications (like the **Sample Client** running at `http://localhost:5174`).
* Sign in and view the user database directory inside the **Dashboard Console** (`http://localhost:5173`).

### Google Identity Federation
DAuth supports Sign In with Google out of the box:
1. Register a web application client on the **Google Cloud Console**.
2. Configure the **Authorized redirect URIs** to point to:
   `http://localhost:3001/api/auth/federation/google/callback`
3. Obtain your **Client ID** and **Client Secret**.
4. Configure these values in your local `.env` file:
   ```env
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/federation/google/callback"
   ```
5. Restart your dev servers (`npm run dev`). A new **"Continue with Google"** option will be available on the Sign In page!

---

## Running the Project

Start the development servers for all three workspace directories (Auth Server, Dashboard, and Sample Client) concurrently:
```bash
npm run dev
```

The apps will run on the following endpoints:
* **Auth Server Gateway**: `http://localhost:3001`
* **Dashboard Console**: `http://localhost:5173`
* **Sample Client Relying Party**: `http://localhost:5174`

---

## API Endpoints

### OpenID Connect & OAuth 2.0 Spec Endpoints
- `GET /.well-known/openid-configuration` - Discovery document metadata.
- `GET /authorize` - Interactive authorization flow.
- `POST /token` - Swaps authorization codes or refresh tokens for tokens.
- `GET /jwks` - Returns public keys for signature verification.
- `GET/POST /userinfo` - Returns profile claims for authorized tokens.
- `GET /login` / `GET /consent` - Interactive portals.

### Dashboard Stats & Management APIs
- `GET /api/stats/overview` - Live database metrics.
- `GET/POST /api/clients` - CRUD operations for OAuth clients.
- `GET /api/users` - Lists registered user accounts.
- `GET /api/sessions` - List and revoke active session records.

---

## Key Management

DAuth manages standard 2048-bit RSA key pairs automatically on startup:
1. `KeyManagerService` checks for existing keys under `apps/auth-server/keys/`.
2. If keys (`private.pem` and `public.pem`) are missing, a new keypair is generated and stored.
3. The private key (`private.pem`) is automatically added to `.gitignore` and is never committed to Git control.

To rotate the keys manually, simply delete the `keys/` directory contents and restart the server.

---

## Future Improvements
- **Dynamic Client Registration**: Support for RFC 7591 dynamic endpoints.
- **Dynamic PKCE enforcement**: Selectively enforce PKCE checks per client type.
- **Client Credentials Grant**: Support machine-to-machine integrations.

---

## License

This project is licensed under the [MIT License](LICENSE).
