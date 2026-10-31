# T-052: Make connecting Dropbox clear and reliable

- **Milestone:** R11 (automatic backup) · **Depends on:** none · **Model tier:** strong (Codex Sol: an auth flow that must survive app restarts)

## Goal

The owner tried to connect Dropbox on the iPhone Home Screen app and couldn't tell whether it worked:

- After **Connect Dropbox** and pasting the code back, nothing visible happened.
- Pasting the app key and tapping **Save** also showed nothing.

Two likely causes:

1. **The code step loses its state.** iOS often restarts a Home Screen app when you switch to Safari and back. The PKCE verifier lives only in memory (`DropboxBackup.verifier`), so the pasted code has nothing to complete.
2. **The status text is easy to miss,** and saving a key gives no feedback at all.

After this task the owner always sees whether Dropbox is connected, every step answers visibly, and a restart between the two steps doesn't break connecting.

## Read first

- `AGENTS.md` (offline rule and the Dropbox exception; never log or persist access tokens), `docs/DATA.md` → backups, `docs/DECISIONS.md` → *Automatic backups go to the owner's Dropbox*.
- `src/app/data/dropbox/` (`DropboxBackup.ts` state machine, `DropboxTokenStore.ts`, `pkce.ts`, `DropboxApi.ts`, `dropboxCaption.ts`, `useDropboxBackup.ts`, `effectiveDropboxAppKey.ts`) and their tests.
- `src/app/features/settings/DropboxBackupSection.tsx`, `DropboxCodeForm.tsx`, `DropboxAppKeyForm.tsx` (+ CSS), `src/app/features/workout/DropboxBackupLine.tsx`.

## Scope

- **May edit:** the files above, their tests, `docs/DATA.md` and `docs/DECISIONS.md` (one entry about keeping the verifier briefly).
- **Do not touch:** backup file contents, retention, the worker, migrations, other Settings sections.

## Specification

1. **Status, always visible.** The Dropbox section opens with one status row:
   - **Not connected:** neutral text "Not connected".
   - **Connected:** a status-good tick plus "Connected · last backup 5 min ago" (or "no backup yet").
   - **Busy:** "Connecting…" / "Backing up…".
   - **Problem:** status-bad text saying what happened and what to do.

   Use existing tokens and components (no new colours).
2. **Connect in two visible steps,** shown when not connected:
   - "1. Open Dropbox and tap **Allow**" with the button **Open Dropbox** (today's popup logic).
   - "2. Paste the code Dropbox shows" with the field and a **Connect** button.
   - Step 2 is visible as soon as step 1 was started, including after the app restarts (point 3).
   - While nothing is pending, step 2 is greyed with the hint "Open Dropbox first."
3. **Survive a restart.**
   - Keep the pending PKCE verifier in localStorage (key next to the refresh token), with the time it was made.
   - It expires after 10 minutes and is removed once used, on disconnect, or when the key changes.
   - The verifier alone can't obtain a token, the code works once, and the app only reaches its own folder. Record this in DECISIONS and update the doc comment in `DropboxTokenStore.ts`.
   - Access tokens are still never persisted. Nothing is logged.
4. **Connect answers visibly.**
   - On success, run the first backup straight away, then show "Connected. First backup saved to your Dropbox (Apps folder)."
   - On failure, keep the pasted text and show the reason under the field:
     - **Rejected or expired code:** "Dropbox didn't accept that code. Codes work once and expire after a few minutes. Tap Open Dropbox for a new one."
     - **No pending step:** "Tap Open Dropbox first, then paste the new code."
     - **Offline:** "No connection. Try again when you're online."
5. **The app key is advanced and answers too.**
   - Move it into a disclosure, closed by default: "Advanced: use your own Dropbox app".
   - First line: "JEM already includes a Dropbox app key. You only need this to use an app you created yourself."
   - **Save** always answers inline:
     - **New key:** "Saved. Tap Open Dropbox to connect with it."
     - **Same key:** "That key is already in use."
     - **Blank:** "Using JEM's built-in key."
     - **Malformed** (not 5–40 letters and digits): "That doesn't look like a Dropbox app key."
6. **Same status elsewhere:** the finish screen's Dropbox line and the Backups section use the same status wording.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] State tests:
  - the verifier is persisted at begin, restored after a new instance (a simulated restart), and expires after 10 minutes
  - it is removed after a successful exchange, on disconnect and on a key change
  - a success triggers one backup
  - each failure kind gives its message
  - the key-save outcomes
- [ ] Caption/status helper tests for every state.
- [ ] Docs updated.
- [ ] Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

Implementation complete; changes are uncommitted and ready for review.

- **Behavior:** always-visible shared status with existing good/bad tokens; numbered Open Dropbox / paste-code steps; pending-step recovery after restart; preserved pasted text on failure; first-backup confirmation; collapsed advanced app-key disclosure with all four save outcomes.
- **Files:** `src/app/data/dropbox/{DropboxBackup.ts,DropboxBackup.test.ts,DropboxTokenStore.ts,DropboxTokenStore.test.ts,DropboxApi.ts,pkce.ts,dropboxCaption.ts,dropboxCaption.test.ts}`; `src/app/features/settings/{DropboxBackupSection.tsx,DropboxBackupSection.module.css,DropboxBackupSection.test.ts,DropboxCodeForm.tsx,DropboxAppKeyForm.tsx}`; `src/app/features/workout/{DropboxBackupLine.tsx,DropboxBackupLine.module.css}`; `docs/DATA.md`, `docs/DECISIONS.md`, and this Handoff. The board is unchanged.
- **Public API:** `DropboxTokenStore.writePendingVerifier(verifier, createdAtMilliseconds, appKey)`, `readPendingVerifier(nowMilliseconds, appKey)`, `clearPendingVerifier()`; optional safe view fields `codeMessage`, `appKeyMessage`, `appKeyInvalid`, `notice`; `dropboxStatusTone(state)`; `dropboxCaption(state, now)` now shares identical wording without a finish-summary parameter. Form props accept their inline feedback and pending-step state.
- **Interpretations:** pending verifiers are bound to the app key and expire exactly at ten minutes; expired/malformed/future-dated/different-key records are deleted when checked. Consume before a nonblank exchange attempt because a lost response may already have used the code; after a rejected/offline exchange the pasted text remains and Open Dropbox starts a fresh grant. Empty codes leave the pending step intact. Saving the same effective key (including blank when already using the built-in key) preserves the pending step. The finish screen also shows Not connected with a Settings link.
- **Verification:** `make format` and `make verify` pass: 134 test files, 1,019 tests. Coverage includes restart recovery, expiry boundary, successful exchange cleanup and one initial backup, disconnect/key-change cleanup, missing/rejected/offline failures, storage failures, key-save outcomes/boundaries, every status phase/tone, and rendered Settings/finish markup. Production build retains the existing chunk-size warning.
- **Unverified:** real Dropbox authorization and 430 × 932 dark/light visual checks require follow-up. `make dev` was blocked by sandbox socket binding (`listen EPERM` on port 5173); browser access was unavailable. No real credentials or workout data were used.
