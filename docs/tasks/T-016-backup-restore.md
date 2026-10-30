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

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
