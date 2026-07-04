import app from './app.js';
import { env } from '#config/env.js';

const port = env.PORT;

app.listen(port, () => {
  console.log(`[SERVER] DAuth Auth Server listening on port ${port} in ${env.NODE_ENV} mode.`);
  console.log(`[SERVER] Health endpoint: http://localhost:${port}/api/health`);
});
