import { useState, type ReactNode, type FormEvent } from 'react';
import styles from './PasswordGate.module.scss';

const PASS = 'lily123';
const STORAGE_KEY = 'lilypad_auth';

export function PasswordGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === '1',
  );
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value === PASS) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      setAuthed(true);
    } else {
      setError(true);
      setValue('');
    }
  };

  if (authed) return <>{children}</>;

  return (
    <div className={styles.overlay}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Lilypad</h1>
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            autoFocus
          />
          <button className={styles.button} type="submit">
            Enter
          </button>
        </div>
        <span className={styles.error}>
          {error ? 'Incorrect password' : '\u00A0'}
        </span>
      </form>
    </div>
  );
}
