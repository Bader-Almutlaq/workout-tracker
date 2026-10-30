# T-041: Backup button on every finish, and one-tap cleaning at import

- **Milestone:** quality · **Depends on:** T-040 (merged) · **Model tier:** mid (Codex Terra)

## Goal

Two owner requests before the first real import:
1. **Back up after every workout.** The finish summary always offers the backup, not only after 7 days. iOS needs the owner to tap Save in the share sheet; there is no silent write to iCloud Drive from a web app.
2. **Clean the history without reviewing it.** The owner will not go through 4 years of flagged sets one by one. One button in the import review leaves out every flagged set.

## Read first

- `AGENTS.md`, `docs/DATA.md` → *Backups* and *Typo and outlier checks*.
- `src/app/features/workout/BackupReminderLine.tsx` (shown only when `isBackupStale`), `src/app/features/workout/SavedWorkoutSummary.tsx`, `src/app/features/settings/useBackupFile.ts`, `src/core/backup/BackupReminder.ts`.
- `src/app/features/import/ImportReviewStep.tsx`, `FindingGroupCard.tsx` (per-set Leave out / Undo from T-040).

## Scope

- **May edit:** the files above and their tests, `docs/DATA.md`.
- **Do not touch:** charts, analytics, core import logic (the options already support `excludedLines`), migrations.

## Specification

1. **Finish summary backup.**
   - Always show a backup row on the finish summary: a primary **Back up now** button, and a caption with the last backup ("Last backup: 3 days ago" / "Not backed up yet") using the existing reminder helpers.
   - After a successful share, the caption reads "Backed up just now".
   - When the backup is older than 7 days, the caption uses the existing quiet warning style. There is no blocking dialog and no nag.
   - Rename the component to fit (e.g. `FinishBackupRow`) if it is no longer a reminder.
   - Do not try to open the share sheet automatically: iOS requires the tap.
2. **One-tap cleaning.**
   - Above the flagged list, add a button **Leave out all N flagged sets**, with a one-line caption: "N of M sets (x.x%) differ a lot from nearby sessions. Leaving them out keeps typos out of your charts; your export file is unchanged."
   - After tapping it, the button becomes **Undo** (restoring the previous per-set decisions) and the totals update.
   - Per-set controls stay available for anyone who wants to review.
3. Update `docs/DATA.md` (backups: the finish-summary button; typo checks: the bulk leave-out).
4. `make format`; `make verify` must pass.

## Acceptance criteria

- [ ] Tests for the caption text (never backed up, days ago, just now, stale) and for the bulk leave-out / undo state helper.
- [ ] `make verify` passes.

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
