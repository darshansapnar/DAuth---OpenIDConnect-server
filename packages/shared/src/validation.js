/**
 * Validates whether the given string is a valid email address.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength (min 8 chars, at least one letter and one number)
 * @param {string} password
 * @returns {boolean}
 */
export function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}

/**
 * Validates whether the given string is a valid HTTPS or HTTP localhost URL.
 * @param {string} urlString
 * @returns {boolean}
 */
export function isValidRedirectUri(urlString) {
  try {
    const url = new URL(urlString);
    if (url.protocol === 'https:') return true;
    if (url.protocol === 'http:' && url.hostname === 'localhost') return true;
    return false;
  } catch {
    return false;
  }
}
