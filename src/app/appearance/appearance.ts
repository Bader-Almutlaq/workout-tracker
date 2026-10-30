import { log } from '../../core/support/log';

/**
 * The owner's choice of light or dark, set in Settings. `system` follows the phone.
 * A display preference only: it lives in `localStorage`, not the database, and backups don't carry it.
 */
export type Appearance = 'system' | 'dark' | 'light';

export const APPEARANCES: readonly { readonly value: Appearance; readonly label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

const STORAGE_KEY = 'appearance';
/** Status-bar colors, matching `--color-background` in tokens.css. */
const THEME_COLOR = { dark: '#08090A', light: '#FBFBFC' } as const;

/** The saved preference, or `system` when none is saved or storage is unavailable. */
export function savedAppearance(): Appearance {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : 'system';
  } catch (error) {
    log.ui.error('Reading the appearance preference failed', error);
    return 'system';
  }
}

/** Saves the preference and applies it immediately. */
export function saveAppearance(appearance: Appearance): void {
  try {
    localStorage.setItem(STORAGE_KEY, appearance);
  } catch (error) {
    log.ui.error('Saving the appearance preference failed', error);
  }
  applyAppearance(appearance);
}

/** Sets `data-theme` on <html> (read by tokens.css) and the status-bar color. */
export function applyAppearance(appearance: Appearance): void {
  const root = document.documentElement;
  if (appearance === 'system') {
    delete root.dataset['theme'];
  } else {
    root.dataset['theme'] = appearance;
  }
  const isDark =
    appearance === 'dark' || (appearance === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', isDark ? THEME_COLOR.dark : THEME_COLOR.light);
}
