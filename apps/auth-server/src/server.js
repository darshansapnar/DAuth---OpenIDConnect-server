import app from './app.js';
import { env } from '#config/env.js';
import { KeyManagerService } from '#services/keyManager.js';

// Initialize cryptographic keys before server listening
KeyManagerService.initialize();

const port = env.PORT;

const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.log(`[SERVER] DAuth Auth Server listening on ${host}:${port} in ${env.NODE_ENV} mode.`);
  console.log(`[SERVER] Health endpoint: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/api/health`);
});

