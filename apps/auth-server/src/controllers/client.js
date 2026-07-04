import { ClientService } from '#services/client.js';

/**
 * Controller handling HTTP requests relating to OAuth Client profiles.
 */
export class ClientController {
  /**
   * Lists all client profiles.
   */
  static async list(req, res, next) {
    try {
      const clients = await ClientService.getAllClients();
      res.status(200).json({ success: true, clients });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves detail of one client.
   */
  static async retrieve(req, res, next) {
    try {
      const { id } = req.params;
      const client = await ClientService.getClientById(id);
      res.status(200).json({ success: true, client });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Creates a new client profile.
   */
  static async create(req, res, next) {
    try {
      const { name, redirectUris, allowedScopes } = req.body;
      const client = await ClientService.createClient({ name, redirectUris, allowedScopes });
      res.status(201).json({
        success: true,
        message: 'OAuth Client registered successfully.',
        client,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Updates an existing client details.
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, redirectUris, allowedScopes } = req.body;
      const client = await ClientService.updateClient(id, { name, redirectUris, allowedScopes });
      res.status(200).json({
        success: true,
        message: 'OAuth Client details updated successfully.',
        client,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Rotates a client's credentials secret.
   */
  static async rotateSecret(req, res, next) {
    try {
      const { id } = req.params;
      const result = await ClientService.rotateClientSecret(id);
      res.status(200).json({
        success: true,
        message: 'Client credentials secret rotated successfully.',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Deletes a client profile.
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      await ClientService.deleteClient(id);
      res.status(200).json({
        success: true,
        message: 'OAuth Client deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}
