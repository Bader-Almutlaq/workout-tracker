# T-029: Template screens

- **Milestone:** W4 · **Depends on:** T-028 (template engine, merged before this starts) · **Model tier:** mid

## Goal

On the Workout tab the owner sees their templates, grouped in folders, and starts one with a tap. They can create and edit templates (exercises in order, supersets, the number and kind of sets, and optional rep ranges and RPE they write themselves), organise folders, and save a just-finished workout as a template from its summary.

## Read first

- `AGENTS.md` (measure, don't prescribe: targets are the owner's, empty by default), `docs/DESIGN.md`, `docs/agents/WORKFLOW.md` → *UI checks*.
- Core from T-028: `src/core/templates/` (`TemplateStore`, `TemplateDraft`, errors), `src/core/queries/TemplateCatalog.ts`, `WorkoutLogger.startFromTemplate`.
- App: `src/app/features/workout/` (`StartWorkout.tsx`, `RecentWorkouts.tsx`, the exercise picker `AddExerciseScreen.tsx`/`ExercisePicker.tsx` to reuse for adding exercises, `SavedWorkoutSummary.tsx`), `src/app/design/components/` (Button, ActionMenu, ConfirmDialog, TextField, SwipeToDelete…), `src/worker/WorkerApi.ts`.

## Scope

- **Create:** `src/app/features/templates/` (list section, folder header, template row, editor screen, set-target editing, folder management, save-as-template dialog), pure helpers with tests (draft editing: add/remove/move exercise, add/remove set, toggle superset with the next exercise, target text like "8–12 @ RPE 8").
- **Edit:** `WorkerApi.ts` (block `// Templates (T-029)`: catalog, detail, save, rename, delete, duplicate, move, reorder, folders, createFromWorkout, startFromTemplate; writes notify listeners), `App.tsx` (routes `/workout/templates/new`, `/workout/templates/:templateId`; handed over), `StartWorkout.tsx` (a Templates section between "Start empty workout" and "Repeat a past workout"), `SavedWorkoutSummary.tsx` ("Save as template" action).
- **Do not touch:** core (report problems in the handoff), History.

## Specification

- **List:** folders as section labels (caption style) with their templates; unfiled templates under "Templates". A row shows the name, the exercise names (one line, truncated) and "Last done 3 days ago" if started before. Tapping a row shows a compact preview sheet with **Start** and **Edit**; a ⋯ menu offers Duplicate, Move to folder, Delete (confirm). "New template" and "New folder" are quiet buttons at the end of the section.
- **Editor:** name, folder, notes; a list of exercises (add via the existing picker), each with its sets as rows: kind (tap to cycle Working / Warm-up / Drop / Failure), rep range (two small fields), RPE (optional). Add set, remove set, move exercise up/down, "Superset with next". Inputs that take numbers use the app's number pad, not the iOS keyboard. Save validates through core and shows its error message.
- **Start** from a template behaves like Start empty workout (one workout at a time; if one is in progress, say so and offer to resume it).
- **Save as template** on the finish summary opens a name field prefilled with the workout name and a folder choice.
- Run `make format`; `make verify` must pass.

## Acceptance criteria

- [ ] Tests for the pure helpers.
- [ ] UI at 430 × 932, dark and light: create a folder and a template with a superset and rep ranges; start it (sets pre-filled from history where it exists); finish; save a workout as a template; duplicate, move and delete.

## Handoff

- **Status:** review (all acceptance items done; `make verify` passes).
- **What was done:** Templates section on the Workout tab (unfiled under "Templates", then each folder; row = name, one-line exercise names, "Last done …"; ⋯ menu Duplicate / Move to folder / Delete with confirm; folder ⋯ menu Rename / Move up / Move down / Delete folder; New template and New folder as quiet buttons). Tapping a row opens a bottom preview sheet (exercises with their sets as runs, e.g. "3 × 8–12 @ RPE 8") with Start and Edit. Editor at `/workout/templates/new` and `/workout/templates/:templateId`: name, folder, notes; exercise cards with set rows (tap the kind to cycle Working / Warm-up / Drop / Failure, reps from / to and RPE on the app's number pad, empty by default), Add set (copies the previous set), remove set, ⋯ menu Move up / Move down / Superset with next / Remove exercise; Add exercise swaps the form for the existing picker and back without losing the draft; Save shows the template store's own message. "Save as template" on the finish summary (name prefilled, folder choice when folders exist, becomes a quiet "Saved as template …" line). Start from a template goes through the logging queue like Start empty workout.
- **Files touched:** new `src/app/features/templates/` (components, `useTemplateEditor`, `useTargetPad`, pure helpers `templateExerciseEdits`, `templateSetEdits`, `targetText`, `setRunsText`, `lastDoneText`, `FolderChoice`, `exerciseNames`, with tests for each helper); new `src/app/design/components/BottomSheet.*` and `BackButton.tsx`; edited `src/worker/WorkerApi.ts` (block `// Templates (T-029)`), `src/app/App.tsx` (two routes), `StartWorkout.tsx`, `SavedWorkoutSummary.tsx`. Small edits outside the scope list, both needed to reuse existing code: `ExercisePicker.tsx` now takes `onAdd(exerciseIds)` instead of `workoutId` (`AddExerciseScreen.tsx` passes the old behaviour), and `typeKey` moved from `useCellEditor.ts` into `numberDraft.ts` (with a test) so the template pad shares it.
- **Decisions taken:** (1) A new exercise starts with one blank set; the owner adds more (no default set count, so nothing is prescribed). (2) Superset rules live in `templateExerciseEdits.ts`: groups are renumbered 1, 2, … and a one-member group dissolves; moving an exercise past a whole superset jumps over it, and moving past the end of its own superset takes it out. (3) Number pad writes each key straight into the draft; validation is only core's, on Save (so RPE 11 is accepted on the pad and refused on Save with "RPE must be between 1 and 10."). (4) Template list writes go through `loggingQueue`, so failures show in the existing banner. (5) `WorkerApi.startFromTemplate` refreshes all screens before throwing when a workout is already in progress, so the stale start screen is replaced by the workout in progress (the resume) and its banner says why. (6) Rows use `ActionMenu`, so the card has no `overflow: hidden` and the row highlight can poke over the card's rounded corners by a pixel.
- **Open questions / left over:** `docs/ARCHITECTURE.md` concept table is lead-only: suggested rows "Template draft edits (add/move exercise, superset, set targets)" → `src/app/features/templates/templateExerciseEdits.ts` / `templateSetEdits.ts`, and "Target text ('8–12 @ RPE 8')" → `targetText.ts`. Rep fields are always "Reps"; for timed exercises the same numbers would be seconds, and the picker's entries carry no tracking kind, so the editor can't label them (core: `startFromTemplate` copies `targetRepsLow` into the set's reps). No "discard changes?" prompt when leaving the editor with edits. Reordering templates inside a folder (`reorderTemplate`) is in the API but has no screen yet (the brief didn't ask for one). The already-in-progress path was not exercised on screen (the list is only shown when nothing is in progress). The set count on a template made from a workout with no completed sets is whatever core copies.
- **How it was verified:** `make verify` (lint, types, 471 tests, build). On screen at 430 × 932, dark and light, with a synthetic Strong CSV imported through Settings: created a folder; created a template in it with three exercises, a superset, a warm-up set, rep ranges and RPE; saved with an empty name (core message shown) and with RPE 11 (core message shown); previewed and started it (sets pre-filled from history, rep targets applied); finished and saved the workout as a template with a long name; duplicated, moved to a folder and deleted a template; opened the folder menu; opened an existing template in the editor. The browser console showed only the two expected save errors.
