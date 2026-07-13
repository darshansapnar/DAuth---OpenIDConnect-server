// Generates a high-entropy cryptographically random verifier string
export function generateCodeVerifier() {
  const array = new Uint8Array(43); // Min required length is 43 characters
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  }
  return Array.from(array, (dec) => dec.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 128); // Standardize verifier length
}

// Generates an S256 Base64URL-encoded code challenge from the verifier
export async function generateCodeChallenge(verifier) {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Cryptography API is not supported in this browser context.');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Decodes OIDC ID token JWT payloads on the client side
export function decodeJwt(token) {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('[DAUTH-SDK] Failed to decode ID Token JWT:', e);
    return null;
  }
}

export class DAuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'DAuthError';
    this.code = code;
  }
}

export class DAuthConfigurationError extends DAuthError {
  constructor(message) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'DAuthConfigurationError';
  }
}

export class DAuthAuthenticationError extends DAuthError {
  constructor(message) {
    super(message, 'AUTHENTICATION_ERROR');
    this.name = 'DAuthAuthenticationError';
  }
}
