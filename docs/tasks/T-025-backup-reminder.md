# T-025: Backup reminder on the finish summary

- **Milestone:** W3 · **Depends on:** T-016, T-024 (merged) · **Model tier:** mid

## Goal

After finishing a workout, if the last backup is more than 7 days old (or there never was one), the summary shows one quiet line, "Last backup 9 days ago", with a **Back up** button that opens the same share sheet as Settings. Information, not a nag: no colour alarm, no repeat prompts.

## Read first

`AGENTS.md`, `docs/DATA.md` → *Backups*, `src/app/features/settings/BackupSection.tsx` (how the file is prepared before the tap and shared; iOS needs `navigator.share` inside the tap with no `await` before it), `src/core/backup/BackupAge.ts` (`daysSinceBackup`), `src/app/features/workout/WorkoutSummaryScreen.tsx` and `SavedWorkoutSummary.tsx`.

## Scope

- **Create:** `src/core/backup/BackupReminder.ts` (+ test): `BackupReminderPolicy` (`staleAfterDays: 7`, doc comment marked `Heuristic:` with the reason) and `isBackupStale(lastBackupAt, now)`. A shared hook `src/app/features/settings/useBackupFile.ts` (or similar) extracted from `BackupSection.tsx` so both places prepare and share the file the same way (one implementation), and `BackupReminderLine.tsx` (+ CSS module) in `src/app/features/workout/`.
- **Edit:** `BackupSection.tsx` (use the extracted hook, no behaviour change), `WorkoutSummaryScreen.tsx` or `SavedWorkoutSummary.tsx` (render the line).
- **Do not touch:** other workout files (another task edits the logging screen), core outside `backup/`, the worker.

## Acceptance criteria

- [ ] `make format`, `make verify` pass; tests for `isBackupStale` (never, 6 days, 8 days, future date).
- [ ] The line appears only when stale; tapping it shares the file and the line disappears after a recorded backup.

## Handoff

- **Status:** · **What was done:** · **Files touched:** · **Decisions taken:** · **Open questions / left over:** · **How it was verified:**
