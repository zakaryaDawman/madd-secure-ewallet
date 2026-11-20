import express from 'express';
import helmet from 'helmet';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { walletRouter } from './routes/wallet';
import { createUsersRouter } from './routes/users';
import { transfersRouter } from './routes/transfers';

/** Builds the Express app with security headers, JSON parsing and all routes. */
export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));
  app.use(logRequests);
  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/wallet', walletRouter);
  app.use('/users', createUsersRouter());
  app.use('/transfers', transfersRouter);
  app.use(handleUnexpectedError);
  return app;
}

/** Last safety net: logs the real error on the server but only tells the app "Something went wrong". */
function handleUnexpectedError(err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) {
  if (err instanceof SyntaxError) {
    res.status(400).json({ error: 'bad_json', message: 'Request body is not valid JSON' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'server', message: 'Something went wrong. Please try again.' });
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
