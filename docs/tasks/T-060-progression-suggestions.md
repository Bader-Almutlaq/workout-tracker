# T-060: Opt-in progression suggestions (reps, then load), shown in amber

- **Milestone:** R5/R6 (progression) · **Depends on:** T-056 merged (the suggestion slot), T-044 (loadable weights) · **Model tier:** strong (Codex Sol: a formula, a migration and the live screen)

## Goal

The owner's decision (`docs/design/PROPOSALS.md` → *Owner decisions*, Progression):

- Progression is **opt-in** and progresses **reps first within the chosen rep range, then load**, with intensity (RPE) considered.
- Suggestions appear in **amber** beside the greyed previous value and are used only when tapped.
- Progression is **per workout**: the same exercise on different days can have different rep ranges.

AGENTS.md product rule: measure, don't prescribe. The suggestion is an opt-in calculation, with descriptive wording and no verdicts.

## Read first

- `AGENTS.md`; `docs/design/PROPOSALS.md` (§11 and *Owner decisions*); `docs/design/PAGES-2026-10-31.md` → Live workout; `reports/Workout tracker app research.md` (double progression and RPE/RIR sections: cite them, or mark `Heuristic:`).
- Core:
  - `src/core/db/migrations.ts` (`templateSet.targetRepsLow/High/targetRpe` already exist)
  - `src/core/units/LoadableWeight.ts`
  - `src/core/queries/PreviousPerformance.ts`
  - `src/core/logging/WorkoutLogger.ts` (starting from a template)
  - `src/core/logging/WarmupPlan.ts`, as the model for a pure planner
- App: `src/app/features/workout/` (`ValueSuggestion.ts`, SetRow, ValueCell, ExerciseInfoLine, exerciseMenuItems), the template editor (`src/app/features/templates/`, TargetValueCell, TemplateSetRow).

## Scope

- **Create:** `src/core/logging/ProgressionPlan.ts` (+ test): a pure function from the previous performance and the targets to per-set suggestions.
- **Edit:**
  - migrations: append `v8-template-progression`, adding to `templateExercise` a nullable `progression TEXT CHECK (progression IN ('double'))` (NULL = off)
  - template models and editor
  - the logger or worker query that feeds the live screen
  - the live workout suggestion wiring and info line
  - docs (DATA: new column; ARCHITECTURE: a row for ProgressionPlan; DECISIONS: one entry)
- **Do not touch:** charts, analytics, import/export, measurements, Dropbox, warm-up generation rules.

## Specification

1. **Turning it on:**
   - In the workout (template) editor, each exercise gets **Progression: Off / Reps then weight**.
   - The rep range comes from that exercise's template set targets (`targetRepsLow`–`targetRepsHigh`, `targetRpe`).
   - If the targets are missing when it's switched on, the editor asks for a range (defaults 8–12).
2. **Previous performance:** the working sets of the most recent finished session of **the same template** containing the exercise. If there is none, fall back to the most recent finished session of the exercise anywhere. Warm-ups are ignored.
3. **Rule** (double progression; cite the report or mark `Heuristic:`), per working set position:
   - **Below the range** (reps < low): same weight; suggest reps = low.
   - **In range, top not yet reached:** same weight, reps + 1 (capped at high).
   - **Every working set reached the top** of the range at RPE ≤ target (or RPE unknown): weight + one loadable step (`roundToLoadable(previous + step, profile, 'nearest')`; at least the next loadable load), reps = low.
   - **RPE above the target** with reps in range: same weight and reps (repeat). Wording on the info line: "Repeat: last RPE above target".
   - Weights stay exact kilograms, displayed in the set's entry unit. No suggestion when tracking isn't weight + reps (bodyweight: reps only, same rule without the weight step).
4. **Live workout:**
   - When the workout was started from a template whose exercise has progression on, each working set's weight and reps cells get the amber suggestion (the `ValueSuggestion` slot).
   - The previous values stay greyed as today. Tapping amber copies it; ticking without tapping uses the greyed values.
   - The info line shows the range and the reason, e.g. "8–12 reps · +1 rep" or "8–12 reps · +2.5 kg next".
5. **Persistence:** suggestions are computed on the fly, not stored. After a reload they reappear for untouched sets.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] `ProgressionPlan` tests with hand-computed cases:
  - 100 kg × [12, 12, 11] in 8–12 → [12, 12, 12] at 100
  - 100 × [12, 12, 12] @ RPE 8 (target 8) → 102.5 × 8
  - dumbbell 22.5 × 12s → 25 × 8
  - RPE 9.5 above target 8 → repeat
  - below range
  - lb exercise steps in lb
  - bodyweight reps only
  - no previous session → no suggestion
- [ ] Migration test v7 → v8 keeps every row, new column NULL; backup validation passes.
- [ ] Live screen tests: amber appears only with progression on; tap copies; tick without tap uses greyed values; the info line text.
- [ ] Docs updated.
- [ ] Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

