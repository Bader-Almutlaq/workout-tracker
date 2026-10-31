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

_Filled in by the implementer when stopping or finishing._
