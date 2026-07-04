# DAuth - Self-Hosted OIDC Identity Provider

DAuth is a self-hosted OpenID Connect (OIDC) Identity Provider built from scratch for learning, portfolio, and educational purposes. It is designed to resemble production-grade systems like Clerk, Auth0, or Keycloak, while remaining clean, modular, and maintainable.

---

## 📖 Workspace Documentation

Detailed specifications and architectural guides are available in the `docs/` folder:

- **[System Architecture](file:///e:/DAuth%20-%20My%20OIDC%20Server/docs/architecture.md)**: Details the monorepo workspace configurations, layer separations, and MVC patterns.
- **[Database Schemas](file:///e:/DAuth%20-%20My%20OIDC%20Server/docs/database.md)**: Documents tables mappings, relations, and the entity-relationship diagram.
- **[API Specifications](file:///e:/DAuth%20-%20My%20OIDC%20Server/docs/api.md)**: Outlines endpoints, request bodies, responses, status codes, and security.
- **[OIDC Handshake Flow](file:///e:/DAuth%20-%20My%20OIDC%20Server/docs/oidc-flow.md)**: Deep-dive sequence diagrams of Authorization Code Flow and RS256 token claims signing.
- **[Local Deployment Setup](file:///e:/DAuth%20-%20My%20OIDC%20Server/docs/deployment.md)**: Step-by-step setup parameters, migrations, and database seeds.

---

## 🛠️ Technology Stack

### Monorepo Architecture

- **Workspaces**: npm Workspaces
- **Linter & Formatter**: ESLint (v9 flat config) & Prettier

### Frontend (Apps & Packages)

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & PostCSS
- **Routing**: React Router DOM (v6)
- **Design System**: Core components library built from scratch in `packages/ui`

### Backend (`apps/auth-server`)

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database ORM**: Prisma ORM
- **Security**: `jose` (RS256 JWT signing/verifying), `bcrypt` (12-round hashing), `express-session` (secure cookie-based sessions), `helmet` (security HTTP headers), `express-rate-limit` (brute-force defense), custom Double-Submit CSRF check middleware.

### Database

- **Engine**: PostgreSQL (managed via Docker & Compose)

---

## 📂 Folder Structure

```text
DAuth/
├── apps/
│   ├── auth-server/       # Express.js backend & OIDC Provider
│   ├── dashboard/         # React admin console for managing clients & users
│   └── sample-client/     # Demo application verifying OIDC integration
├── packages/
│   ├── ui/                # Shared React UI components (design system)
│   └── shared/            # Shared validation helpers, constants, and utilities
├── docs/                  # Architecture & protocol documentation
├── docker/                # Local database compose configurations
├── package.json           # Monorepo workspaces & devDependencies
├── eslint.config.js       # Global ESLint configuration
├── .prettierrc            # Global Prettier configuration
└── .env.example           # Global environment template
```

---

## 🏗️ Development Philosophy

DAuth adheres to strict software engineering standards:

1. **Clean Architecture**: Decoupled MVC layers (Routes → Validators → Controllers → Services → Repositories → Database). Business rules never leak into route endpoints.
2. **Production-Grade Security**:
   - Cryptographic hashing of passwords and client secrets via `bcrypt`.
   - Native HTTP-only session cookies with Lax SameSite settings.
   - JWT tokens signed using **RS256** (RSA Signature with SHA-256) via the `jose` library.
   - Comprehensive input parameters sanitization.
   - Custom Double-Submit Cookie CSRF protection.
3. **Developer Experience (DX)**: Zero-friction setups, local Docker Postgres instance, database migrations, automatic seeding, and standard formatting guidelines.

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js `v20+` or `v22+`
- npm `v10+`
- Docker & Docker Compose (for PostgreSQL)

### Initial Setup

1. **Install dependencies** from the workspace root:

   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` in the root:

   ```bash
   cp .env.example .env
   ```

3. **Spin up the database**:

   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```

4. **Apply database migrations**:

   ```bash
   npm run prisma:migrate -w @dauth/auth-server
   ```

5. **Seed local test profiles**:

   ```bash
   npx prisma db seed --schema=apps/auth-server/prisma/schema.prisma
   ```

6. **Start all servers in development mode**:
   ```bash
   npm run dev
   ```

---

## 🗺️ Roadmap Progress

- [x] **Phase 1**: Monorepo foundation setup and tooling configuration.
- [x] **Phase 2**: Database schemas, credentials registration, and secure session login/logout features.
- [x] **Phase 3**: Developer Dashboard UI and backend Client Registration CRUD APIs.
- [x] **Phase 4**: OIDC Discovery, JWKS Endpoint, Sign-In portal redirects, and parameter validations.
- [x] **Phase 5**: Token exchange endpoint (generating signed RS256 JWT ID/Access tokens, refresh tokens).
- [x] **Phase 6**: Complete security review, CSRF checks, rate limits, request logs, and documentation.
