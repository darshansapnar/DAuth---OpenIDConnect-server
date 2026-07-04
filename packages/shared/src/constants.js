// OIDC scopes defined by the specification
export const OIDC_SCOPES = {
  OPENID: 'openid',
  PROFILE: 'profile',
  EMAIL: 'email',
  OFFLINE_ACCESS: 'offline_access',
};

// Standard Grant Types we eventually want to support
export const GRANT_TYPES = {
  AUTHORIZATION_CODE: 'authorization_code',
  REFRESH_TOKEN: 'refresh_token',
};

// Response Types for authorization endpoint
export const RESPONSE_TYPES = {
  CODE: 'code',
};

// Common cookie key names
export const COOKIES = {
  SESSION_ID: 'dauth_sid',
};
