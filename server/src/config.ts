import 'dotenv/config';

/** Reads a required setting from .env and stops the server if it is missing. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in server/.env`);
  return value;
}

/** All server settings in one place. */
export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  // Path to the Firebase service-account key (task D7). Empty = push alerts are switched off.
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT ?? '',
};
