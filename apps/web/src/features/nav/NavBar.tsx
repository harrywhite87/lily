import { NavLink } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';
import { navRoutes } from '../../router';
import styles from './NavBar.module.scss';

export function NavBar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className={styles.nav}>
      <NavLink to="/" className={styles.logo}>
        Lilypad
      </NavLink>
      <ul className={styles.links}>
        {navRoutes().map(({ path, label }) => (
          <li key={path}>
            <NavLink
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <button
        className={styles.themeToggle}
        onClick={toggleTheme}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>
    </nav>
  );
}
