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

- **Status:** review.
- **What was done:**
  - Exercises tab: search with a clear button (16 px input), one scrolling row of chips (Muscle and Equipment open the phone's own picker, "Mine" toggles), Recent (8) and A–Z lists, ranked results, "No match" with a Create button, "+" button. The typed text and filters are remembered until the app is closed, so Back from an exercise shows the same list.
  - Exercise detail: muscles (primary/secondary chips) and traits, usage, last 10 sessions, aliases, and actions: Duplicate as my own (built-in), Edit (own and Strong), Archive/Unarchive.
  - Create, duplicate and edit share one form screen with inline error text (for example a name already in use).
  - "Match Strong exercises" screen: one card per imported exercise with up to 3 suggestions, "Search library…", "Keep as my own", a confirmation before every merge, "Match all suggested" with the pairs listed, and the "All matched" state. A Settings row with the count appears only when the count is above zero.
  - `WorkerApi` block `// Exercises (T-022)`: `exerciseEntries`, `exerciseDetail`, `unmatchedImports`, `createExercise`, `updateExercise`, `setExerciseArchived`, `mergeExercise`, `mergeExercises`. Both merge methods take one `takeSnapshot()` first; `mergeExercises` runs all pairs in one transaction.
- **Files touched:**
  - Created `src/app/features/exercises/`, `src/app/features/matching/`, and generic components in `src/app/design/components/`: `Button`, `LinkButton`, `Chip`, `ToggleChip`, `SelectChip`, `SearchField`, `TextField`, `SelectField`, `CheckboxField`, `ConfirmDialog` (`Field.module.css` is shared by the three fields).
  - Edited `src/worker/WorkerApi.ts`, `src/app/App.tsx` (routes `/exercises/new`, `/exercises/:exerciseId`, `/exercises/:exerciseId/edit`, `/settings/matching`), `src/app/features/settings/SettingsScreen.tsx`, and `src/app/format/dateText.ts` (+ test): added `dayWithYearText`.
  - Tests: `exerciseText`, `exerciseSections`, `exerciseDraft`, `exerciseBrowseState`, `returnPath`, `matchingPlan`, and `dayWithYearText`.
- **Decisions taken:**
  - Sheets became full-screen routes. Duplicate is `/exercises/new?copy=ID` and "Create “query”" is `/exercises/new?name=…`, so a reload keeps the form's starting point.
  - "Keep as my own" opens the normal edit screen (`/exercises/ID/edit?next=/settings/matching`) instead of a second muscle form, so there is one muscle picker. Saving returns to the matching screen. `next` is accepted only when it is a path starting with a single "/".
  - The muscle picker is two groups of toggle chips by region inside the form (primary, then secondary with the primary muscles disabled), not a separate screen.
  - "Match all suggested" merges only the top suggestion of each exercise that has one; it is one snapshot and one transaction.
  - Search runs in the screen on `ExerciseSearch`; the typed text is deferred with `useDeferredValue` so typing stays responsive.
  - Strong exercises show a "Custom" badge, as in the native app (`isCustom` is `source !== 'library'`).
  - No section index on the A–Z list, and the search field is not sticky (a sticky bar needs a safe-area decision; ask if wanted).
- **Open questions / left over:**
  - For the lead: `docs/ARCHITECTURE.md` concept table needs rows for the new pieces (exercise list text and sections, merge suggestions: `src/app/features/exercises/`, `src/app/features/matching/matchingPlan.ts`, and the new design components). I did not edit it (lead-only file).
  - `copyExerciseDraft` in core takes a `LibraryExercise`; the screen needs a draft from a database exercise, so `exerciseDraft.ts` builds it (same " (Copy)" suffix). Could be unified in core.
  - Not checked on a real iPhone or the Simulator: the native `<select>` pickers of the filter chips, and the `<dialog>` styling on iOS Safari.
  - Light mode was checked on detail, matching, the library picker and the confirm dialog; the list and form were checked in dark only.
- **How it was verified:** `make verify` passes. In the browser at 430 × 932 with a synthetic CSV (6 exercises, 12 workouts, imported through Settings): list, "lateral rasie" typo search, Side delts filter, detail, duplicate and create, edit with a name-in-use error then a good save, archive and unarchive text, no-match with Create, Settings row with count, matching with suggestions, single merge (history moved: the library exercise now shows 12×), library search and pick, "Match all suggested" with its confirmation, "Keep as my own" returning to matching, and the "All matched" state.
