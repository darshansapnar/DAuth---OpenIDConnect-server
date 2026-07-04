/**
 * Middleware providing structured console logging for HTTP requests.
 */
export function requestLogger(req, res, next) {
  const start = Date.now();

  // Listen for the finish event to compute duration and log
  res.on('finish', () => {
    const duration = Date.now() - start;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        durationMs: duration,
        ip,
        userAgent,
      })
    );
  });

  next();
}
