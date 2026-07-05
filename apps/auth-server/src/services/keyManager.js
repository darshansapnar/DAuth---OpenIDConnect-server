import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEYS_DIR = path.resolve(__dirname, '..', '..', 'keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.pem');

let privateKey = null;
let publicKey = null;

/**
 * KeyManagerService handles automatic RSA key generation and file system persistence.
 */
export class KeyManagerService {
  /**
   * Initializes RSA keypair. Automatically generates a 2048-bit pair if missing.
   * Terminates the process if key pair creation or write fails.
   */
  static initialize() {
    if (privateKey && publicKey) return;

    try {
      // 1. Create keys directory if it doesn't exist
      if (!fs.existsSync(KEYS_DIR)) {
        fs.mkdirSync(KEYS_DIR, { recursive: true });
      }

      const privateKeyExists = fs.existsSync(PRIVATE_KEY_PATH);
      const publicKeyExists = fs.existsSync(PUBLIC_KEY_PATH);

      if (privateKeyExists && publicKeyExists) {
        // 2. Load existing keys from disk
        privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
        publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
        console.log('[SERVER] Loaded existing RSA signing keys.');
      } else {
        // 3. Generate new 2048-bit RSA keypair
        const { privateKey: genPrivate, publicKey: genPublic } = crypto.generateKeyPairSync('rsa', {
          modulusLength: 2048,
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
          },
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
          },
        });

        // 4. Save to files
        fs.writeFileSync(PRIVATE_KEY_PATH, genPrivate, 'utf8');
        fs.writeFileSync(PUBLIC_KEY_PATH, genPublic, 'utf8');

        privateKey = genPrivate;
        publicKey = genPublic;
        console.log('[SERVER] Generated new RSA signing keys.');
      }
    } catch (err) {
      console.error('[FATAL] Failed to initialize RSA keys:', err.message);
      process.exit(1);
    }
  }

  /**
   * Returns PEM private key for signature signing.
   * @returns {string}
   */
  static getPrivateKey() {
    if (!privateKey) {
      KeyManagerService.initialize();
    }
    return privateKey;
  }

  /**
   * Returns PEM public key for signature verification.
   * @returns {string}
   */
  static getPublicKey() {
    if (!publicKey) {
      KeyManagerService.initialize();
    }
    return publicKey;
  }
}
