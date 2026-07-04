/**
 * Generates a random cryptographically secure string (useful for state, code verifier, etc.)
 * @param {number} length
 * @returns {string}
 */
export function generateRandomString(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomValues = new Uint32Array(length);
  globalThis.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Basic logger helper
 */
export const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${new Date().toISOString()}: ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${new Date().toISOString()}: ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${new Date().toISOString()}: ${msg}`, ...args),
};
