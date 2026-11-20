import { useState, type FormEvent } from 'react';
import { login, logout } from '../api/auth';
import { ApiError } from '../api/client';
import { startSession } from '../api/session';
import styles from './LoginPage.module.css';

/**
 * Staff sign-in for the admin console. Uses the same /auth/login as the app (same R4 sign-in lock).
 * A customer account is turned away here, and the server refuses customers on every /admin route anyway.
 */
export function LoginPage({ onLoggedIn }: { onLoggedIn: (fullName: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  /** Sends the details; only an admin account gets in. */
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      const reply = await login(email.trim(), password);
      startSession(reply.token);
      if (reply.user.role !== 'admin') {
        await logout(); // a customer's session must not stay open in the console
        setError('This console is for MADD staff only.');
        return;
      }
      onLoggedIn(reply.user.fullName);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setPassword('');
      setSending(false);
    }
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit}>
        <p className={styles.eyebrow}>MADD ADMIN</p>
        <h1 className={styles.title}>Staff sign-in</h1>
        {error && <p className={styles.error}>{error}</p>}
        <label className={styles.label}>
          Email
          <input className={styles.input} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className={styles.label}>
          Password
          <input className={styles.input} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className={styles.button} type="submit" disabled={sending}>
          {sending ? 'Signing in…' : 'Sign in'}
        </button>
        <p className={styles.note}>You will be signed out when you close or refresh this page.</p>
      </form>
    </main>
  );
}
