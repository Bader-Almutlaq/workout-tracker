# T-028: Template engine: folders, templates, start from a template, save a workout as a template

- **Milestone:** W4 · **Depends on:** migration `v3-templates` (merged) · **Model tier:** mid

## Goal

WorkoutCore can store the owner's workout templates in folders, edit and reorder them, start a workout from one (sets pre-filled from last time, the template deciding how many sets and their kinds), and save a finished workout as a new template. Templates are the owner's own plan: the app never fills in targets.

## Read first

- `AGENTS.md`, `docs/DATA.md` → *Logging state*, `src/core/db/migrations.ts` → `v3-templates` (the schema; read every column comment).
- `src/core/logging/WorkoutLogger.ts` (`start`, `addExercise`: how sets are pre-filled from `previousPerformance`; position renumbering through negative values), `src/core/queries/PreviousPerformance.ts`, `src/core/library/ExerciseEditor.ts` (`mergeAll`).

## Scope

- **Create:** `src/core/templates/` with `TemplateStore.ts` (+ test), `TemplateStoreError.ts`, `TemplateDraft.ts` (the plain-data shape the editor saves), `src/core/models/Template.ts`, `TemplateFolder.ts`, `TemplateExercise.ts`, `TemplateSet.ts` (row types + `from…Row` like the other models), `src/core/queries/TemplateCatalog.ts` (+ test).
- **Edit:** `WorkoutLogger.ts`: add `startFromTemplate(templateId, now)` (+ tests in `WorkoutLogger.test.ts`). `ExerciseEditor.ts`: `mergeAll` must also move `templateExercise` rows from source to target (+ a regression test), or merging an exercise used in a template fails on the foreign key.
- **Do not touch:** migrations, the app, the worker, `src/core/queries/WorkoutHistory.ts` (another task edits it).

## Specification

- **Folders:** create, rename, delete (its templates move to "no folder", keeping their order after the existing unfiled ones), reorder.
- **Templates:** `save(draft, now)` creates or replaces a template's exercises and sets in one transaction (`updatedAt` = now); rename, move to a folder, reorder within a folder, duplicate ("… copy"), delete. A draft is `{ name, folderId, notes, exercises: [{ exerciseId, supersetGroup, notes, sets: [{ kind, targetRepsLow, targetRepsHigh, targetRpe }] }] }`. Validation errors (empty name, no exercises, an exercise with no sets, targetRepsHigh < targetRepsLow, RPE outside 1–10) are `TemplateStoreError` kinds with owner-readable messages.
- **From a workout:** `createFromWorkout(workoutId, name, folderId, now)` copies the finished workout's exercises (order, supersets) and each set's kind; targets are left empty.
- **Start:** `WorkoutLogger.startFromTemplate(templateId, now)` starts a workout named after the template with `templateId` set, sets `template.lastStartedAt`, and for each template exercise adds an entry (with its superset group) and exactly the template's sets: set *i* takes the kind from the template and weight, reps, RPE and duration from the previous session's set *i* if there is one; otherwise weight 0 and reps = `targetRepsLow ?? 0`. All in one transaction; fails like `start` if a workout is already in progress.
- **Catalog:** `TemplateCatalog.list(db)` returns folders (in order) each with their templates, plus unfiled templates, each template with its exercise names and set count, `lastStartedAt`; `detail(db, templateId)` returns the full draft for the editor. Plain data.
- Run `make format`; `make verify` must pass.

## Acceptance criteria

- [ ] Tests for every operation above, including: deleting a folder keeps its templates; starting from a template with and without history; set count follows the template, not history; the merge regression.

## Handoff

- **Status:** · **What was done:** · **Files touched:** · **Decisions taken:** · **Open questions / left over:** · **How it was verified:**
