import { Router } from 'express';
import { ClientController } from '#controllers/client.js';
import { validateClientInput } from '#validators/client.js';

const router = Router();

// GET /api/clients - List all clients
router.get('/', ClientController.list);

// POST /api/clients - Register a new client
router.post('/', validateClientInput, ClientController.create);

// GET /api/clients/:id - Retrieve client details
router.get('/:id', ClientController.retrieve);

// PUT /api/clients/:id - Update client config details
router.put('/:id', validateClientInput, ClientController.update);

// POST /api/clients/:id/secret - Rotate client secret credentials
router.post('/:id/secret', ClientController.rotateSecret);

// DELETE /api/clients/:id - Delete client profile
router.delete('/:id', ClientController.delete);

export default router;
