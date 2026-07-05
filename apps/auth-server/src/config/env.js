import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const requiredEnv = ['DATABASE_URL', 'SESSION_SECRET'];

for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    console.error(`[ERROR] Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  DASHBOARD_URL: process.env.DASHBOARD_URL || 'http://localhost:5173',
  SAMPLE_CLIENT_URL: process.env.SAMPLE_CLIENT_URL || 'http://localhost:5174',
};
