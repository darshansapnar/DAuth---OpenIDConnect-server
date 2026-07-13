import { generateCodeVerifier, generateCodeChallenge, decodeJwt, DAuthConfigurationError, DAuthAuthenticationError } from './utils.js';

export class DAuthClient {
  constructor(config) {
    if (!config.issuer) {
      throw new DAuthConfigurationError('OIDC "issuer" configuration option is required.');
    }
    if (!config.clientId) {
      throw new DAuthConfigurationError('OIDC "clientId" configuration option is required.');
    }
    if (!config.redirectUri) {
      throw new DAuthConfigurationError('OIDC "redirectUri" configuration option is required.');
    }

    this.issuer = config.issuer;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret; // Optional client secret for public/confidential client workflows
    this.redirectUri = config.redirectUri;
    this.scope = config.scope || 'openid profile email';
    this.endpoints = null; // Caches dynamically loaded discovery endpoints

    // Configurable Storage strategy (must implement getItem, setItem, and removeItem)
    this.storage = config.storage || (typeof window !== 'undefined' ? window.localStorage : null);
  }

  // Helper to ensure storage is available before operations
  getStorage() {
    if (!this.storage) {
      throw new DAuthConfigurationError('No storage strategy configured and window.localStorage is unavailable.');
    }
    return this.storage;
  }

  // Query /.well-known/openid-configuration to discover endpoints dynamically
  async getEndpoints() {
    if (this.endpoints) return this.endpoints;

    try {
      const response = await fetch(`${this.issuer}/.well-known/openid-configuration`);
      if (!response.ok) {
        throw new DAuthConfigurationError(`Failed to retrieve OIDC discovery endpoints from ${this.issuer}. HTTP Status: ${response.status}`);
      }
      const data = await response.json();
      
      this.endpoints = {
        authorization: data.authorization_endpoint,
        token: data.token_endpoint,
        userinfo: data.userinfo_endpoint,
        logout: data.end_session_endpoint || `${this.issuer}/logout`,
      };
      return this.endpoints;
    } catch (err) {
      if (err instanceof DAuthConfigurationError) throw err;
      console.warn('[DAUTH-SDK] OIDC Discovery failed, using fallback standard endpoints:', err);
      
      // Fallback endpoints matching standard DAuth path layouts
      this.endpoints = {
        authorization: `${this.issuer}/authorize`,
        token: `${this.issuer}/token`,
        userinfo: `${this.issuer}/userinfo`,
        logout: `${this.issuer}/logout`,
      };
      return this.endpoints;
    }
  }

  // 1. Initiate OIDC Authorization Flow (redirects browser to authorize endpoint)
  async loginWithRedirect() {
    if (typeof window === 'undefined') return;

    const storage = this.getStorage();

    // Generate secure state parameter
    const array = new Uint8Array(16);
    if (window.crypto) {
      window.crypto.getRandomValues(array);
    }
    const state = Array.from(array, (dec) => dec.toString(16).padStart(2, '0')).join('');
    storage.setItem('dauth_oauth_state', state);

    // PKCE parameters generation
    const verifier = generateCodeVerifier();
    storage.setItem('dauth_oauth_verifier', verifier);
    const challenge = await generateCodeChallenge(verifier);

    // Resolve OIDC endpoints dynamically
    const endpoints = await this.getEndpoints();

    // Build OIDC authorization request URL with PKCE params
    const authUrl = new URL(endpoints.authorization);
    authUrl.searchParams.append('client_id', this.clientId);
    authUrl.searchParams.append('redirect_uri', this.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', this.scope);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', challenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    // Redirect browser to DAuth Authorization Server
    window.location.href = authUrl.toString();
  }

  // 2. Process OIDC redirect callback and token exchange
  async handleRedirectCallback() {
    if (typeof window === 'undefined') return null;

    const storage = this.getStorage();

    // Return active session directly if handshake was already completed
    const cachedSession = this.getSession();
    if (cachedSession) {
      return cachedSession;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const urlError = searchParams.get('error');
    const urlErrorDescription = searchParams.get('error_description');

    if (urlError) {
      throw new DAuthAuthenticationError(urlErrorDescription || `Authentication error: ${urlError}`);
    }

    if (!code || !state) {
      throw new DAuthAuthenticationError('Missing required OIDC response parameters (code, state).');
    }

    const cachedState = storage.getItem('dauth_oauth_state');
    const verifier = storage.getItem('dauth_oauth_verifier');

    if (!cachedState || cachedState !== state) {
      throw new DAuthAuthenticationError('Security validation failed: State parameter mismatch (CSRF threat detected).');
    }

    try {
      // Resolve OIDC endpoints dynamically
      const endpoints = await this.getEndpoints();

      // Exchange code for Access & ID tokens
      const tokenPayload = {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        code_verifier: verifier || '',
      };

      if (this.clientSecret) {
        tokenPayload.client_secret = this.clientSecret;
      }

      const tokenResponse = await fetch(endpoints.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenPayload),
      });

      if (!tokenResponse.ok) {
        const errData = await tokenResponse.json().catch(() => ({}));
        throw new DAuthAuthenticationError(errData.error_description || `Token exchange returned HTTP status ${tokenResponse.status}`);
      }

      const tokens = await tokenResponse.json();

      // Query UserInfo profile using Access Token
      const userInfoResponse = await fetch(endpoints.userinfo, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new DAuthAuthenticationError(`UserInfo query returned HTTP status ${userInfoResponse.status}`);
      }

      const userInfo = await userInfoResponse.json();

      // Store session and clean up temporary verifier storage
      const session = {
        tokens,
        userInfo,
      };
      storage.setItem('dauth_session', JSON.stringify(session));
      storage.removeItem('dauth_oauth_state');
      storage.removeItem('dauth_oauth_verifier');

      return session;
    } catch (err) {
      console.error('[DAUTH-SDK] Error during redirect callback processing:', err);
      throw err;
    }
  }

