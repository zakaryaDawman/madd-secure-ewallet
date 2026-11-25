import { useEffect, useState } from 'react';
import { addUser, getUsers, type UserFilter, type UserList } from '../api/admin';
import { ApiError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { SearchBox } from '../components/SearchBox';
import { UserFilterChips } from '../components/UserFilterChips';
import { UserRow } from '../components/UserRow';
import { UserFormDialog } from '../components/UserFormDialog';
import styles from './UsersPage.module.css';

/** "Users" (design 24): every customer, searchable by name, email or phone, filtered by Frozen / Locked, plus Add user (G10). */
export function UsersPage({ onOpen }: { onOpen: (id: number) => void }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const [list, setList] = useState<UserList | null>(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  // Load again whenever the search or the filter changes.
  useEffect(() => {
    let current = true;
    getUsers(search, filter)
      .then((data) => {
        if (!current) return;
        setList(data);
        setError('');
      })
      .catch((err) => current && setError(err instanceof ApiError ? err.message : 'Could not load users.'));
    return () => {
      current = false;
    };
  }, [search, filter]);

  return (
    <>
      <PageHeader title="Users" aside={
          <div className={styles.aside}>
            {list && <span className={styles.total}>{list.counts.total} total</span>}
            <button className={styles.add} onClick={() => setAdding(true)}>
              + Add user
            </button>
          </div>
        }
      >
        <SearchBox placeholder="Search name, email or phone" onSearch={setSearch} />
        <UserFilterChips filter={filter} counts={list?.counts ?? { frozen: 0, locked: 0 }} onChange={setFilter} />
      </PageHeader>
      <div className={styles.list}>
        {error && <p className={styles.error}>{error}</p>}
        {!list && !error && <p className={styles.status}>Loading…</p>}
        {list?.users.length === 0 && <p className={styles.status}>No customers match.</p>}
        {list?.users.map((user) => (
          <UserRow key={user.id} user={user} onOpen={() => onOpen(user.id)} />
        ))}
      </div>
      {adding && (
        <UserFormDialog
          title="Add a customer"
          initial={{ fullName: '', email: '', phone: '' }}
          needsReason={false}
          confirmLabel="Add and send invite"
          note="The wallet starts at RM 0.00. The customer gets an email code and sets their own password and PIN; you never see them."
          onConfirm={async (details) => {
            const { userId } = await addUser(details);
            onOpen(userId);
          }}
          onDone={() => setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      )}
    </>
  );
}
