# T-031: Template follow-ups

- **Milestone:** W4 · **Depends on:** T-029 (merged) · **Model tier:** mid

## Goal

Three small gaps in the template screens: reorder templates within a folder, ask "Discard changes?" when leaving the editor with unsaved edits, and label the rep fields as seconds for timed exercises.

## Read first

`AGENTS.md`, `docs/tasks/T-029-template-screens.md` (its Handoff lists these gaps), `src/app/features/templates/`, `src/core/templates/TemplateStore.ts` (`reorder`), `src/core/library/ExerciseTracking.ts`, `src/app/design/components/ConfirmDialog.tsx`.

## Scope

- **Edit / create:** files in `src/app/features/templates/` only, plus the `// Templates (T-029)` block in `src/worker/WorkerApi.ts` if a method is missing. If the editor needs each exercise's tracking kind, add it to `TemplateCatalog.detail` and the picker data through the smallest change, and say so in the handoff.
- **Do not touch:** `src/core/analytics`, the workout logging screen, History.

## Specification

- **Reorder:** in a folder's ⋯ menu or on long-press of a template row, "Move up" / "Move down" (no drag needed).
- **Discard prompt:** leaving the editor (back link or tab) with changes since the last save asks "Discard changes?" with Discard / Keep editing. No prompt when nothing changed.
- **Seconds:** for exercises tracked by duration (`duration`, `weight-duration`), the rep-range fields read "Seconds" and the target text reads "30–45 s".
- `make format`; `make verify` must pass; tests for any pure helper.

## Handoff

- **Status:** review; changes left uncommitted as requested.
- **What was done:** Added template move up/down in the row menu, also opened by long-press; guarded editor back-link and tab navigation when the draft differs from its saved state; labelled duration targets in seconds in the editor, number pad, accessibility labels and preview.
- **Files touched:** `src/app/features/templates/` components, actions, target formatting, new tracking and navigation hooks and helper tests; this handoff.
- **Decisions taken:** Reorder positions are relative to the current folder, including unfiled templates. Tracking is fetched for the exercises in the draft via the existing `exerciseDetail` worker API, including archived exercises; no core or worker API change was needed. A 500 ms hold opens the existing row menu. Navigation checks the draft against its initial state and saving navigates directly after success.
- **Open questions / left over:** Browser history gestures and page unload are not guarded; the requested back link and tabs are. T-029 notes that starting a template copies the target into reps even for timed exercises; this task changes labels only, within its scope. UI checks, including long-press on iPhone, remain for the lead: `make dev` could not bind the local port in this sandbox (EPERM).
- **How it was verified:** `make format` and `make verify` passed: 75 test files, 473 tests, lint, types and production build. Added two tests covering duration kinds, labels and target formatting.
