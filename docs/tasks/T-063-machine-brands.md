# T-063: Machine manufacturer per exercise, with a per-machine chart filter

- **Milestone:** R2/R5 (machines) · **Depends on:** T-057 (exercise page), T-060 (progression), T-062 (deload, migration v9) · **Model tier:** mid (Codex Terra)

## Goal

The owner's decision (`docs/design/PROPOSALS.md` → *Owner decisions*, Machines and attachments):

- On machine exercises the owner picks the **manufacturer from a list** (Panatta, Atlas, Hammer Strength…) instead of typing it.
- Loads differ widely between machines, so "last time" values and progression follow the machine.
- Exercise charts can show all machines together or **one machine**.

Attachments and grips (also in §8) are **not** part of this task.

## Read first

- `AGENTS.md`; `docs/design/PROPOSALS.md` §8 and *Owner decisions*; `docs/design/PAGES-2026-10-31.md` → Live workout (the info line shows the machine).
- Core:
  - `src/core/db/migrations.ts` (append only)
  - `src/core/library/Equipment.ts`
  - `src/core/queries/PreviousPerformance.ts`, `LiveWorkout.ts`, `ExerciseSeries.ts`, `WorkoutHistory.ts`, `TemplateCatalog.ts`
  - `src/core/logging/WorkoutLogger.ts` (starting from a template, adding an exercise, setting the deload stage: the model for a per-exercise setting)
  - `src/core/templates/TemplateDraft.ts`, `TemplateStore.ts`
  - `src/worker/WorkerApi.ts`
- App:
  - `src/app/features/workout/` (`exerciseMenuItems`, `ExerciseInfoLine`, `DeloadChip`, as the model for a small chip)
  - `src/app/features/templates/` (`TemplateExerciseCard`, `ProgressionControl`, as the model for a per-exercise control)
  - `src/app/features/exercises/ExerciseChartsTab.tsx`, `ExerciseHistoryTab.tsx`
  - `src/app/design/` (sheet and list components; reuse, don't create new primitives)

## Scope

- **Create:**
  - `src/core/library/MachineBrands.ts` (+ test): the frozen list, the "is this a machine exercise" test, and name validation
  - `src/app/features/workout/MachineBrandSheet.tsx` (+ test): the picker
- **Edit:**
  - migrations: append `v10-machine-brand`, adding a nullable `machineBrand TEXT` to both `workoutExercise` and `templateExercise` (NULL = not recorded)
  - models, logger, template draft and store, queries listed above, worker API
  - live workout menu and info line, template editor card, exercise Charts and History tabs
  - docs (DATA: the new columns; ARCHITECTURE: a row for MachineBrands; DECISIONS: one entry)
- **Do not touch:** CSV import/export formats, measurements, Dropbox, analytics formulas, the Analytics tab, warm-up and deload rules.

## Specification

1. **The list** (`MachineBrands.ts`):
   - `MACHINE_BRANDS`: a frozen, alphabetical array of display names: Arsenal Strength, Atlantis, Atlas, BH Fitness, Cybex, Freemotion, Gym80, Hammer Strength, Hoist, Keiser, Life Fitness, Matrix, Nautilus, Newtech, Panatta, Precor, Prime, Star Trac, Technogym. Doc comment: it's a convenience list, not exhaustive.
   - `usesMachineBrand(equipment)`: true for `machine`, `plate-loaded`, `cable` and `smith-machine`; false otherwise and for null.
   - `normalizeMachineBrand(text)`: trims and collapses spaces; empty → null; longer than 40 characters → a `MachineBrandError` the owner can read. Matching against the list is case-insensitive and returns the list's spelling ("hammer strength" → "Hammer Strength").
2. **Picking it in a workout:**
   - For exercises where `usesMachineBrand` is true, the exercise ⋯ menu gets **Machine…** (a suitable lucide icon).
   - It opens `MachineBrandSheet`: brands the owner has used before for any exercise first (most recent first), then the rest of the list, then **Other…** (a text field, saved through `normalizeMachineBrand`), and **None** when one is set.
   - Choosing saves `workoutExercise.machineBrand` immediately through the worker.
   - The info line shows the brand (e.g. "Panatta") alongside rest time and the deload chip. Tapping it reopens the sheet.
3. **Defaults when an exercise enters a workout:**
   - Started from a template whose exercise has a brand: copy it.
   - Otherwise: the brand of that exercise's most recent finished session, if it had one.
   - Otherwise NULL.
4. **Templates:** the template editor card shows the same control for machine exercises ("Machine: None / Panatta…", opening the same sheet). Saved in `templateExercise.machineBrand` and preserved by every template edit path.
5. **Previous values and progression follow the machine:**
   - When the current exercise has a brand, `previousPerformance` prefers the most recent finished session **with the same brand** (same template first, as today).
   - If no session with that brand exists, it falls back to today's choice and reports that the values came from another machine (or an unrecorded one). The info line then says "Previous: other machine", and **no progression suggestion** is made from those values.
   - With no brand set, behaviour is unchanged.
6. **History and charts:**
   - Exercise History tab: each session shows its brand when recorded.
   - Exercise Charts tab: when the exercise's sessions have **two or more distinct brands** (counting "not recorded" as one), a row of chips above the charts: **All machines**, then each brand, then **Not recorded**. Default All. Choosing one filters every series on the tab (including the full-screen view) to those sessions. The choice lives in the URL (`?machine=`), like `?tab=`.
   - With fewer than two, no chips are shown.
   - Records stay across all machines.
7. **Backups:** the columns are part of the database, so JEM backups carry them. Check the backup validation still passes.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] `MachineBrands` tests: list frozen and sorted, `usesMachineBrand` per equipment, normalization (trim, case match to list spelling, empty → null, too long → error).
- [ ] Migration test v9 → v10 keeps every row; new columns NULL; backup validation passes.
- [ ] Logger/worker tests: set and clear a brand; default from template; default from last session; template save and edit keep the brand.
- [ ] `previousPerformance` tests: same brand preferred over a newer session on another brand; fallback flagged as other machine; no brand → unchanged behaviour. Progression gives no suggestion from another machine's values.
- [ ] `ExerciseSeries` (or the Charts tab helper) tests: filtering by brand and by "not recorded"; chips hidden with fewer than two distinct values.
- [ ] Sheet test: used brands first, Other saves a normalized name, None clears.
- [ ] Docs updated.
- [ ] Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

