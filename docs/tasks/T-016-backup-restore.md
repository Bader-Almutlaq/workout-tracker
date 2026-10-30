# T-016: Back up through the share sheet; restore with a safety snapshot

- **Milestone:** W1
- **Depends on:** none
- **Model tier:** strongest (data safety; touches the worker's store)

## Goal

One tap in Settings saves a complete copy of the database to iCloud Drive (through the iOS share sheet), and a backup file can be restored without any risk to the current data. Settings always shows when the last backup was made.

## Read first

- `docs/DATA.md` → *Backups* (the behaviour to build), `docs/DECISIONS.md` (web switch), `src/worker/OnDeviceStore.ts`, `src/core/db/Database.ts` (`exportBytes`, `fromBytes`), `src/core/db/migrations.ts` (`pendingMigrationIds` rejects newer schemas).
- Native spec for naming and validation: `reference/native/Packages/WorkoutCore/Sources/WorkoutCore/Backup/BackupFile.swift`, `BackupService.swift` (validation part only; the folder bookmark and retention don't apply on the web).

## Scope

- **Create:** `src/core/backup/BackupFile.ts` (file name for a date; parse a date from a name), `src/core/backup/BackupValidation.ts` (open bytes, reject non-SQLite, newer schema, or missing tables), `src/core/backup/BackupError.ts`, tests; `src/app/features/settings/BackupSection.tsx` (+ CSS module).
- **Edit:** `OnDeviceStore.ts` (add `restore(bytes)`: validate → snapshot → close → replace → reopen → migrate), `WorkerApi.ts` (`exportBackup()`, `restoreBackup(bytes)`, `lastBackupAt()`; block `// Backup (T-016)`), `SettingsScreen.tsx` (add the section), `AppSetting` key `lastBackupAt` once T-013 lands (until then, a local constant noted in the handoff).
- **Do not touch:** migrations, other features.

## Specification

- **Back up:** the worker returns the bytes and the file name; the screen wraps them in a `File` and calls `navigator.share({ files: [file] })`. If `navigator.canShare` refuses files, fall back to a download link. Record `lastBackupAt` only after the share sheet resolves without error (cancel = not backed up).
- **Restore:** a file input (`accept=".sqlite"`); a confirmation dialog: "Replace all current data with this backup? Your current data is kept as a safety snapshot on this phone first." Then the worker restores; every screen refreshes; show the result or the error message.
- Settings shows "Last backup: 3 days ago" / "Never".

## Acceptance criteria

- [ ] `make verify` passes.
- [ ] Tests: file naming round trip; validation rejects garbage, a newer schema and a database missing tables; restore keeps a snapshot (a `Database`-level test; OPFS itself is checked in Safari).
- [ ] UI: checked in Safari on the iPhone 15 Pro Max simulator: back up opens the share sheet; restore of that file brings the data back; dark and light.

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:** review. `make verify` passes (33 tests). Not yet checked in iOS Safari: see Open questions.
- **What was done:**
  - Core (`src/core/backup/`): `BackupFile` (name for a date, parse a name; `WorkoutTracker-YYYY-MM-DDTHH-mm-ss.sqlite`, UTC, no `Z`, as written in `docs/DATA.md`; the native spec had a trailing `Z`), `BackupAge` (`daysSinceBackup`), `BackupError`, `BackupValidation` (`validateBackup`), `BackupRestore` (`restoreBackup` plus the `LiveDatabaseStorage` interface).
  - Validation runs on an in-memory copy: SQLite file, has the app's `migration` rows, `quick_check`, no unknown (newer) migration, migrating the copy to the current schema works (a dry run of the restore's last step), and every table of a fresh database is present (the expected list is built by running the migrations, so it never goes stale).
  - Restore order lives in core so it is testable: validate, snapshot, close, replace, reopen, migrate. If anything fails after the snapshot, the previous bytes are written back and reopened, and the error names the snapshot. If even that fails, the error says the data is in the snapshot. (The SAH pool's `importDb` drops the live file's slot when a write fails, so this rollback is not theoretical.)
  - `OnDeviceStore.restore(bytes)` implements `LiveDatabaseStorage` over the pool. `database` is now a getter that changes after a restore; `whenIdle()` makes every `WorkerApi` call wait while a restore runs, so nothing can write between the snapshot and the replacement. A leftover `-journal`/`-wal` file is deleted before the replacement so SQLite cannot replay it into the restored data.
  - `WorkerApi` (block `// Backup (T-016)`): `exportBackup()` (also validates its own output, bytes transferred not copied), `lastBackupAt()`, `recordBackupMade()` (notifies listeners), `restoreBackup(bytes)` (notifies listeners). `summary()` now uses `liveStore()` too.
  - UI: `BackupSection` in Settings (Last backup row, Back up, Restore from a backup file…, confirmation `<dialog>` with the specified text plus file name, size and date, success and error lines with icons).
- **Files touched:** `src/core/backup/{BackupAge,BackupError,BackupFile,BackupRestore,BackupValidation}.ts` and tests `{BackupFile,BackupRestore,BackupValidation}.test.ts`; `src/worker/OnDeviceStore.ts`; `src/worker/WorkerApi.ts`; `src/app/features/settings/{BackupSection.tsx,BackupSection.module.css,SettingsScreen.tsx}`; this file; `docs/tasks/BOARD.md`.
- **Decisions taken:**
  - **Share sheet gesture.** `navigator.share` must run inside the tap. The section therefore asks the worker for the backup file when it mounts and after every change (`useDatabaseQuery`), shows "Preparing…" until it is ready, and the tap handler calls `navigator.share({ files: [file] })` with no `await` before it. I did not test whether awaiting the worker first still works in iOS Safari (WebKit is known to reject with `NotAllowedError` once the gesture is stale), so this is the safe design, not a measured one. Cost: the database is exported and validated (about 100 ms in the worker, a few MB in memory) each time Settings shows or data changes.
  - `lastBackupAt` is recorded only after `share()` resolves; `AbortError` (sheet closed) is treated as a cancel. With no share sheet (`canShare` refuses files or is missing) the file is downloaded through a link, and the time is recorded straight after the click, because a download can't be observed.
  - Media type `application/vnd.sqlite3`.
- **Open questions / left over:**
  - **Not verified in iOS Safari.** The iPhone 15 Pro Max simulator stopped responding (blank screen, `simctl openurl` timed out), so the share sheet, the Files picker with `accept=".sqlite"`, and `navigator.canShare({ files })` accepting a `.sqlite` file are untested. The built-in desktop browser has no `navigator.share`, so only the download path ran there. To do on the simulator: tap Back up, check the sheet opens and "Save to Files" works; restore that file; check `canShare` returns true (if not, try `application/octet-stream` as the media type in `BackupSection.tsx`).
  - Lead: switch the `lastBackupAt` key in `WorkerApi.ts` (plain SQL on `appSetting`, constant `LAST_BACKUP_AT_KEY`) to `AppSetting` once T-013 merges.
  - Lead: `docs/ARCHITECTURE.md` concept table row "Backup file naming, validation and restore" can now list `BackupFile`, `BackupValidation`, `BackupRestore`, `BackupAge` and `OnDeviceStore`. `docs/DATA.md` is accurate as written.
  - `lastBackupAt` lives in the database, so a restore brings back the value stored in the backup (often "Never" or older than the file). Left as is.
  - `importDb` overwrites the live file in place; iOS killing the app in the middle of that write would leave a damaged live file. The snapshot taken just before protects the data, but there is no screen to restore a snapshot yet.
  - After a page reload the old worker can hold the storage for a few seconds, so Settings shows "Opening…" briefly; this is the SAH pool's behaviour, not new.
- **How it was verified:**
  - `make verify`: eslint, `tsc -b`, 33 tests, build.
  - Tests added (24): file naming round trip, invalid names and dates, days since backup; validation rejects garbage, empty, text, a foreign SQLite file, a newer schema, missing tables (named), a damaged page, a migration that can't run, and accepts older backups; restore keeps a snapshot with the old data, migrates older backups, changes nothing for bad or newer files, keeps the live connection if the snapshot fails, rolls back if the replacement fails, and points at the snapshot if the rollback fails too.
  - In the desktop browser on the real OPFS SAH pool at 430 x 932, dark and light: restored a generated backup (snapshot taken, 5 workouts shown), rejected garbage (data unchanged), restored the empty backup, restored again and reloaded (data persisted, snapshots pruned to 3), tapped Back up (download path: "Last backup: Today", "Backup saved."), picked a file through the confirmation dialog and replaced the data (screens refreshed, success line), picked a junk file (error line).