Implementation is complete, but **not ready to mark done**: the full verification has one
out-of-scope existing test failure awaiting the requested scope exception. Changes are uncommitted;
`docs/tasks/BOARD.md` is unchanged.

- **Core and schema:** added `src/core/logging/ProgressionPlan.ts` and its tests; appended
  `v8-template-progression` and the v7-to-v8 preservation/backup test in `src/core/db/migrations*`.
  Updated `models/TemplateExercise.ts`, `templates/TemplateDraft.ts`, `TemplateStore.ts`,
  `queries/TemplateCatalog.ts`, `PreviousPerformance.ts`, `LiveWorkout.ts`, and
  `logging/WorkoutLogger.ts`. The shared synthetic `db/fixtures/DataSafetyFixture.ts` now names
  the template-exercise columns so it works on both old and new schemas. Added
  `queries/LiveWorkout.progression.test.ts`.
- **Editor:** added `ProgressionControl.tsx`, `ProgressionRangeDialog.tsx`,
  `templateProgressionEdits.ts`, and two matching test files under `src/app/features/templates/`.
  Updated `TemplateExerciseCard.tsx`/its CSS module, `TemplateEditorActions.ts`, and
  `useTemplateEditor.ts`. Enabling with missing working targets asks to confirm a range (8–12
  offered); complete per-set ranges and optional RPE remain unchanged.
- **Live screen:** updated `SetRow.tsx`, `ValueCell.tsx`, `ValueSuggestion.ts`, and
  `ExerciseInfoLine.tsx`; added `progressionValueSuggestion.ts`, `progressionText.ts`, and
  `progressionSuggestions.test.ts` under `src/app/features/workout/`. Previous values stay grey;
  amber uses the existing accept action. Only display text is rounded, preserving exact kg even
  when a kg override displays as fractional lb. Per-set ladders handle switching units after a
  completed set. No new worker method is needed.
- **Public API:** `progressionPlan(previous, targets, exercise, unit?)` returns nullable suggestions
  aligned with target positions; `ProgressionSuggestion` describes exact kg/null bodyweight load,
  reps, range and reason. `TemplateExercise.progression` and optional draft `progression` hold
  `'double' | null`. `previousPerformance` adds optional preferred-template and zero-based
  occurrence arguments. `LiveWorkoutEntry.progression` carries targets plus transient set-id
  suggestions. UI exports are the two controls, `withProgression`, `ProgressionRangeDefaults`,
  `progressionText`, and `progressionValueSuggestion`; actions add `setProgression`, and the
  existing suggestion slot gains optional `keepsPrevious`.
- **Interpretations:** non-warm-up sets include drop/failure, following existing positional
  matching. Each position uses its own range and effort target; missing or extra historical
  positions block a load jump. Unknown RPE or an unspecified RPE target permits progress.
  Bodyweight and equipment without a discrete step repeat at the top without a load suggestion.
  Repeated exercises match by occurrence within the chosen finished session. Current template
  targets drive live calculations, so template edits during a session affect them. No snapshots
  of targets or persisted suggestion/provenance fields were added.
- **Reload limit:** values differing from their baseline suppress that cell's amber suggestion.
  An identical accepted/typed value is distinguishable only while the editor is mounted and can
  show amber again after reload. This is documented in DATA and DECISIONS.
- **Docs:** DATA describes v8 and persistence; ARCHITECTURE assigns ownership; DECISIONS records
  the rules and interpretations. No charts, analytics, import/export, measurements implementation,
  Dropbox, or warm-up generation rules were changed.
- **Validation:** `make format`, formatting/ESLint, strict type checks, and `make build` pass.
  Full test run: **1,192 passed, 1 failed (1,193 total)**, including **42 added passing tests**.
  Required hand-computed examples, v7/v8 backup validation, same-template fallback, reload,
  tick-without-acceptance, amber callbacks, exact loads, repeated exercises and mixed units are
  covered. `git diff --check` passes. An intermediate run alongside the production build also
  exceeded the existing exercise-search speed budget; it passed again on the final serialized
  verification run without source changes. The final run has only the v7 assertion failure.
- **Remaining verification blocker:** `src/core/measurements/MeasurementGuidesMigration.test.ts:17`
  assumes `migrate(db)` applies only v7. Appending v8 correctly returns both ids. Requested a
  test-only scope exception to pin its migration and idempotence checks to
  `migrate(db, new Date(), MIGRATIONS.slice(0, 7))`. The file is untouched because the task explicitly
  excludes measurements. Until this is authorized, `make verify` fails on this one assertion.
- **Visual check still needed:** `make dev` fails with `listen EPERM` on `0.0.0.0:5173` in this
  sandbox and browser access is unavailable. Rendered markup and callback tests pass; dark/light
  screenshots at 430 × 932 and an interactive device check could not be completed here.
