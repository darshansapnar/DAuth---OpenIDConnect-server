import app from './app.js';
import { env } from '#config/env.js';
import { KeyManagerService } from '#services/keyManager.js';

// Initialize cryptographic keys before server listening
KeyManagerService.initialize();

const port = env.PORT;

app.listen(port, '127.0.0.1', () => {
  console.log(`[SERVER] DAuth Auth Server listening on port ${port} in ${env.NODE_ENV} mode.`);
  console.log(`[SERVER] Health endpoint: http://localhost:${port}/api/health`);
});
