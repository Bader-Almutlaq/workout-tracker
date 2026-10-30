# T-042: Automatic backup to the owner's Google Drive

- **Milestone:** R11 · **Depends on:** T-041 (merged) · **Model tier:** strong (Codex Sol: OAuth, iOS quirks, data safety)

## Goal

After every finished workout, a full backup uploads to the owner's own Google Drive with no extra taps when possible. Settings lets the owner connect or disconnect Drive and shows the last upload. The manual share-sheet backup stays as a fallback.

## Read first

- `AGENTS.md` (Offline always: the Drive exception), `docs/DECISIONS.md` → *2026-10-31: Automatic backups go to the owner's Google Drive* (scope, retention, limits), `docs/DATA.md` → *Backups*.
- `src/app/features/settings/BackupSection.tsx`, `useBackupFile.ts`, `src/app/features/workout/BackupReminderLine.tsx` (finish-summary backup row), the finish flow in `src/app/features/workout/` (where Finish is confirmed), `src/core/backup/*` (export bytes, `lastBackupAt`, `BackupAge`, `BackupReminder`), `src/worker/WorkerApi.ts` (backup export endpoint).
- Google Identity Services token model (`google.accounts.oauth2.initTokenClient`, `requestAccessToken`), Drive API v3 `files.create` multipart upload, `files.list` with `q`, `files.delete`.

## Scope

- **Create:**
  - `src/app/data/googleDriveConfig.ts`: `GOOGLE_CLIENT_ID` constant, empty for now. When it is empty the whole feature is hidden. The lead fills it in.
  - `src/app/data/googleDrive/` with small modules:
    - load the GIS script on demand (`https://accounts.google.com/gsi/client`)
    - the token client
    - Drive calls (`fetch`): ensure folder, upload, list, delete
  - `src/core/backup/DriveRetention.ts` (+ test): a pure function choosing which of the app's Drive backups to delete. Keep the newest 14 and the earliest backup of each calendar month (local time). Input: name and creation time. Output: ids to delete.
  - `src/core/backup/DriveBackupName.ts` (+ test) if the name format needs a helper. Reuse the existing `WorkoutTracker-YYYY-MM-DDTHH-mm-ss.sqlite`.
- **Edit:** the settings backup section, the finish flow and the finish-summary backup row, `WorkerApi.ts` (only if a new read/write is needed, in its own block `// Drive backup (T-042)`), `docs/DATA.md` (Backups: Drive), `docs/ARCHITECTURE.md` concept rows (Drive backup, retention).
- **Do not touch:** charts, analytics, migrations (store Drive state in `appSetting` rows: `driveConnected`, `driveFolderId`, `lastDriveBackupAt`, `driveBackupPending`), import.

## Specification

1. **Connect (Settings → Backups → Google Drive).**
   - "Connect Google Drive" calls `requestAccessToken({ prompt: 'consent' })` inside the tap, with scope `https://www.googleapis.com/auth/drive.file`.
   - On success: create or find the folder "Workout Tracker Backups" (search only within app-created files), store its id, and upload a first backup right away.
   - Show "Connected · last upload 2 min ago" plus Disconnect. Disconnect revokes the token (`google.accounts.oauth2.revoke`) and clears the settings. It never deletes Drive files.
2. **After Finish.**
   - When Drive is connected, request a token *synchronously inside the Finish confirm tap*: reuse a cached token if it is still valid, otherwise call `requestAccessToken({ prompt: '' })`.
   - After the workout is saved, export the database (the existing export), upload it to the folder, record `lastDriveBackupAt`, then apply retention: list the app's files in the folder, delete what `DriveRetention` returns, and only ever delete files whose names match the backup pattern.
   - The finish summary's backup row shows the state: "Backing up to Google Drive…" → "Backed up to Google Drive just now", or "Drive backup didn't finish: <reason>" with **Try again** and the existing **Back up now** (share sheet).
3. **Offline / failures.**
   - If offline or the token request fails, set `driveBackupPending` and show the reason.
   - A pending backup retries on the next Finish, from a "Back up to Drive now" button in Settings, and on app start only when a valid cached token exists. Never block finishing a workout.
   - Log failures with `log.backup` and never swallow them.
4. **iOS Home Screen caveat.** GIS popups can misbehave in iOS standalone web apps.
   - Keep the code path simple, so a redirect-based fallback can be added after the lead tests it on the simulator.
   - Document in the Handoff exactly which call opens the popup.
5. **Safety.**
   - The upload sends the same bytes as the manual backup.
   - Retention deletes only app-created backup files and never runs when the upload failed.
   - Tokens stay in memory, never in the database or localStorage.
6. `make format`; `make verify` must pass. Mock `fetch` and the GIS client in tests; no network in tests.

## Acceptance criteria

- [ ] `DriveRetention` tests: newest 14 kept; month-first kept; nothing deleted when there are 14 or fewer; local-month boundaries.
- [ ] Tests for the Drive call sequence with a mocked fetch: folder reuse, upload, then retention order, and no deletion after a failed upload.
- [ ] Tests for the caption and state text.
- [ ] Feature hidden when `GOOGLE_CLIENT_ID` is empty.
- [ ] Docs updated (DATA, ARCHITECTURE).

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
