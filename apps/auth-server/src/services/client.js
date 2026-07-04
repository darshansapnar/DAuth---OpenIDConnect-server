import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { ClientRepository } from '#repositories/client.js';

/**
 * Business logic layer for OAuth/OIDC client profiles.
 */
export class ClientService {
  /**
   * Generates a cryptographically secure client secret token.
   */
  static generateSecret() {
    return `dauth_sec_${crypto.randomBytes(24).toString('hex')}`;
  }

  /**
   * Hashes a raw secret string using bcrypt.
   */
  static async hashSecret(secret) {
    const saltRounds = 12;
    return bcrypt.hash(secret, saltRounds);
  }

  /**
   * Retrieves all clients list.
   */
  static async getAllClients() {
    const clients = await ClientRepository.findAll();
    // Scrub secret hashes from listings
    return clients.map((c) => {
      const clean = { ...c };
      delete clean.clientSecret;
      return clean;
    });
  }

  /**
   * Retrieves a client by ID.
   */
  static async getClientById(id) {
    const client = await ClientRepository.findById(id);
    if (!client) {
      const error = new Error('OAuth Client not found.');
      error.status = 404;
      error.name = 'NotFoundError';
      throw error;
    }
    const cleanClient = { ...client };
    delete cleanClient.clientSecret;
    return cleanClient;
  }

  /**
   * Registers a new OAuth Client.
   */
  static async createClient({ name, redirectUris, allowedScopes }) {
    const rawSecret = this.generateSecret();
    const hash = await this.hashSecret(rawSecret);

    const client = await ClientRepository.create({
      name,
      clientSecretHash: hash,
      redirectUris,
      allowedScopes,
    });

    const cleanClient = { ...client };
    delete cleanClient.clientSecret;

    // Return the plaintext secret ONLY ONCE on creation
    return {
      ...cleanClient,
      clientSecret: rawSecret,
    };
  }

  /**
   * Updates an existing client details (Redirect URIs and Scopes).
   */
  static async updateClient(id, { name, redirectUris, allowedScopes }) {
    // Verify client exists
    await this.getClientById(id);

    const client = await ClientRepository.update(id, {
      name,
      redirectUris,
      allowedScopes,
    });

    const cleanClient = { ...client };
    delete cleanClient.clientSecret;
    return cleanClient;
  }

  /**
   * Regenerates a new client secret (rotating old credentials).
   */
  static async rotateClientSecret(id) {
    // Verify client exists
    await this.getClientById(id);

    const rawSecret = this.generateSecret();
    const hash = await this.hashSecret(rawSecret);

    await ClientRepository.updateSecret(id, hash);

    return {
      clientId: id,
      clientSecret: rawSecret,
    };
  }

  /**
   * Deletes a client profile.
   */
  static async deleteClient(id) {
    await this.getClientById(id);
    await ClientRepository.delete(id);
    return { success: true };
  }
}
