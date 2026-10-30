/** Areas of the app, used to tag log lines (see `AGENTS.md` → Logging). */
export type LogCategory = 'database' | 'backup' | 'import' | 'analytics' | 'ui';

/** A logger for one category. */
export interface CategoryLogger {
  info(message: string): void;
  error(message: string, error?: unknown): void;
}

/** Writes through the platform console, which exists in browsers, workers and Node. */
declare const console: {
  info(...data: unknown[]): void;
  error(...data: unknown[]): void;
};

function categoryLogger(category: LogCategory): CategoryLogger {
  const prefix = `[workouttracker.${category}]`;
  return {
    info: (message) => console.info(prefix, message),
    error: (message, error) => console.error(prefix, message, error ?? ''),
  };
}

/**
 * The only logger. Use `log.<category>.info(…)` / `.error(…)`; never call `console` directly.
 * Errors are logged *and* surfaced to the owner; logging alone is not handling.
 */
export const log: Readonly<Record<LogCategory, CategoryLogger>> = {
  database: categoryLogger('database'),
  backup: categoryLogger('backup'),
  import: categoryLogger('import'),
  analytics: categoryLogger('analytics'),
  ui: categoryLogger('ui'),
};
