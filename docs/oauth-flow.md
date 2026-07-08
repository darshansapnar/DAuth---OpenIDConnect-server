# OAuth 2.0 vs OpenID Connect in DAuth

While these two terms are often used interchangeably, they serve fundamentally different purposes in modern web security. DAuth implements **both**.

## OAuth 2.0 (Authorization)

OAuth 2.0 is an authorization framework designed to grant third-party applications limited access to an HTTP service without sharing the user's credentials. 

* **The Problem it Solves:** "How can I let the Sample Client read my profile data without giving the Sample Client my password?"
* **The Solution:** DAuth provides an **Access Token** to the Sample Client. The Sample Client uses this token in the `Authorization: Bearer <token>` header to fetch data from protected APIs.
* **Key Artifacts:** Access Token, Refresh Token, Scopes.

## OpenID Connect (Authentication)

OpenID Connect (OIDC) is an identity layer built *on top* of the OAuth 2.0 framework. While OAuth 2.0 is purely for delegating access, OIDC is designed to answer the question, "Who is the user?"

* **The Problem it Solves:** "How does the Sample Client know who just logged in, and how do they verify it?"
* **The Solution:** Alongside the Access Token, DAuth issues an **ID Token** (a signed JWT). This token contains verifiable claims about the user (e.g., `sub`, `email`, `name`). 
* **Key Artifacts:** ID Token, UserInfo Endpoint, Discovery Document (`/.well-known/openid-configuration`), JWKS endpoint.

---

## Why DAuth Requires PKCE

Proof Key for Code Exchange (PKCE) is an extension originally designed for mobile applications but is now the standard recommendation for all Single-Page Applications (SPAs). 

Instead of relying on a static `client_secret` (which SPAs cannot securely hide in the browser), the client dynamically generates a cryptographic puzzle (`code_verifier`) and sends the hash of it (`code_challenge`) during the initial authorization request. When the client later exchanges the Authorization Code for tokens, it must provide the original `code_verifier`. 

This guarantees that even if a malicious actor intercepts the Authorization Code, they cannot exchange it without the original verifier.
