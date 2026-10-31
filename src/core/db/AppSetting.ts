import type { Database } from './Database';

/** Every key stored in the `appSetting` table, so all stored settings are listed in one place. */
export const AppSettingKey = {
  /** The library `version` last seeded into the database. */
  /** The id of the active plan, when selected. */
  activePlanId: 'activePlanId',
  seededLibraryVersion: 'seededLibraryVersion',
  /** UTC ISO time of the last backup the owner completed on this phone. Kept across restores. */
  lastBackupAt: 'lastBackupAt',
} as const;

/** A key of the `appSetting` table: one of the values of `AppSettingKey`. */
export type AppSettingKeyName = (typeof AppSettingKey)[keyof typeof AppSettingKey];

/** The stored value for `key`, or `undefined` if it was never set. */
export function getSetting(db: Database, key: AppSettingKeyName): string | undefined {
  return db.value<string>('SELECT value FROM appSetting WHERE key = ?', [key]);
}

/** Stores `value` for `key`, replacing any previous one. */
export function setSetting(db: Database, key: AppSettingKeyName, value: string): void {
  db.run('INSERT INTO appSetting (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [
    key,
    value,
  ]);
}
