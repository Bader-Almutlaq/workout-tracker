# T-040: Leave out a flagged set at import

- **Milestone:** quality · **Depends on:** T-039 (merged) · **Model tier:** mid (Codex Terra)

## Goal

Before the owner imports four years of Strong history, the import review must let them drop sets that are plainly wrong (e.g. 35 kg × 454 reps) instead of only keeping or correcting them, so outliers never reach the analytics. The original export file is untouched, so leaving a set out loses nothing.

## Read first

- `AGENTS.md`, `docs/DATA.md` → *Typo and outlier checks* and *Strong export*.
- `src/core/import/StrongImportOptions.ts` (`SetCorrection`, `corrections` keyed by line number), `StrongImportPlan.ts`, `StrongImporter.ts`.
- `src/app/features/import/FindingGroupCard.tsx` (Use suggestion / Keep / Edit…), `ImportReviewStep.tsx`, `ImportTotalsSection.tsx`, `ImportResultStep.tsx`.

## Scope

- **May edit:** the files above and their tests; `src/worker/WorkerApi.ts` only if the options shape crossing the worker changes.
- **Do not touch:** charts, analytics, migrations, other features.

## Specification

- Options gain `excludedLines: ReadonlySet<number>` (line numbers of sets to leave out; default empty). The importer skips those sets. A workout whose every set is left out is not created; an exercise with no remaining sets is not added to its workout. Set positions stay contiguous (0-based) after skipping.
- Excluded sets don't count toward any totals shown in review or result. The review's totals update when a set is left out; the result step says "N sets left out".
- `FindingGroupCard`: each flagged set gets a **Leave out** button next to Keep and Edit…; a group with several items gets **Leave all out**. A left-out item shows as struck through with an **Undo**. Wording stays neutral.
- The importer stays idempotent: importing the same export again with the same choices adds nothing. Document that a set left out can be brought back only by importing again after deleting that workout (state this in `docs/DATA.md` → *Typo and outlier checks*).
- `make format`; `make verify` must pass.

## Acceptance criteria

- [ ] Core tests: excluded set skipped; all-excluded workout not created; positions contiguous; totals exclude left-out sets; re-import idempotent.
- [ ] App helper tests for the result text.
- [ ] `docs/DATA.md` updated.

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:** Implemented; uncommitted, ready for review.
- **What was done:** Added leave-out and undo controls, filtered import plans and totals, result reporting, documentation, and regression tests.
- **Files touched:** StrongImportOptions, StrongImportPlan, StrongImporter and their tests; FindingGroupCard, ImportReviewStep, ImportResultStep and result test; docs/DATA.md; this handoff.
- **Decisions taken:** Excluded counts represent selected existing set lines, including those in workouts already imported. Review keeps the original set context for undo and unit inference. Existing note-only entries remain preserved; entries whose sets were all excluded are removed.
- **Open questions / left over:** No simulator or manual UI check was performed. An entirely excluded workout is absent from the database and can be imported on a later run without deletion.
- **How it was verified:** `make format` and `make verify` passed: 94 test files, 715 tests, production build.