**Round 2 core and worker implemented; Round 3 screens remain.**

- `WorkoutLogger.setMachineBrand` normalizes or clears the manufacturer. Template starts copy their brand, otherwise new entries use the latest finished entry's brand. `usedMachineBrands` returns finished-session names newest first, deduplicated without regard to case.
- `machinePreviousPerformance` selects the same occurrence and brand before falling back; live entries expose `previousOtherMachine`, and progression suggestions are suppressed on fallback. Deload calculations remain unchanged.
- `ExerciseSeries` exposes `machineEntries`, `machineBrands` and `filterMachine`; filtering works at occurrence/set level within a session. Worker `exerciseCharts(exerciseId, machine?)` uses omitted argument for all, `null` for unrecorded, and a string for a brand. `exerciseHistory` and workout detail expose brands per entry. Records remain unfiltered.
- Round 3 must implement the picker, live and template controls, history labels and URL-backed chart chips, including full-screen filtering. Existing session aggregation can contain several `machineEntries`.
- `make format` and `make verify` passed: 166 test files, 1,245 tests, production build. No commit or board change.

## Round 2 (lead): core and worker

The list, migration and template storage are reviewed and committed. Finish the **core and worker** part now; the screens come in Round 3. Do all of it in this run.

- Move the 40-character limit into a named frozen constant (`MachineBrandLimits`) with its `Heuristic:` note.
- `WorkoutLogger` and the worker API: set and clear a workout exercise's brand (normalized); defaults when an exercise enters a workout (spec 3); a query for the brands used before, most recent first.
- `previousPerformance` follows the machine (spec 5): same brand first (same template first), matching the **occurrence and the brand together** for repeated entries; otherwise fall back and report it came from another machine. Return that flag in the live workout data so the screen can show "Previous: other machine".
- Progression gives no suggestion from another machine's values.
- `LiveWorkout`, `WorkoutHistory` and `ExerciseSeries` (or the Charts helper) expose the brand per entry/session, plus the distinct brands of an exercise and a filter by brand or "not recorded".
- Tests for every item, as listed in the acceptance criteria. `make format` and `make verify` must pass. Update the Handoff.

## Round 3 (lead): screens, plus one core fix

Round 2 is reviewed and committed. Do all of this in this run.

- **Core fix:** in `LiveWorkout`, deload's `prior` and `deloadBaseline` still pick the previous entry on any machine, while the greyed values follow the brand. When the entry has a brand, both should prefer the previous entries **with the same brand** (fall back to today's behaviour when none). Keep `DeloadPlan` itself unchanged. Add a test: deload on Panatta after a heavier Hammer Strength session suggests from the Panatta baseline.
- **Screens** (spec 2, 4 and 6):
  - `MachineBrandSheet` (+ test) and the **Machine…** item in the exercise ⋯ menu, only when `usesMachineBrand` is true.
  - The brand on the info line (tap reopens the sheet) and "Previous: other machine" when `previousOtherMachine` is true.
  - The template editor card control.
  - The History tab label per session, and the Charts tab chips with `?machine=` (hidden with fewer than two distinct values; the full-screen view respects the filter).
- Components stay small, use existing design components and tokens, and work at 430 × 932 in dark and light.
- `make format` and `make verify` must pass. Update the Handoff.
