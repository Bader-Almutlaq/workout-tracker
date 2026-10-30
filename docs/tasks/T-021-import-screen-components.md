# T-021: Split the import screen into small components

- **Milestone:** W1
- **Depends on:** T-017 (merged)
- **Model tier:** mid

## Goal

The Strong import flow keeps working exactly as it does now, but its code becomes easy for the next agent to read and change: one small component per step and per card, and no line that packs several elements or statements.

## Read first

- `AGENTS.md` (especially *Formatting is automatic* and the UI rules), `docs/DESIGN.md`.
- `src/app/features/import/StrongImportScreen.tsx` and its CSS module (the current, working flow), `src/worker/WorkerApi.ts` → `// Strong import (T-017)`.

## Scope

- **Edit / create:** only files in `src/app/features/import/`.
- **Do not touch:** anything else (the worker API, core, other screens).

## Specification

- Behaviour, wording and appearance stay identical.
- `StrongImportScreen.tsx` keeps the phase state and composes: `ImportPickStep`, `ImportWorkingOverlay`, `ImportReviewStep` (which composes `ImportTotalsSection`, `PoundExercisesSection`, `FindingGroupCard`), `ImportResultStep` and `CorrectSetDialog`. One component per file, named after the file, each with a doc comment.
- Pure helpers (grouping findings, explanation and suggestion text, the correction for a finding) move to `importFindingText.ts` with a Vitest test file (`src/app/**/*.test.ts` runs in `make test`).
- Buttons inside finding cards get proper styles from the design tokens (they currently look like default buttons); keep them compact.
- Run `make format`; `make verify` must pass.

## Acceptance criteria

- [ ] `make verify` passes; new tests for the helpers.
- [ ] No file in `src/app/features/import/` longer than about 150 lines; no JSX line with more than one element.

## Handoff

- **Status:** Implemented; ready for review (uncommitted).
- **What was done:** Split the import flow into step and card components and extracted finding helpers with tests. Preserved existing compact token-based button styles.
- **Files touched:** `src/app/features/import/` components, `importFindingText.ts`, `importFindingText.test.ts`; this handoff.
- **Decisions taken:** Kept phase state and import actions in the screen; reused the existing button styles, which already use design tokens.
- **Open questions / left over:** No simulator or visual comparison was performed.
- **How it was verified:** `make format` and `make verify`.
