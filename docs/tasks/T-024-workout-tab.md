# T-024: Workout tab: live logging screen

- **Milestone:** W3
- **Depends on:** T-022 (exercise picker reuses its search), T-023 (logging core), both merged before this starts
- **Model tier:** mid (the most important screen: the lead reviews closely)

## Goal

The owner logs a session on the phone at the gym: start an empty workout (or repeat a recent one), add exercises with sets pre-filled from last time, complete a set done the same as last time in one tap, change weight and reps on a large number pad with a kg/lb toggle, and finish with a plain summary. A suspicious set asks "Is this right?" before it is completed. This rebuilds the native Workout tab.

## Read first

- `AGENTS.md`, `docs/DESIGN.md` (*Layout principles*: the logging screen is the most important screen; 2–3 taps per set), `docs/DATA.md` → *Logging state*.
- **The specification is the native brief `docs/tasks/T-010-logging-screen.md`** (number pad, set rows, finish flow, tracking kinds), plus `docs/tasks/T-009-live-set-check.md` for the prompt. Native screens: `reference/native/App/Features/Workout/`.
- Core: `src/core/logging/WorkoutLogger.ts`, `src/core/queries/LiveWorkout.ts`, `PreviousPerformance.ts`, `src/core/validation/LiveSetCheck.ts`, `src/core/queries/WorkoutHistory.ts` (`workoutSummary` for the finish summary), units in `src/core/units/`.
- App: `src/app/features/exercises/` (reuse its search/picker pieces; don't copy them), `src/app/format/`, `src/app/design/components/`, `src/worker/WorkerApi.ts`.

## Scope

- **Create:** `src/app/features/workout/` (replace the placeholder screen), small generic components in `src/app/design/components/` if needed.
- **Edit:** `WorkerApi.ts` (block `// Workout (T-024)`: one method per logger action plus `liveWorkout()`, `recentWorkouts()` and `liveSetFinding(...)`; each write notifies listeners), `App.tsx` (routes for the picker and the finish summary; handed over).
- **Do not touch:** core (report problems in the handoff), other features.

## Specification

- As T-010, translated to the web: the number pad is an in-page panel docked above the tab bar (not the iOS keyboard), with large keys, ±step buttons (2.5 kg / 5 lb / 1 rep) and the kg/lb toggle. Inputs never open the system keyboard.
- Every tap is its own logger call, applied in tap order (port `LoggingActionQueue`): never two writes in flight for the same workout.
- Haptics are not available on the web; don't fake them.
- The "Is this right?" prompt appears when completing a set whose `liveSetFinding` returns a finding, with "Save anyway" and "Fix", and is skipped for 0-rep entries still being typed.
- A workout in progress survives closing the app: reopening the Workout tab shows it.
- Run `make format`; `make verify` must pass.

## Acceptance criteria

- [ ] `make verify` passes; tests for pure helpers (number draft, pad steps, set text).
- [ ] UI at 430 × 932, dark and light: start, add two exercises, complete a pre-filled set in one tap, edit weight on the pad, toggle kg/lb, trigger the typo prompt, reorder, delete a set, finish with a dropped planned set, and the summary. Also in Safari on the iPhone 15 Pro Max simulator if it responds.

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
