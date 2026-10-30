import { describe, expect, test } from 'vitest';
import { AppSettingKey, getSetting, setSetting } from './AppSetting';
import { Database } from './Database';
import { migrate } from './migrations';

async function migratedDatabase(): Promise<Database> {
  const db = await Database.openInMemory();
  migrate(db);
  return db;
}

describe('AppSetting', () => {
  test('A setting that was never stored is undefined', async () => {
    const db = await migratedDatabase();
    expect(getSetting(db, AppSettingKey.seededLibraryVersion)).toBeUndefined();
  });

  test('A stored setting reads back', async () => {
    const db = await migratedDatabase();
    setSetting(db, AppSettingKey.seededLibraryVersion, '3');
    expect(getSetting(db, AppSettingKey.seededLibraryVersion)).toBe('3');
  });

  test('Storing again replaces the value and keeps one row', async () => {
    const db = await migratedDatabase();
    setSetting(db, AppSettingKey.seededLibraryVersion, '1');
    setSetting(db, AppSettingKey.seededLibraryVersion, '2');
    expect(getSetting(db, AppSettingKey.seededLibraryVersion)).toBe('2');
    expect(db.value('SELECT count(*) FROM appSetting')).toBe(1);
  });
});
