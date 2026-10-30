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

- **Status:** · **What was done:** · **Files touched:** · **Decisions taken:** · **Open questions / left over:** · **How it was verified:**
