import 'dotenv/config';

/** Reads a required setting from .env and stops the server if it is missing. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in server/.env`);
  return value;
}

/** Like required(), but tests don't need it (they use a fake mail sender). */
function requiredOutsideTests(name: string): string {
  return process.env.NODE_ENV === 'test' ? (process.env[name] ?? '') : required(name);
}

/** All server settings in one place. */
export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  // Path to the Firebase service-account key (task D7). Empty = push alerts are switched off.
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT ?? '',
  // The only web page allowed to call the API from a browser: the admin console (Phase E).
  adminWebOrigin: process.env.ADMIN_WEB_ORIGIN ?? 'http://localhost:5173',
  // Email sending (task G3): Gmail SMTP with STARTTLS on port 587.
  smtp: {
    host: requiredOutsideTests('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT ?? 587),
    user: requiredOutsideTests('SMTP_USER'),
    pass: requiredOutsideTests('SMTP_PASS'),
  },
  mailFrom: requiredOutsideTests('MAIL_FROM'),
  // Where customers reach MADD support (task G8), shown in emails and messages.
  supportEmail: 'maddwallet622@gmail.com',
};
