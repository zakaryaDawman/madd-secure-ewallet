import express from 'express';
import helmet from 'helmet';
import { healthRouter } from './routes/health';

/** Builds the Express app with security headers, JSON parsing and all routes. */
export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));
  app.use(logRequests);
  app.use('/health', healthRouter);
  return app;
}

/** Prints every request to the terminal, e.g. "GET /health 200 4ms". */
function logRequests(req: express.Request, res: express.Response, next: express.NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
    }
  });
  next();
}
