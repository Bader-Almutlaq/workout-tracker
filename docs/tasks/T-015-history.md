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

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
