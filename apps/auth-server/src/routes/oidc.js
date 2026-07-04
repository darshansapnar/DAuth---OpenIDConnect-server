import { Router } from 'express';
import { OidcController } from '#controllers/oidc.js';
import { validateBearerToken } from '#validators/userinfo.js';

const router = Router();

// GET /.well-known/openid-configuration
router.get('/.well-known/openid-configuration', OidcController.discovery);

// GET /jwks
router.get('/jwks', OidcController.jwks);

// GET /authorize
router.get('/authorize', OidcController.authorize);

// POST /token
router.post('/token', OidcController.token);

// GET /userinfo
router.get('/userinfo', validateBearerToken, OidcController.userinfo);

export default router;
