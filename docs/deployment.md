# Local Setup & Deployment

Follow these instructions to start and run DAuth locally for development and testing.

---

## 📋 Prerequisites

- **Node.js**: v20 or higher (v22 recommended)
- **Docker**: For running PostgreSQL database locally
- **npm**: v10 or higher

---

## 🚀 Step-by-Step Setup

### 1. Start the PostgreSQL Database

We provide a Docker Compose configuration inside the `docker` directory to spin up PostgreSQL.

```bash
docker compose -f docker/docker-compose.yml up -d
```

This starts PostgreSQL running on port `5432` with database `dauth` and user `postgres`.

### 2. Configure Environment Variables

Create a `.env` file at the root of the project using `.env.example` as a template:

```bash
# Database URL for Prisma Client
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dauth?schema=public"

# Secret key for signing Express session cookies
SESSION_SECRET="dauth_development_session_secret_key_32_bytes_long"

# Allowed CORS Origins (comma separated)
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5174"

# Environment node context
NODE_ENV="development"
```

### 3. Run Database Migrations

Apply database migrations using Prisma to create tables in the PostgreSQL database:

```bash
# From workspace root
npm run prisma:migrate -w @dauth/auth-server
```

### 4. Seed Database Test Data

Seed default accounts (admin user and matching test clients) to enable OIDC handshake tests out-of-the-box:

```bash
# Seed standard credential tables
npx prisma db seed --schema=apps/auth-server/prisma/schema.prisma
```

_Seeded profiles:_

- Admin User: `admin@dauth.io` / `Password123`
- Test Client: `dauth_cli_sample_client` / `dauth_sec_89dfj19h0fas89d12fjlkjas`

### 5. Start Development Servers

Start all monorepo development servers (auth-server, dashboard, sample-client) concurrently:

```bash
npm run dev
```

---

## 🔗 Port Mappings

When dev servers are running, workspaces are available at:

- **Auth Server Backend**: `http://localhost:3001`
- **Dashboard Administrative Console**: `http://localhost:5173/dashboard`
- **OIDC Sample Client Application**: `http://localhost:5174`
