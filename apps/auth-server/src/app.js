import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

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
        styleSrc: ["'self'", "'unsafe-inline'"], // Required to support styled backend portals
        scriptSrc: ["'self'", "'unsafe-inline'"],
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

// Catch-all 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: 'The requested resource could not be found.',
  });
});

// Global error handling middleware (Never leaks internal stack traces)
app.use((err, _req, res, _next) => {
  console.error('[ERROR] Unhandled Exception:', err);

  const status = err.status || 500;
  const message =
    env.NODE_ENV === 'production' ? 'An unexpected internal error occurred.' : err.message;

  res.status(status).json({
    error: err.name || 'InternalServerError',
    message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

export default app;
