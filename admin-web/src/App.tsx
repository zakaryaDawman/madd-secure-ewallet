import { useEffect, useState } from 'react';
import { logout } from './api/auth';
import { endSession, whenSessionEnds } from './api/session';
import { AdminLayout } from './components/AdminLayout';
import type { AdminPage } from './components/SideNav';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

/** The admin console: the login page until an admin signs in, then the admin area. */
export default function App() {
  const [adminName, setAdminName] = useState<string | null>(null);
  const [page, setPage] = useState<AdminPage>('dashboard');

  // If the server ends the session (30 minutes, logout, freeze), go back to the login page.
  useEffect(() => whenSessionEnds(() => setAdminName(null)), []);

  /** Ends the session on the server, then here. */
  async function onLogout() {
    await logout().catch(() => undefined); // even if the server is unreachable, forget the token here
    endSession();
  }

  if (!adminName) return <LoginPage onLoggedIn={setAdminName} />;
  return (
    <AdminLayout page={page} adminName={adminName} onSelect={setPage} onLogout={onLogout}>
      {page === 'dashboard' && <DashboardPage />}
    </AdminLayout>
  );
}
