# T-039: Fixes from the end-to-end check

- **Milestone:** quality · **Depends on:** T-037, T-038 (merged) · **Model tier:** mid (Codex Terra)

## Goal

An end-to-end run through the app (import, live workout, discard, templates) found five small correctness problems. Fix each with a regression test. No chart changes (the owner put charts on hold).

## Read first

- `AGENTS.md`; `src/core/logging/WorkoutLogger.ts` (`startFromTemplate`, add-exercise prefill), `src/core/queries/PreviousPerformance.ts`, `src/core/queries/WorkoutHistory.ts`, `src/core/import/StrongImportPlan.ts` and `StrongImporter.ts`, `src/core/templates/TemplateCatalog.ts`.
- App: `src/app/features/history/` (WorkoutDetailScreen, SetRow, HistoryScreen), `src/app/features/exercises/ExerciseDetailScreen.tsx` (usage numbers only, not the strength card), `src/app/features/import/ImportReviewStep.tsx`, `src/app/features/templates/`.

## Scope

- **May edit:** the files above and their tests; `src/worker/WorkerApi.ts` only if a new read is needed (own block `// T-039`).
- **Do not touch:** `src/app/design/charts/`, `StrengthCard*`, `src/app/features/analytics/`, migrations, analytics formulas.

## Fixes

1. **Set notes are not shown.** Strong set notes are stored (`workoutSet.notes`) but History's workout detail never shows them. Show a set's note under that set row in a quiet caption style (same for app-logged sets that have notes).
2. **Previous-set prefill uses warm-ups.** When a workout (from a template or by adding an exercise) is prefilled from the last session, sets are matched by position, so working set 1 gets last time's warm-up (60 × 10). Match by kind: warm-ups prefill from last time's warm-ups, working/drop/failure sets from last time's non-warm-up sets in order. Fall back to the template target / empty when there is no match. Test both entry points.
3. **Discarding stamps the template.** Starting from a template sets `template.lastStartedAt`, so after a discard the template reads "Last done today". The template's "last done" must reflect only finished workouts: set the stamp on finish (for workouts with `templateId`), or derive it from finished workouts; a discard leaves the template exactly as before. Keep existing data valid (no migration).
4. **One rule for set counts.** Warm-ups never count toward volume (owner's rule). Make every "N sets" count exclude warm-ups (History list rows, workout summary, exercise detail usage, recent-session rows), and where a workout or session has warm-ups, add them separately, e.g. "3 sets · 1 warm-up". The counting lives in core (one place); screens only render it.
5. **Import preview counts already-imported workouts.** On re-import the review button says "Import 2 workouts" although both exist. Before the review step, check the planned workouts' source keys against the database and show "2 already imported · 0 new" (button disabled or "Nothing new to import" when zero). The importer stays idempotent regardless.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] A regression test per fix (core where the logic lives; app helper tests for text).
- [ ] Handoff lists each fix with the test names.

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
