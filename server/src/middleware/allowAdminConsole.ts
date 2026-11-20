import type { NextFunction, Request, Response } from 'express';
import { config } from '../config';

/**
 * CORS: lets the admin web console (and only it) call the API from a browser. Browsers block a web page from reading
 * another site's API unless the API says that page is allowed; any other website gets no permission headers.
 * The phone app is not a browser, so this does not affect it.
 */
export function allowAdminConsole(req: Request, res: Response, next: NextFunction) {
  if (req.header('origin') === config.adminWebOrigin) {
    res.setHeader('Access-Control-Allow-Origin', config.adminWebOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH');
  }
  // The browser's "may I?" check before the real request.
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
}
