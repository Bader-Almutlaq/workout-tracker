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

- **Status:** · **What was done:** · **Files touched:** · **Decisions taken:** · **Open questions / left over:** · **How it was verified:**
