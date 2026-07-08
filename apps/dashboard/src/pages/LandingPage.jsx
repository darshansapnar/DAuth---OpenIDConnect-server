import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent } from '@dauth/ui';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 text-[#111827] dark:text-zinc-50 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Header Navigation */}
      <header className="bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg text-gray-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
              🔐 DAuth
            </span>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500 dark:text-zinc-400">
              <a href="#features" className="hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                Features
              </a>
              <a href="#architecture" className="hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                Architecture
              </a>
              <a href="#oidc-flow" className="hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                OIDC Flow
              </a>
              <a href="#developer-experience" className="hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                Developer Experience
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/dashboard">
              <Button variant="primary" size="sm">
                Go to Console
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12 border-b border-gray-200 dark:border-white/5">
        <div className="flex-1 text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-xs font-semibold text-blue-700 dark:text-blue-400">
            OpenID Connect Identity Provider
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-zinc-50 leading-tight">
            One identity platform. Every application.
          </h1>
          <p className="text-base md:text-lg text-gray-500 dark:text-zinc-400 max-w-xl leading-relaxed">
            DAuth centralizes authentication using OAuth 2.0, OpenID Connect, PKCE, RS256 JWT
            signing, and Google Identity Federation—so every application can share a secure
            identity platform.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="primary" size="lg">
                Launch Console
              </Button>
            </Link>
            <a href="#oidc-flow">
              <Button variant="secondary" size="lg">
                Explore OIDC Flow
              </Button>
            </a>
          </div>
        </div>
        <div className="flex-1 w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-lg p-6 shadow-sm font-mono text-xs text-gray-700 dark:text-zinc-300">
          <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-white/10 mb-4">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
            </div>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500">dauth-config.json</span>
          </div>
          <pre className="overflow-x-auto leading-relaxed text-blue-600 dark:text-blue-400">
            {`{
  "issuer": "${import.meta.env.VITE_AUTH_SERVER_URL || ''}",
  "authorization_endpoint": "/api/oauth/authorize",
  "token_endpoint": "/api/oauth/token",
  "userinfo_endpoint": "/api/oauth/userinfo",
  "jwks_uri": "/api/oauth/jwks",
  "scopes_supported": ["openid", "profile", "email"],
  "response_types_supported": ["code"],
  "token_signing_alg_values_supported": ["RS256"]
}`}
          </pre>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="bg-white dark:bg-[#111827] py-20 border-b border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-left space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-50 tracking-tight">
              Handcrafted Capabilities
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-lg leading-relaxed">
              Every detail is engineered to support clean authentication processes with zero
              unnecessary complications.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <span className="text-2xl">🔒</span>
                <h3 className="font-bold text-base text-gray-900 dark:text-zinc-50">PKCE & Auth Code Flow</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 leading-normal">
                  Implements the standard OAuth 2.1 Authorization Code flow secured with Proof Key
                  for Code Exchange (PKCE).
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <span className="text-2xl">🔑</span>
                <h3 className="font-bold text-base text-gray-900 dark:text-zinc-50">RS256 Token Signing</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 leading-normal">
                  Signs secure JSON Web Tokens (JWT) using standard RS256 public/private key
                  cryptography via jose.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <span className="text-2xl">💾</span>
                <h3 className="font-bold text-base text-gray-900 dark:text-zinc-50">Prisma & Postgres</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 leading-normal">
                  Built on a robust database layout using Prisma ORM connected directly to a
                  PostgreSQL database.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. Architecture Section */}
      <section id="architecture" className="py-20 border-b border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-left space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-50 tracking-tight">
              Layered System Architecture
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-lg leading-relaxed">
              DAuth separates handlers, business rules, and DB interfaces to ensure extreme
              readability and testing.
            </p>
          </div>
          <div className="flex justify-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-lg p-6 md:p-12 shadow-sm overflow-hidden">
            <svg
              className="w-full max-w-2xl h-auto"
              viewBox="0 0 600 280"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Layer 1: HTTP Client */}
              <rect
                x="20"
                y="20"
                width="140"
                height="60"
                rx="6"
                fill="#EFF6FF"
                stroke="#3B82F6"
                strokeWidth="1.5"
              />
              <text
                x="90"
                y="55"
                fill="#1E3A8A"
                fontSize="13"
                fontWeight="bold"
                textAnchor="middle"
              >
                HTTP Client
              </text>

              {/* Arrow 1 */}
              <path
                d="M160 50H200"
                stroke="#94A3B8"
                strokeWidth="2"
                strokeDasharray="4 4"
                markerEnd="url(#arrow)"
              />
              <text x="180" y="42" fill="#64748B" fontSize="10" textAnchor="middle">
                Request
              </text>

              {/* Layer 2: Routes */}
              <rect
                x="220"
                y="20"
                width="150"
                height="60"
                rx="6"
                fill="#F8FAFC"
                stroke="#E2E8F0"
                strokeWidth="1.5"
              />
              <text
                x="295"
                y="55"
                fill="#0F172A"
                fontSize="13"
                fontWeight="bold"
                textAnchor="middle"
              >
                Express Routes
              </text>

              {/* Arrow 2 */}
              <path d="M295 80V120" stroke="#94A3B8" strokeWidth="2" />

              {/* Layer 3: Controllers */}
              <rect
                x="220"
                y="120"
                width="150"
                height="60"
                rx="6"
                fill="#F8FAFC"
                stroke="#E2E8F0"
                strokeWidth="1.5"
              />
              <text
                x="295"
                y="155"
                fill="#0F172A"
                fontSize="13"
                fontWeight="bold"
                textAnchor="middle"
              >
                Controllers
              </text>

              {/* Arrow 3 */}
              <path d="M295 180V220" stroke="#94A3B8" strokeWidth="2" />

              {/* Layer 4: Services */}
              <rect
                x="220"
                y="220"
                width="150"
                height="40"
                rx="6"
                fill="#3B82F6"
                stroke="#2563EB"
                strokeWidth="1.5"
              />
              <text
                x="295"
                y="244"
                fill="#FFFFFF"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
              >
                Business Services
              </text>

              {/* Arrow 4 */}
              <path d="M370 240H410" stroke="#94A3B8" strokeWidth="2" />

              {/* Layer 5: Repositories */}
              <rect
                x="430"
                y="220"
                width="150"
                height="40"
                rx="6"
                fill="#F8FAFC"
                stroke="#E2E8F0"
                strokeWidth="1.5"
              />
              <text
                x="505"
                y="244"
                fill="#0F172A"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
              >
                Repositories (Prisma)
              </text>

              {/* Layer 6: Database */}
              <rect
                x="430"
                y="120"
                width="150"
                height="60"
                rx="6"
                fill="#ECFDF5"
                stroke="#10B981"
                strokeWidth="1.5"
              />
              <text
                x="505"
                y="155"
                fill="#065F46"
                fontSize="13"
                fontWeight="bold"
                textAnchor="middle"
              >
                PostgreSQL DB
              </text>

              {/* Connection DB */}
              <path d="M505 220V180" stroke="#94A3B8" strokeWidth="2" />

              {/* Marker Definitions */}
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#94A3B8" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>
      </section>

      {/* 5. OIDC Flow Illustration Section */}
      <section id="oidc-flow" className="bg-white dark:bg-[#111827] py-20 border-b border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-left space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-50 tracking-tight">
              OIDC Authorization Flow
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-lg leading-relaxed">
              Visualizes how DAuth processes authentication and exchanges validation keys.
            </p>
          </div>
          <div className="flex justify-center bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-lg p-6 md:p-12 shadow-sm overflow-hidden">
            <svg
              className="w-full max-w-2xl h-auto"
              viewBox="0 0 600 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg font-sans"
            >
              {/* Actors */}
              <text
                x="60"
                y="30"
                fill="#475569"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                Relying Client
              </text>
              <line
                x1="60"
                y1="40"
                x2="60"
                y2="300"
                stroke="#CBD5E1"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              <text
                x="300"
                y="30"
                fill="#475569"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                User Agent
              </text>
              <line
                x1="300"
                y1="40"
                x2="300"
                y2="300"
                stroke="#CBD5E1"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              <text
                x="540"
                y="30"
                fill="#475569"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                DAuth Provider
              </text>
              <line
                x1="540"
                y1="40"
                x2="540"
                y2="300"
                stroke="#CBD5E1"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Step 1 */}
              <path d="M60 70H300" stroke="#3B82F6" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <text
                x="180"
                y="62"
                fill="#1D4ED8"
                fontSize="10"
                textAnchor="middle"
                fontWeight="medium"
              >
                1. Redirect /authorize
              </text>

              {/* Step 2 */}
              <path d="M300 110H540" stroke="#3B82F6" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <text
                x="420"
                y="102"
                fill="#1D4ED8"
                fontSize="10"
                textAnchor="middle"
                fontWeight="medium"
              >
                2. Authenticate & Approve
              </text>

              {/* Step 3 */}
              <path
                d="M540 160H300"
                stroke="#10B981"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                markerEnd="url(#arrow)"
              />
              <text
                x="420"
                y="152"
                fill="#047857"
                fontSize="10"
                textAnchor="middle"
                fontWeight="medium"
              >
                3. Auth Code Callback
              </text>

              {/* Step 4 */}
              <path
                d="M300 210H60"
                stroke="#10B981"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                markerEnd="url(#arrow)"
              />
              <text
                x="180"
                y="202"
                fill="#047857"
                fontSize="10"
                textAnchor="middle"
                fontWeight="medium"
              >
                4. Handle Code
              </text>

              {/* Step 5 */}
              <path d="M60 265H540" stroke="#0F172A" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <text
                x="300"
                y="257"
                fill="#0F172A"
                fontSize="10"
                textAnchor="middle"
                fontWeight="semibold"
              >
                5. POST /token (Exchange code for ID & Access Token)
              </text>
            </svg>
          </div>
        </div>
      </section>

      {/* 6. Developer Experience Section */}
      <section id="developer-experience" className="py-20 border-b border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-left space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-50 tracking-tight">
              Developer Experience
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-lg leading-relaxed">
              Simple OIDC configuration templates. Secure key exchange with standard packages.
            </p>
          </div>
          <div className="bg-slate-900 dark:bg-zinc-900 rounded-lg p-6 font-mono text-xs text-slate-300 dark:text-zinc-300 shadow-md border border-transparent dark:border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 dark:border-white/10 mb-4">
              <span className="text-[10px] text-slate-500 dark:text-zinc-500">client-integration.js</span>
            </div>
            <pre className="overflow-x-auto leading-relaxed">
              {`// Fetch authorization token details using standard fetch in JS
async function exchangeCodeForTokens(code, verifier) {
  const response = await fetch('${import.meta.env.VITE_AUTH_SERVER_URL || ''}/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'http://localhost:5174/callback',
      code_verifier: verifier,
      client_id: 'dauth_cli_sample_client'
    })
  });
  const tokens = await response.json();
  // tokens.access_token contains your secure credential
  return tokens;
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* 7. Footer Section */}
      <footer className="bg-white dark:bg-[#111827] py-12 border-t border-gray-200 dark:border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-500 dark:text-zinc-400">
          <span>&copy; 2026 DAuth Project. Designed for self-hosted developer integrations.</span>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-gray-900 dark:hover:text-zinc-100">
              Features
            </a>
            <a href="#architecture" className="hover:text-gray-900 dark:hover:text-zinc-100">
              Architecture
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
