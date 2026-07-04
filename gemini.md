# DAuth AI Development Instructions

## Project Overview

DAuth is a self-hosted OpenID Connect (OIDC) Identity Provider built from scratch for learning and portfolio purposes.

The objective is to build a production-inspired authentication server similar in concept to Clerk, Auth0, or Keycloak while keeping the codebase understandable and well documented.

This project prioritizes:

- Clean Architecture
- Security
- Maintainability
- Scalability
- Developer Experience

Every implementation should resemble production software rather than tutorial code.

---

# Tech Stack

Frontend

- React
- Vite
- Tailwind CSS
- React Router
- React Hook Form

Backend

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- jose
- bcrypt
- express-session
- cookie-parser

Language

- JavaScript (ES Modules)
- Do NOT generate TypeScript.

---

# Project Structure

Prefer a modular architecture.

Example:

apps/
dashboard/
auth-server/
sample-client/

packages/
ui/
shared/

Each feature should remain independent.

---

# Architecture

Follow this layering:

Routes
↓

Controllers
↓

Services
↓

Repositories

↓

Database

Business logic must never exist inside route files.

Database queries should remain inside repository classes/functions whenever practical.

---

# Code Quality

Always generate code that is:

- Modular
- Readable
- Maintainable
- Well organized

Prefer many small files over one large file.

Avoid files exceeding approximately 300 lines unless necessary.

---

# Coding Style

Use

- async/await
- ES Modules
- Descriptive variable names
- Named exports when appropriate
- Consistent formatting

Avoid

- callback hell
- nested ternary operators
- unnecessary abstractions
- duplicated logic

---

# Security

Always follow secure practices.

Passwords

- Hash using bcrypt.

Authentication

- Use secure HTTP-only cookies for sessions where appropriate.
- Never expose secrets to the frontend.

JWT

- Sign using RS256.
- Use jose.

Validation

- Validate every request.
- Never trust client input.

Errors

- Never leak stack traces or sensitive information.

---

# API Design

RESTful naming.

Examples

POST /login

POST /register

GET /userinfo

POST /token

GET /authorize

GET /.well-known/openid-configuration

GET /jwks

Return proper HTTP status codes.

Return consistent JSON responses.

---

# Database

Use Prisma.

Create clear models.

Avoid duplicate fields.

Use relations whenever appropriate.

---

# Frontend Principles

Build interfaces that are:

- Fast
- Accessible
- Responsive
- Clean

Favor usability over visual effects.

Use reusable components.

---

# Documentation

Every significant module should contain concise comments explaining why it exists.

Complex authentication flows should include diagrams or markdown documentation where useful.

---

# Testing

Generate code that is testable.

Avoid tightly coupled modules.

---

# Dependencies

Only introduce new packages when there is a clear technical benefit.

Avoid unnecessary dependencies.

---

# When Building Features

Always:

1. Explain the implementation plan.
2. Build incrementally.
3. Keep backward compatibility.
4. Refactor when duplication appears.
5. Keep naming consistent.

---

# OIDC Goal

Eventually support:

- Authorization Code Flow
- PKCE
- Refresh Tokens
- ID Tokens
- Access Tokens
- UserInfo Endpoint
- Discovery Endpoint
- JWKS
- Client Registration
- Session Management
- Consent Screen

Implement these progressively.

Do not generate placeholder implementations.

Every feature should be functional.
