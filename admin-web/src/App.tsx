import { useEffect, useState } from 'react';
import { logout } from './api/auth';
import { endSession, whenSessionEnds } from './api/session';
import { AdminLayout } from './components/AdminLayout';
import type { AdminPage } from './components/SideNav';
import { DashboardPage } from './pages/DashboardPage';
import { FlaggedDetailPage } from './pages/FlaggedDetailPage';
import { FlaggedPage } from './pages/FlaggedPage';
import { LoginPage } from './pages/LoginPage';
import { LogsPage } from './pages/LogsPage';

/** The admin console: the login page until an admin signs in, then the admin area. */
export default function App() {
  const [adminName, setAdminName] = useState<string | null>(null);
  const [page, setPage] = useState<AdminPage>('dashboard');
  const [openEvent, setOpenEvent] = useState<number | null>(null); // a flagged event open in detail

  // If the server ends the session (30 minutes, logout, freeze), go back to the login page.
  useEffect(() => whenSessionEnds(() => setAdminName(null)), []);

  /** Ends the session on the server, then here. */
  async function onLogout() {
    await logout().catch(() => undefined); // even if the server is unreachable, forget the token here
    endSession();
  }

  if (!adminName) return <LoginPage onLoggedIn={setAdminName} />;
  return (
    <AdminLayout page={page} adminName={adminName} onSelect={(next) => { setPage(next); setOpenEvent(null); }} onLogout={onLogout}>
      {page === 'dashboard' && <DashboardPage />}
      {page === 'flagged' && openEvent === null && <FlaggedPage onOpen={setOpenEvent} />}
      {page === 'flagged' && openEvent !== null && <FlaggedDetailPage id={openEvent} onBack={() => setOpenEvent(null)} />}
      {page === 'logs' && <LogsPage />}
    </AdminLayout>
  );
}
