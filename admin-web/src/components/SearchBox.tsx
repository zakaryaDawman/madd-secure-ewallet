import { useEffect, useState } from 'react';
import styles from './SearchBox.module.css';

const WAIT_MS = 350;

/**
 * The search box in the dark header (design 22). It waits a moment after the last key before searching,
 * so typing "zakarya" sends one request, not seven.
 */
export function SearchBox({ placeholder, onSearch }: { placeholder: string; onSearch: (text: string) => void }) {
  const [text, setText] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(text.trim()), WAIT_MS);
    return () => clearTimeout(timer);
  }, [text, onSearch]);

  return (
    <label className={styles.box}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <circle cx="11" cy="11" r="6" />
        <path d="M20 20l-4.3-4.3" />
      </svg>
      <input className={styles.input} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </label>
  );
}
