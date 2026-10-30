import { NavLink, useLocation } from 'react-router';
import { CalendarDays, ChartLine, Dumbbell, List, Settings, type LucideIcon } from 'lucide-react';
import styles from './TabBar.module.css';

/** One tab: where it goes, and the path prefix of every screen that belongs to it. */
interface Tab {
  readonly path: string;
  /** Screens under this prefix keep the tab highlighted (the Workout tab lives at `/`, its sub-screens at `/workout/…`). */
  readonly ownsPrefix: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

/** The five tabs, in order. Paths are the app's routes (see App.tsx). */
export const TABS: readonly Tab[] = [
  { path: '/', ownsPrefix: '/workout', label: 'Workout', icon: Dumbbell },
  { path: '/history', ownsPrefix: '/history', label: 'History', icon: CalendarDays },
  { path: '/exercises', ownsPrefix: '/exercises', label: 'Exercises', icon: List },
  { path: '/analytics', ownsPrefix: '/analytics', label: 'Analytics', icon: ChartLine },
  { path: '/settings', ownsPrefix: '/settings', label: 'Settings', icon: Settings },
];

/** Bottom tab bar, above the home indicator. */
export function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className={styles.bar} aria-label="Tabs">
      {TABS.map(({ path, ownsPrefix, label, icon: Icon }) => {
        const isActive = pathname === path || pathname.startsWith(ownsPrefix);
        return (
          // A function className replaces NavLink's own matching, which would light `/` on every screen.
          <NavLink key={path} to={path} className={() => (isActive ? `${styles.tab} active` : styles.tab)}>
            <Icon size={22} strokeWidth={1.75} aria-hidden />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
