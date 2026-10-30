# T-015: Port history queries; History list and workout detail screens

- **Milestone:** W1
- **Depends on:** T-013 (row types)
- **Model tier:** mid

## Goal

The History tab lists every finished workout, newest first, and opening one shows its exercises and sets the way they were typed (kg or lb), matching the native History screens.

## Read first

- `AGENTS.md`, `docs/ARCHITECTURE.md` (layers; how screens read data), `docs/DESIGN.md` (tokens, layout principles), `docs/agents/WORKFLOW.md` → *UI checks*.
- `src/worker/WorkerApi.ts` (how to add a read method), `src/app/data/database.ts` (`useDatabaseQuery`), `src/app/design/components/` (`Screen`, `Section`, `EmptyState`), `src/app/features/settings/SettingsScreen.tsx` (an example screen).
- Native spec: `reference/native/Packages/WorkoutCore/Sources/WorkoutCore/Queries/WorkoutHistory.swift` and `Tests/WorkoutCoreTests/Queries/WorkoutHistoryTests.swift`; screens in `reference/native/App/Features/History/`; weight text in `reference/native/App/DesignSystem/WeightFormatting.swift`.

## Scope

- **Create:** `src/core/queries/WorkoutHistory.ts` (+ test); `src/app/features/history/` (list screen, detail screen, their CSS modules); `src/app/format/weightText.ts` (port of `WeightFormatting.swift`, calling `src/core/units` for the math).
- **Edit:** `src/worker/WorkerApi.ts`: add `historySummaries()` and `workoutDetail(workoutId)` in one block marked `// History (T-015)`. `src/app/App.tsx`: add the route `/history/:workoutId` (handed over to this task).
- **Do not touch:** migrations, core files outside `queries/`, other features.

## Specification

- Port the queries and every test. In-progress workouts never appear (as in the native fix).
- **List:** month section labels (caption style), then one row per workout: name (headline), date and duration (callout, secondary), and on the right the set count and volume in kg (tabular numbers, tertiary). Tapping a row opens the detail. Empty state: "Import your Strong history from Settings."
- **Detail:** back button, title = workout name, date and duration under it; then one `Section` per exercise with a row per set: set label (W / D / F / number), weight in the set's entry unit, × reps, RPE if logged. Workout notes at the end if present.
- Respect safe areas; the tab bar stays visible on the detail screen.

## Acceptance criteria

- [ ] `make verify` passes.
- [ ] Tests: every native `WorkoutHistoryTests` case, ported.
- [ ] UI: list and detail at 430 × 932 in dark and light, empty state, and a workout with a long exercise name. Seed synthetic data for the screenshots through a temporary dev-only step you remove before finishing, or via the import once T-017 lands; say which in the handoff.
- [ ] Docs: tell the lead which concept-table rows to update.

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:** review.
- **What was done:**
  - Ported `WorkoutHistory.swift` to `src/core/queries/WorkoutHistory.ts` (`workoutSummaries`, `workoutSummary`, `workoutDetail`) and both native test cases, plus extra cases (in-progress excluded, unit kept per set, notes, empty workout, single summary).
  - Added `groupWorkoutsByMonth` (`WorkoutMonthGroups.ts`) so the month grouping is tested core logic rather than component code; it groups in the phone's time zone.
  - `WorkerApi`: `historySummaries()` and `workoutDetail(workoutId)` in the `// History (T-015)` block (plus one import line at the top of the file).
  - Screens: `HistoryScreen` (month sections, rows with name, day, duration, set count and volume in kg, empty state "Import your Strong history from Settings.") and `WorkoutDetailScreen` (back link, title, date and duration, one `Section` per exercise with set rows, exercise notes as the section footnote, workout notes last). Route `/history/:workoutId` in `App.tsx`.
  - Formatting in `src/app/format/`: `weightText.ts` (port of `WeightFormatting.swift`; math via `displayValue`), `dateText.ts`, `setText.ts`, `formatLocale.ts`.
  - New generic components in `src/app/design/components/`: `BackLink`, `LinkRow` (row with chevron). `Screen` gained optional `leading` and `subtitle` props (existing screens render the same).
- **Files touched:** `src/core/queries/{WorkoutHistory,WorkoutMonthGroups}.ts` and tests, `src/core/queries/fixtures/historyFixture.ts`; `src/app/format/*`; `src/app/features/history/*`; `src/app/design/components/{BackLink,LinkRow,Screen}*`; `src/app/App.tsx`; `src/worker/WorkerApi.ts`; this file and the board.
- **Decisions taken:**
  - The summary also returns `endedAt`, which the native `Summary` lacked, because the brief wants the duration on each row.
  - Numbers and dates are always written in `en-US` (`FORMAT_LOCALE`), not the phone's locale, so Arabic-region phones don't switch to Arabic-Indic digits in the tabular columns. Say if you want the device locale instead.
  - Tests use a small direct-SQL fixture (`historyFixture.ts`, same data as the native older-layout fixture) because the importer is not ported yet (T-014). Switch to the importer once it lands if you prefer.
  - `workoutSummary(db, id)` is ported though nothing calls it yet; the live-workout summary will.
- **Open questions / left over:**
  - `vitest.config.ts` only includes `src/core/**` and `tools/**`, so the three `src/app/format/*.test.ts` files (11 tests, passing) do not run in `make test`. Lead: add `'src/app/**/*.test.ts'` to `include`. I ran them with a temporary config.
  - `TabBar` uses `end` on every tab, so on `/history/:id` no tab is highlighted. Lead: set `end` only for `/` so History stays active.
  - Safari simulator: only the empty state could be captured (see below).
- **Concept-table rows for the lead:**
  - History list and workout detail queries: `src/core/queries/WorkoutHistory.ts` (already listed; drop "to port").
  - Month grouping of the history list: `src/core/queries/WorkoutMonthGroups.ts`.
  - Weight, volume, RPE, set-label, date and duration text: `src/app/format/` (`weightText.ts`, `setText.ts`, `dateText.ts`; locale in `formatLocale.ts`).
  - Back link and tappable chevron row: `src/app/design/components/BackLink.tsx`, `LinkRow.tsx`.
- **How it was verified:** `make verify` passes (58 tests in `make test`, plus 11 format tests run separately). Synthetic data was seeded through a temporary `devExec(sql)` method in `WorkerApi` and a temporary `devSeed.ts` imported from `main.tsx`; both are removed (`grep TEMPORARY src` is empty). In the built-in browser pane at 430 x 932 I checked the list (two months, long workout name wrapping, a workout with no end time), the detail (warm-up, working, failure and drop labels, RPE 8.5, lb sets showing 135 lb and 100 lb, bodyweight sets, exercise and workout notes, "Triceps Pushdown (Cable - Straight Bar)"), the empty state and the loading state, in dark and light. The browser pane cannot save files, so those checks have no saved images. In Safari on the iPhone 15 Pro Max simulator the empty state in dark mode is saved at `build/screenshots/T-015-history-empty-dark.png`; after that the simulator's Safari stopped loading the dev server (first an OPFS "invalid state" from leftover tabs, then page loads hanging after a simulator reboot), so list and detail were not captured there.
