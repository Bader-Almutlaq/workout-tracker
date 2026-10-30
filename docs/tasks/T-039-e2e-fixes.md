# T-039: Fixes from the end-to-end check

- **Milestone:** quality · **Depends on:** T-037, T-038 (merged) · **Model tier:** mid (Codex Terra)

## Goal

An end-to-end run through the app (import, live workout, discard, templates) found five small correctness problems. Fix each with a regression test. No chart changes (the owner put charts on hold).

## Read first

- `AGENTS.md`; `src/core/logging/WorkoutLogger.ts` (`startFromTemplate`, add-exercise prefill), `src/core/queries/PreviousPerformance.ts`, `src/core/queries/WorkoutHistory.ts`, `src/core/import/StrongImportPlan.ts` and `StrongImporter.ts`, `src/core/queries/TemplateCatalog.ts`.
- App: `src/app/features/history/` (WorkoutDetailScreen, SetRow, HistoryScreen), `src/app/features/exercises/ExerciseDetailScreen.tsx` (usage numbers only, not the strength card), `src/app/features/import/ImportReviewStep.tsx`, `src/app/features/templates/`.

## Scope

- **May edit:** the files above and their tests; `src/worker/WorkerApi.ts` only if a new read is needed (own block `// T-039`).
- **Scope widened by the lead (round 2):** also `src/core/queries/TemplateCatalog.ts`, `src/core/queries/ExerciseCatalog.ts`, `src/app/features/workout/SavedWorkoutSummary.tsx`, `src/app/features/workout/ExerciseCard.tsx`, `src/app/features/exercises/RecentSessionRow.tsx` and `ExerciseDetailScreen.tsx` (usage numbers only), plus their tests.
- **Do not touch:** `src/app/design/charts/`, `StrengthCard*`, `src/app/features/analytics/`, migrations, analytics formulas.

## Fixes

1. **Set notes are not shown.** Strong set notes are stored (`workoutSet.notes`) but History's workout detail never shows them. Show a set's note under that set row in a quiet caption style (same for app-logged sets that have notes).
2. **Previous-set prefill uses warm-ups.** When a workout (from a template or by adding an exercise) is prefilled from the last session, sets are matched by position, so working set 1 gets last time's warm-up (60 × 10). Match by kind: warm-ups prefill from last time's warm-ups, working/drop/failure sets from last time's non-warm-up sets in order. Fall back to the template target / empty when there is no match. Test both entry points.
3. **Discarding stamps the template.** Starting from a template sets `template.lastStartedAt`, so after a discard the template reads "Last done today". The template's "last done" must reflect only finished workouts: set the stamp on finish (for workouts with `templateId`), or derive it from finished workouts; a discard leaves the template exactly as before. Keep existing data valid (no migration).
4. **One rule for set counts.** Warm-ups never count toward volume (owner's rule). Make every "N sets" count exclude warm-ups (History list rows, workout summary, exercise detail usage, recent-session rows), and where a workout or session has warm-ups, add them separately, e.g. "3 sets · 1 warm-up". The counting lives in core (one place); screens only render it.
5. **Import preview counts already-imported workouts.** On re-import the review button says "Import 2 workouts" although both exist. Before the review step, check the planned workouts' source keys against the database and show "2 already imported · 0 new" (button disabled or "Nothing new to import" when zero). The importer stays idempotent regardless.

## Round 2 (lead)

Finish what round 1 left over:
- "Last done" for a template comes from finished workouts only (derive it in `TemplateCatalog`, so old stamps left by discarded workouts are corrected too, with no migration).
- One shared core helper counts working sets and warm-ups; History, the finish summary, exercise usage and recent-session rows all use it and show "N sets · M warm-ups" when there are warm-ups.
- The live workout's "last time" comparison in `ExerciseCard` matches by kind, the same way the prefill does (reuse the core matching, don't re-derive it).

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] A regression test per fix (core where the logic lives; app helper tests for text).
- [ ] Handoff lists each fix with the test names.

## Handoff

- **Status:** Ready for lead review; changes remain uncommitted.
- **Fixes and regression tests:**
  - Set notes appear beneath History rows: `Shows the note beneath its set and omits an empty note`.
  - Template prefill and the live comparison match warm-ups and non-warm-ups independently; adding an exercise retains the previous sets' kinds and values: `Template matches warm-ups and work sets independently and falls back to targets`, `Starting from a template uses template set counts and kinds with history and defaults`, `Adding an exercise pre-fills last session sets as planned in the exercise unit`, and `matches last time by warm-up and work order even when kinds are interleaved or missing`.
  - Template last done is derived from finished workouts, including when a stale discarded-workout stamp exists: `derives last done only from finished workouts, ignoring stale stamps and active workouts` and `Discard leaves the template stamp unchanged; finishing stamps its start`.
  - Shared core counting separates warm-ups from all other kinds in History, finish summary, exercise usage and recent sessions: `counts warm-ups separately from all non-warm-up kinds`, `Summaries are newest first with counts and tonnage excluding warm-ups`, `summarizes usage and recent top sets`, and `formats work sets and optional warm-ups with singular and plural labels`.
  - Import review shows already-imported and new workout counts: `Preview counts new and already imported source keys`.
- **Files touched:** WorkoutLogger, PreviousPerformance, WorkoutHistory, TemplateCatalog, ExerciseCatalog and StrongImporter plus their tests; WorkerApi; History screen, set row and count text helper plus tests; import review and totals; workout ExerciseCard and SavedWorkoutSummary; exercise detail and recent-session row; this handoff.
- **Public API:** `matchPreviousSets` and `countWorkoutSets` are shared core helpers; catalog detail and session results include warm-up counts. The import preview API from round 1 remains in WorkerApi. The `lastStartedAt` catalog value is the latest finished workout's start, or null.
- **Decisions:** File totals remain visible during import review; measurements can still be imported when no workouts are new. Drop and failure sets count as non-warm-up sets. Existing stored template stamps are left intact but no longer determine the catalog's last-done display.
- **Verification:** `make format` and `make verify` passed: 93 test files, 712 tests, lint, type checks and production build. UI visual checks were not performed. No board edit or commit.
