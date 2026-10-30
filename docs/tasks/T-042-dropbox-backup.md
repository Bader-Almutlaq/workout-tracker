# T-042: Automatic backup to the owner's Dropbox

- **Milestone:** R11 · **Depends on:** T-041 (merged) · **Model tier:** strong (Codex Sol: OAuth, iOS quirks, data safety)

## Goal

After every finished workout, a full backup uploads silently to the owner's Dropbox app folder. Connecting is a one-time step in Settings. The manual share-sheet backup stays as a fallback.

## Read first

- `AGENTS.md` (Offline always: the Dropbox exception), `docs/DECISIONS.md` → *2026-10-31: Automatic backups go to the owner's Dropbox* (flow, token storage, retention), `docs/DATA.md` → *Backups*.
- `src/app/features/settings/BackupSection.tsx`, `useBackupFile.ts`, `src/app/features/workout/BackupReminderLine.tsx` (finish-summary backup row), the finish flow in `src/app/features/workout/`, `src/core/backup/*` (export bytes, `lastBackupAt`, `BackupAge`, `BackupReminder`), `src/worker/WorkerApi.ts` (backup export endpoint).
- Dropbox HTTP API:
  - OAuth PKCE for public clients: `https://www.dropbox.com/oauth2/authorize` with `response_type=code`, `code_challenge` (S256), `token_access_type=offline` and **no `redirect_uri`**, so Dropbox shows the code to copy.
  - Token endpoint: `https://api.dropboxapi.com/oauth2/token` (`grant_type=authorization_code` with `code_verifier`; `grant_type=refresh_token`; `client_id` only, no secret).
  - `content.dropboxapi.com/2/files/upload`, `api.dropboxapi.com/2/files/list_folder`, `/2/files/delete_v2`, `/2/auth/token/revoke`.

## Scope

- **Create:**
  - `src/app/data/dropboxConfig.ts`: `DROPBOX_APP_KEY` constant, empty for now. When it is empty the whole feature is hidden. The lead fills it in.
  - `src/app/data/dropbox/` with small modules:
    - PKCE helpers (verifier, S256 challenge via `crypto.subtle`)
    - token store: refresh token in `localStorage` under one key, wrapped in try/catch; the access token in memory only
    - API calls via `fetch`: upload, list, delete, revoke
  - `src/core/backup/CloudRetention.ts` (+ test): a pure function choosing which app backups to delete. Keep the newest 14 and the earliest backup of each calendar month (local time). Input: name, path and server time. Output: paths to delete. Only names matching the backup pattern are ever candidates.
- **Edit:** the settings backup section, the finish flow and the finish-summary backup row, `WorkerApi.ts` (only if needed, in its own block `// Dropbox backup (T-042)`), `docs/DATA.md` (Backups: Dropbox, connecting steps for the owner), `docs/ARCHITECTURE.md` concept rows (cloud backup, retention).
- **Do not touch:** charts, analytics, migrations, import. App state other than the token goes in `appSetting` rows: `cloudBackupProvider`, `lastCloudBackupAt`, `cloudBackupPending`.

## Specification

1. **Connect (Settings → Backups → Dropbox).**
   - **Connect Dropbox** opens the authorize URL in a new window/tab (`window.open` inside the tap) and keeps the PKCE verifier in memory.
   - The screen then shows: "Approve in Dropbox, copy the code it shows, and paste it here", a code field, and **Finish connecting**.
   - Exchange the code for tokens and store the refresh token. Upload a first backup right away.
   - Show "Connected · last backup 2 min ago", **Back up to Dropbox now**, and **Disconnect**. Disconnect revokes the token and clears local state. It never deletes Dropbox files.
   - Errors are readable ("That code didn't work; codes expire after a few minutes. Try Connect again.").
2. **After Finish.**
   - When connected, after the workout is saved: get an access token (refresh it if missing or expired), export the database (the existing export), and upload it as `/WorkoutTracker-YYYY-MM-DDTHH-mm-ss.sqlite` with `mode: add`. Record `lastCloudBackupAt` (also update `lastBackupAt`, so the reminder knows).
   - Then apply retention: list the app folder and delete the paths returned by `CloudRetention`.
   - The finish summary's backup row shows "Backing up to Dropbox…" → "Backed up to Dropbox just now", or "Dropbox backup didn't finish: <reason>" with **Try again** and the existing **Back up now** (share sheet).
   - Never block finishing a workout.
3. **Offline / failures.**
   - On any failure, set `cloudBackupPending` and show the reason.
   - Retry a pending backup when the app opens and on the `online` event (silent, since the refresh token needs no tap), and from the Settings button.
   - A refresh token Dropbox rejects (revoked) clears the connection and shows "Reconnect Dropbox".
   - Log failures with `log.backup` and never swallow them.
4. **Safety.**
   - The upload sends the same bytes as the manual backup.
   - Retention never runs after a failed upload and deletes only app backup files.
   - Tokens never go into the database, logs or backup files.
5. `make format`; `make verify` must pass. Mock `fetch` and `crypto` where needed; no network in tests.

## Acceptance criteria

- [ ] `CloudRetention` tests: newest 14 kept; month-first kept; nothing deleted with 14 or fewer; local-month boundaries; non-matching names ignored.
- [ ] PKCE tests (challenge for a known verifier, RFC 7636 example).
- [ ] Mocked-fetch tests:
  - connect exchange
  - refresh on expiry
  - upload, then retention
  - no deletion after a failed upload
  - a revoked token clears the connection
- [ ] Caption and state text tests.
- [ ] Feature hidden when `DROPBOX_APP_KEY` is empty.
- [ ] Docs updated (DATA with the owner's connect steps, ARCHITECTURE).

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
