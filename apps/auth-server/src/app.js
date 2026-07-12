import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { env } from '#config/env.js';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { prisma } from '#config/db.js';
import router from '#routes/index.js';
import oidcRouter from './routes/oidc.js';
import loginRouter from './routes/login.js';
import consentRouter from './routes/consent.js';
import registerRouter from './routes/register.js';
import federationRouter from './routes/federation.js';

import { requestLogger } from './middleware/logger.js';
import { csrfProtection } from './middleware/csrf.js';

const app = express();

// Enable trusting reverse proxies (Render, AWS ALB, etc.) to allow secure session cookies
app.set('trust proxy', 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ignore browser favicon requests to keep logs clean
app.get('/favicon.ico', (req, res) => res.status(204).end());

// 1. Structured Logging Middleware (auditing access requests)
app.use(requestLogger);

// 2. Helmet HTTP Security Headers (mitigates XSS, MIME sniffing, Clickjacking)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https://lh3.googleusercontent.com", "https://*.google.com"],
        connectSrc: ["'self'", "*"], // Allow fetch connections to federated servers and OIDC endpoints
        formAction: ["'self'", "*"], // Allow form redirection to OIDC client callback URIs
      },
    },
  })
);

// 3. Express Rate Limiting (mitigates brute-force and DoS)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // Limit registration and login attempts to 15 per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

app.use(generalLimiter);
app.use('/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);

// 4. Strict CORS Configuration (removes wildcard CORS with credentials)
const allowedOrigins = env.ALLOWED_ORIGINS.split(',');

app.use(
  cors({
    origin: (origin, callback) => {
      if (env.NODE_ENV !== 'production') {
        console.log('[DEBUG] CORS Check:', { origin, allowedOrigins });
      }
      // Allow non-browser agents (Curl, server-to-server OIDC token query), Same-Origin/Redirect 'null' origins, or matching origins
      if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy. Origin not allowed.'));
      }
    },
    credentials: true,
  })
);

// 5. Request Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6. Cookie Parser & Session Configuration
app.use(cookieParser(env.SESSION_SECRET));
app.use(
  session({
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdFunction: undefined,
      dbRecordIdIsSessionId: true,
      sessionModelName: 'expressSession',
    }),
    name: 'dauth_sid',
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    },
  })
);

// 7. Custom CSRF Protection Middleware (Double-Submit Cookie Pattern)
app.use(csrfProtection);

// 8. Mount root-level portals (OIDC handshake and self-hosted Sign-In)
app.use(oidcRouter);
app.use(loginRouter);
app.use(consentRouter);
app.use(registerRouter);
app.use(federationRouter);

// 9. Mount main API routes
app.use('/api', router);

// Temporary diagnostics endpoint for static file resolution
app.get('/api/debug-static', (req, res) => {
  const dir = path.join(__dirname, '../../dashboard/dist');
  try {
    const exists = fs.existsSync(dir);
    const contents = exists ? fs.readdirSync(dir) : [];
    const assetsExists = fs.existsSync(path.join(dir, 'assets'));
    const assets = assetsExists ? fs.readdirSync(path.join(dir, 'assets')) : [];
    res.json({
      success: true,
      cwd: process.cwd(),
      __dirname,
      resolvedPath: dir,
      dirExists: exists,
      contents,
      assetsExists,
      assets,
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message,
      stack: err.stack,
    });
  }
});

// In-memory diagnostics error log
global.recentErrors = global.recentErrors || [];

app.get('/api/debug-errors', (req, res) => {
  res.json({
    success: true,
    errors: global.recentErrors,
  });
});

// Serve Dashboard static files in production
if (env.NODE_ENV === 'production') {
  const dashboardDistPath = path.join(__dirname, '../../dashboard/dist');

  // Serve static assets
  app.use('/dashboard', express.static(dashboardDistPath));

  // Redirect root '/' to '/dashboard' for smoother landing
  app.get('/', (req, res) => {
    res.redirect('/dashboard');
  });

  // Client-side React routing fallback for subpages
  app.get('/dashboard/*', (req, res) => {
    res.sendFile(path.join(dashboardDistPath, 'index.html'));
  });
}

// Catch-all 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: 'The requested resource could not be found.',
  });
});



// Global error handling middleware (Exposes internal stack traces for diagnostics)
app.use((err, _req, res, _next) => {
  console.error('[ERROR] Unhandled Exception:', err);

  const errorDetail = {
    timestamp: new Date().toISOString(),
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: _req.url,
    method: _req.method,
    headers: _req.headers,
  };
  global.recentErrors.unshift(errorDetail);
  if (global.recentErrors.length > 20) {
    global.recentErrors.pop();
  }

  const status = err.status || 500;
  const message = err.message;

  res.status(status).json({
    error: err.name || 'InternalServerError',
    message,
    stack: err.stack,
  });
});

export default app;
