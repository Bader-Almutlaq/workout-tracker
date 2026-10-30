# T-044: Loadable weights and auto-generated warm-up sets

- **Milestone:** wave 2 · **Depends on:** T-043 merged (this adds migration **v5**, after T-043's v4) · **Model tier:** strong (Codex Sol)

## Goal

Two owner requests, built on one shared concept:
1. **Loadable weights.** Every weight the app suggests is one you can actually load: barbell plate pairs, dumbbell steps, machine stack steps, with per-exercise overrides. Warm-ups use it now; progression and deload will reuse it later.
2. **Warm-up sets** are generated automatically from the first working set, shown as greyed suggestions, styled distinctly (a different tint across the whole row and a thin separator before the first working set), and never counted (already true).

Spec and numbers: `docs/design/PROPOSALS.md` → sections 1 and 2.

## Read first

- `AGENTS.md`; `docs/design/PROPOSALS.md` §1–2; `docs/DESIGN.md` (tokens).
- Core:
  - `src/core/library/Equipment.ts` (`EQUIPMENT`)
  - `src/core/models/Exercise.ts` (equipment, mechanic, movementPattern)
  - `src/core/units/*` (kg/lb, display snapping: reuse it, don't duplicate)
  - `src/core/logging/WorkoutLogger.ts` (adding exercises, starting from a template, `matchPreviousSets`)
  - `src/core/db/migrations.ts` (append-only)
- App:
  - `src/app/features/workout/` (ExerciseCard, set rows, set kinds, `setKindItems.ts`)
  - `src/app/features/exercises/` (exercise detail and edit form)

## Scope

- **Create:**
  - `src/core/units/LoadableWeight.ts` (+ test): `loadableWeights` / `roundToLoadable(weightKilograms, profile, mode: 'nearest' | 'down')`, `loadProfileFor(exercise, unitSystem)`
  - `src/core/logging/WarmupPlan.ts` (+ test): `warmupSets(firstWorkingKilograms, count, profile)` → `{ weightKilograms, reps }[]`; `defaultWarmupCount(exercise)`; `refreshWarmups(...)`
- **Edit:**
  - `migrations.ts`: append `v5-exercise-load-settings`, adding nullable columns to `exercise`:
    - `loadStepKilograms REAL`
    - `barWeightKilograms REAL`
    - `warmupSetCount INTEGER CHECK (warmupSetCount BETWEEN 0 AND 4)`

    NULL means use the default. Update `BackupValidation` expectations only by way of the migration.
  - The Exercise model and editor.
  - `WorkoutLogger` (generate and refresh warm-ups).
  - The worker API (own block `// Warm-ups (T-044)`).
  - Workout screen set rows (warm-up styling, greyed suggestions).
  - Exercise edit form (three optional fields: load step, bar weight, warm-up sets).
  - Docs: ARCHITECTURE concept rows (loadable weight, warm-up plan), DECISIONS entry, DATA (new columns).
- **Do not touch:** charts, analytics, import/export, measurements, backup.

## Specification

**Load profiles (defaults; per-exercise columns override them):**

| Equipment | Profile |
|---|---|
| barbell | bar 20 kg, step 2.5 kg (lb: bar 45, step 5) |
| ez-bar | bar 10 kg |
| trap-bar | bar 25 kg |
| safety-bar | bar 30 kg |
| smith-machine | bar 15 kg |
| plate-loaded | bar 0, plate pairs, step 2.5 kg |
| landmine | bar 20 kg, one side loaded, step 1.25 kg |
| dumbbell, kettlebell | step 2.5 kg from 2.5 (lb: 5 from 5); kettlebell step 4 kg from 4 |
| machine, cable | step 5 kg from 5 (lb: 10) |
| bodyweight, weighted, assisted, band, plate | no rounding (return the input) |

- `roundToLoadable` never returns less than the minimum (the bar, or the smallest dumbbell).
- `'down'` rounds down, `'nearest'` breaks ties downward.
- The unit system is the exercise's entry unit: lb profiles for lb exercises. Stored values stay kilograms exactly as converted.

**Warm-up plan** (`Heuristic:` cite Ribeiro 2021, Motricidade, systematic review of warm-up in resistance training: specific warm-ups at loads near the working load can benefit strength. Studies used 40–80% of the working load):

| Count | Sets (fraction of first working weight × reps) |
|---|---|
| 1 | 0.60 × 6 |
| 2 | 0.50 × 8, 0.75 × 3 |
| 3 | 0.40 × 8, 0.60 × 5, 0.80 × 2 |
| 4 | 0.40 × 8, 0.55 × 5, 0.70 × 3, 0.85 × 1 |

- Rounding: round each set **down** to loadable.
- Drop duplicates, and any set at or above the working weight.
- For barbells, a set at the bar weight is allowed (one "empty bar" set at most).
- `defaultWarmupCount`, unless the exercise overrides it:
  - 3: barbell compounds whose movement pattern is squat, hinge, horizontal or vertical push or pull
  - 2: other compounds
  - 1: isolation
  - 0: bodyweight, band or timed tracking

**In the workout:**
- When an exercise gets a first working set with a weight (from last time, the template or typing), generate the warm-up sets as planned `warmup` sets *before* the working sets.
- When the first working weight changes, refresh only the **uncompleted** warm-up sets.
- A warm-up the owner edited (weight or reps changed by hand) stops auto-refreshing for this workout (track this in memory/UI state; no schema).
- Deleting all warm-ups for an exercise in a workout stops regeneration for that exercise in that workout.
- Count 0 → none.

**UI:**
- Warm-up rows: a distinct tint across the whole row (add a token pair, light and dark, in `tokens.css`), a "W" label in the set column, and a thin separator line between the last warm-up and the first working set.
- Suggested (untouched) values are shown greyed, like "last time" prefill. Ticking a warm-up completes it with the shown values.
- The exercise edit form gets an optional "Loading" group: load step, bar weight (only for bar equipment), warm-up sets (0–4, or Default).

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] LoadableWeight tests (hand-computed):
  - barbell 61 kg → down 60, nearest 60
  - 61.3 → nearest 62.5
  - dumbbell 13.7 → down 12.5
  - lb barbell 137 lb → 135
  - minimum clamps
  - no rounding for bodyweight
- [ ] WarmupPlan tests:
  - 100 kg barbell, 3 → 40×8, 60×5, 80×2
  - 60 kg barbell, 3 → 20×8 (bar), 35×5, 47.5×2
  - dumbbell 22.5, 1 → 12.5×6
  - duplicates dropped
  - nothing at or above the working weight
- [ ] Logger tests: generate on add/start; refresh only uncompleted, unedited warm-ups; count 0.
- [ ] Migration test: v4 → v5 keeps every row; the new columns are NULL.
- [ ] Docs updated.

## Handoff

- **Status:** Implementation complete; verification blocked by two out-of-scope measurement migration test expectations. Changes are uncommitted; the board is untouched, as instructed. Awaiting the owner's scope decision before editing those tests. Not marked done.
- **What was done:** Added exact kg equipment ladders and nullable overrides; v5 appends the three exercise columns. Warm-up schemes generate on add, template start and first typed work load, round down, deduplicate, and exclude loads at/above work. Refresh reuses rows and preserves completed/manually edited slots. Delete-all suppresses regeneration for that entry. The worker retains one logger per database connection. Added optional loading fields, including loading-only editing for built-in exercises; full-row warm-up tint, W labels, a work-set separator and quiet suggested values. Updated concept ownership, data and decisions docs.
- **Files touched:**
  - Core: `src/core/units/LoadableWeight.ts`, `LoadableWeight.test.ts`; `src/core/logging/WarmupPlan.ts`, `WarmupPlan.test.ts`, `WorkoutLogger.ts`, `WorkoutLogger.warmups.test.ts`; `src/core/db/migrations.ts`, `migrations.test.ts`; `src/core/models/Exercise.ts`; `src/core/library/CustomExerciseDraft.ts`, `ExerciseEditError.ts`, `ExerciseEditor.ts`, `ExerciseEditor.test.ts`.
  - Worker: `src/worker/WorkerApi.ts`, `WorkerApi.test.ts` (new methods in the Warm-ups (T-044) block).
  - Exercise UI: `ExerciseActions.tsx`, `ExerciseForm.tsx`, `ExerciseFormScreen.tsx`, `exerciseDraft.ts`, `exerciseDraft.test.ts`, new `ExerciseLoadingFields.tsx`, `LoadingWeightField.tsx`, `LoadingWeightField.module.css` under `src/app/features/exercises/`.
  - Workout UI: `ExerciseCard.tsx`, `ExerciseCard.module.css`, `SetRow.tsx`, `SetRow.module.css`, `SetCell.tsx`, `ValueCell.module.css` under `src/app/features/workout/`; `src/app/design/tokens.css`.
  - Docs: `docs/ARCHITECTURE.md`, `docs/DATA.md`, `docs/DECISIONS.md`, and this Handoff.
- **Public API:** `loadProfileFor(exercise, unitSystem): LoadProfile`, `roundToLoadable(weightKilograms, profile, mode): number`, `loadableWeights(profile, maximumKilograms): number[]`, `isBarEquipment(equipment): boolean`; `warmupSets(firstWorkingKilograms, count, profile): WarmupSuggestion[]`, `defaultWarmupCount(exercise): number`, `refreshWarmups(existing, planned, editedSetIds): RefreshedWarmup[]`, `WarmupSchemes`; `ExerciseEditor.setLoadingSettings(db, id, settings)`; `WorkoutLogger.suggestedWarmupSetIds(entryId)`; worker `suggestedWarmupSetIds(entryId)` and `updateExerciseLoading(exerciseId, settings)`.
- **Decisions taken:**
  - **Arithmetic conflict:** followed the specified 40/60/80% formula and 2.5 kg down rounding. For 60 kg this is **22.5×8, 35×5, 47.5×2**, rather than the brief's 20×8 first set. The 20 kg example requires an additional empty-bar exception, which is not specified; clarification requested.
  - Other bars retain their specified kg minimum in lb profiles; lb kettlebells use 5 lb steps. Overrides stay exact kg when entry units change. Unclassified exercises keep historical/template warm-ups unless a count is explicitly chosen; classified exercises replace inherited prefill with the generated plan (including zero).
  - No schema provenance flags. After a worker reload, existing warm-ups are protected and already-loaded entries with no warm-ups remain suppressed; previously blank work entries can still generate. Protection/suppression is per workout exercise entry.
  - Loading fields on the public Exercise type are optional nullable properties for compatibility with existing in-memory callers; migrated database rows include the columns. Omitted metadata-update fields preserve stored overrides; null resets them. Loading-only saves replace the loading group.
- **Open questions / left over:**
  - Permission requested to update only two hard-coded migration-ID assertions at `src/core/measurements/MeasurementMigration.test.ts:41` and `:135`. Both expect only v4, but the required v5 is correctly also applied. The file remains untouched because measurements are excluded from scope. Its expectations should include `v5-exercise-load-settings`, or derive pending ids from the migration list.
  - Resolve the 60 kg example conflict above before accepting that exact example.
  - Visual/device verification remains for the lead: `make dev` failed with `listen EPERM: operation not permitted 0.0.0.0:5173`; browser automation also reported its host unavailable. Check 430×932, both themes, loading inputs, completion and the separator on iPhone Safari.
- **How it was verified:** `make format` passed. Lint and strict type checks passed. `make build` passed, including the service worker. Full `make verify` was run; with `VITEST_MAX_WORKERS=2`, **861/863 tests passed across 117 files**, with only the two excluded measurement-test assertions failing. All 59 added tests passed, covering load ladders, schemes, protected refresh, logger integration, worker-call lifetime, loading validation and v4→v5 row preservation/null defaults. Unrestricted concurrency also exposed an existing PersonalBests wall-clock timing failure and once an OnDeviceStore timeout; limiting workers avoids that contention without changing tests/config. Context7 React documentation confirmed retaining raw input strings during typing. `git diff --check` passed.
