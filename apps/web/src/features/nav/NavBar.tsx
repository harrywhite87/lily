import { NavLink } from 'react-router-dom';
import styles from './NavBar.module.scss';

const routes = [
  { to: '/', label: 'Demo' },
  { to: '/model-loader', label: 'Model' },
  { to: '/caustics', label: 'Caustics' },
  { to: '/water', label: 'Water' },
  { to: '/blueprint', label: 'Blueprint' },
  { to: '/build', label: 'Build' },
  { to: '/particles', label: 'Particles' },
  { to: '/path-builder', label: 'Path' },
  { to: '/shipyard', label: 'Shipyard' },
  { to: '/battleboard', label: 'Battleboard' },
  { to: '/particle-clouds', label: 'Clouds' },
];

export function NavBar() {
  return (
    <nav className={styles.nav}>
      <NavLink to="/" className={styles.logo}>
        Lilypad
      </NavLink>
      <ul className={styles.links}>
        {routes.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
