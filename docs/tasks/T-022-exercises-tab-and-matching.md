# T-022: Exercises tab and Strong matching screen

- **Milestone:** W2
- **Depends on:** T-019, T-020 (merged)
- **Model tier:** mid

## Goal

The Exercises tab lets the owner find any of the 420 exercises in about two keystrokes, see which muscles it trains and its recent history, and create, edit, archive or duplicate their own exercises. A "Match Strong exercises" screen in Settings links imported Strong names to library exercises (merging their history), with suggestions. Both rebuild the native screens on the web.

## Read first

- `AGENTS.md`, `docs/DESIGN.md`, `docs/agents/WORKFLOW.md` → *UI checks*, `docs/ARCHITECTURE.md` (layers; how screens read and write data).
- The native briefs are the specification for layout and behaviour: `docs/tasks/T-004-exercises-tab.md` and `docs/tasks/T-005-strong-matching.md`. Native screens: `reference/native/App/Features/Exercises/` and `reference/native/App/Features/Matching/`.
- Core you call (through the worker): `src/core/queries/ExerciseCatalog.ts` (`entries`, `detail`, `unmatchedImports`), `src/core/library/ExerciseSearch.ts` (search runs **in the screen**: fetch the entries once, keep an `ExerciseSearch` in memory and search on each keystroke; the app may import pure core modules, never `core/db`), `src/core/library/ExerciseEditor.ts`, `CustomExerciseDraft.ts`, vocabularies (`Muscle`, `Equipment`, …).
- `src/worker/WorkerApi.ts` (method conventions; `liveStore()`; notify listeners after writes), `src/worker/OnDeviceStore.ts` (`takeSnapshot`), existing components in `src/app/design/components/`, `src/app/features/history/` (a finished screen to copy patterns from).

## Scope

- **Create:** `src/app/features/exercises/` and `src/app/features/matching/` (one component per file, CSS modules), plus generic components in `src/app/design/components/` if needed (search field, chip, sheet).
- **Edit:** `WorkerApi.ts` (one block `// Exercises (T-022)`: catalog entries, detail, unmatched imports, create/update/archive, merge and mergeAll; **merges take `store.takeSnapshot()` first**), `App.tsx` (routes `/exercises/:exerciseId`, `/exercises/new`, `/exercises/:exerciseId/edit`, `/settings/matching`; handed over), `SettingsScreen.tsx` (a "Match Strong exercises" row with the unmatched count, shown only when the count is above zero).
- **Do not touch:** core, `src/app/features/import/` and `src/core/logging` (other agents are working there).

## Specification

- Follow T-004 and T-005 for content and states; translate SwiftUI patterns to the web: sheets become full-screen routes with a back link; swipe actions become an explicit button on the detail screen.
- Search input is 16 px (no iOS zoom), has a clear button, and the list stays responsive on every keystroke.
- Filters (muscle, equipment, custom) are one horizontally scrolling row of chips under the search field.
- Run `make format`; `make verify` must pass.

## Acceptance criteria

- [ ] `make verify` passes; tests for any pure helper you add.
- [ ] UI: at 430 × 932, dark and light: list, search with a typo ("lateral rasie"), a filter, detail, create, edit, archive; matching with suggestions and a merge that moves history. Use synthetic data (the import screen with a small CSV you write, never the owner's export).

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
