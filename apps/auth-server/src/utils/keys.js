import crypto from 'crypto';
import * as jose from 'jose';

// Programmatically generate RSA 2048 keypair in memory during startup
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

const KEY_ID = 'dauth_rsa_active_key';

/**
 * Signs a JWT payload using RS256 with the persistent private key.
 *
 * @param {Object} claims
 * @param {string} subject
 * @param {string} audience
 * @param {string} [expiry='1h']
 * @returns {Promise<string>} Signed JWT string
 */
export async function signJwt(claims, subject, audience, expiry = '1h') {
  return new jose.SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: KEY_ID })
    .setIssuer('http://localhost:3001')
    .setSubject(subject)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(privateKey);
}

/**
 * Exports the active public key as JSON Web Key (JWK).
 */
export async function getActiveJwk() {
  const jwk = await jose.exportJWK(publicKey);
  return {
    kid: KEY_ID,
    alg: 'RS256',
    use: 'sig',
    kty: 'RSA',
    ...jwk,
  };
}

/**
 * Verifies a JWT signature, issuer, and expiration time using the public key.
 *
 * @param {string} token
 * @returns {Promise<Object>} The verified JWT payload
 */
export async function verifyJwt(token) {
  const { payload } = await jose.jwtVerify(token, publicKey, {
    issuer: 'http://localhost:3001',
  });
  return payload;
}