  // 3. User & Session profile getters
  getUser() {
    const session = this.getSession();
    return session ? session.userInfo : null;
  }

  // 4. Token getters
  getTokens() {
    const session = this.getSession();
    return session ? session.tokens : null;
  }

  // Helper to check if a JWT is expired
  isTokenExpired(token) {
    if (!token) return true;
    const claims = decodeJwt(token);
    if (!claims || !claims.exp) return true;

    // Add 60-second clock skew buffer for network safety
    const bufferSeconds = 60;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return (claims.exp - bufferSeconds) < nowSeconds;
  }

  // Exchanges refresh token for a new access token
  async refreshAccessToken() {
    const tokens = this.getTokens();
    if (!tokens || !tokens.refresh_token) {
      throw new DAuthAuthenticationError('No active refresh token available.');
    }

    try {
      const endpoints = await this.getEndpoints();
      const payload = {
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
        client_id: this.clientId,
      };

      if (this.clientSecret) {
        payload.client_secret = this.clientSecret;
      }

      const response = await fetch(endpoints.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new DAuthAuthenticationError(errData.error_description || `Token refresh failed with HTTP status ${response.status}`);
      }

      const newTokens = await response.json();
      const session = this.getSession() || {};
      
      // Update tokens inside cache
      session.tokens = {
        ...tokens,
        ...newTokens,
      };
      
      const storage = this.getStorage();
      storage.setItem('dauth_session', JSON.stringify(session));

      return session.tokens.access_token;
    } catch (err) {
      console.error('[DAUTH-SDK] Failed to refresh access token:', err);
      // Evict invalid session keys on error
      try {
        const storage = this.getStorage();
        storage.removeItem('dauth_session');
      } catch {
        // Safe check fallback for read-only environments
      }
      throw err;
    }
  }

  // 5. Access token getter (automatically refreshes if expired and refresh_token is present)
  async getAccessToken() {
    const tokens = this.getTokens();
    if (!tokens) return null;

    if (this.isTokenExpired(tokens.access_token) && tokens.refresh_token) {
      try {
        return await this.refreshAccessToken();
      } catch (err) {
        console.warn('[DAUTH-SDK] Automatic token refresh failed on validation check:', err);
        return null;
      }
    }

    return tokens.access_token;
  }

  // 6. Decoded ID Token claims getter
  getIdTokenClaims() {
    const tokens = this.getTokens();
    return tokens && tokens.id_token ? decodeJwt(tokens.id_token) : null;
  }

  // 7. Check if user has active session
  isAuthenticated() {
    return !!this.getUser();
  }

  // 8. Load active session configuration
  getSession() {
    if (typeof window === 'undefined') return null;
    try {
      const storage = this.getStorage();
      const stored = storage.getItem('dauth_session');
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      try {
        const storage = this.getStorage();
        storage.removeItem('dauth_session');
      } catch {
        // Safe check fallback for read-only environments
      }
      return null;
    }
  }

  // 9. Process logout and redirect to backend logout endpoint
  async logout() {
    if (typeof window === 'undefined') return;

    try {
      const storage = this.getStorage();
      storage.removeItem('dauth_session');
    } catch {
      // Safe check fallback for read-only environments
    }

    const endpoints = await this.getEndpoints();
    const logoutUrl = new URL(endpoints.logout);
    logoutUrl.searchParams.append('post_logout_redirect_uri', window.location.origin + '/');
    window.location.href = logoutUrl.toString();
  }
}
