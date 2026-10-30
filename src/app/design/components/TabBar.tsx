import { NavLink } from 'react-router';
import { CalendarDays, ChartLine, Dumbbell, List, Settings, type LucideIcon } from 'lucide-react';
import styles from './TabBar.module.css';

/** The five tabs, in order. Paths are the app's routes (see App.tsx). */
export const TABS: readonly { readonly path: string; readonly label: string; readonly icon: LucideIcon }[] = [
  { path: '/', label: 'Workout', icon: Dumbbell },
  { path: '/history', label: 'History', icon: CalendarDays },
  { path: '/exercises', label: 'Exercises', icon: List },
  { path: '/analytics', label: 'Analytics', icon: ChartLine },
  { path: '/settings', label: 'Settings', icon: Settings },
];

/** Bottom tab bar, above the home indicator. */
export function TabBar() {
  return (
    <nav className={styles.bar} aria-label="Tabs">
      {TABS.map(({ path, label, icon: Icon }) => (
        <NavLink key={path} to={path} end={path === '/'} className={styles.tab}>
          <Icon size={22} strokeWidth={1.75} aria-hidden />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
