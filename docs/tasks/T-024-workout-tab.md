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

- **Status:** review. `make verify` passes. Checked at 430 × 932 in dark and light in the browser; not checked in Safari on the simulator.
- **What was done:** The Workout tab. With no workout: "Start empty workout" (named Morning/Afternoon/Evening workout) and the last 6 finished workouts to repeat. With a workout: a sticky bar (clock, "…" > Discard, Finish), the name as the title (tap to rename), a card per exercise (kg/lb chip, "…" menu with Move up/down/Remove, column titles, set rows, Add set), "Add exercise" (picker route `/workout/add`), and the number pad docked above the tab bar (digits, ".", backspace, − / +, Next, Done, kg/lb toggle on weight cells). Completing a set is one tap; a suspicious set asks "Is this right?" (Save anyway / Fix). Finish confirms when planned sets remain, then shows the summary (`/workout/summary/:workoutId`, or the "Nothing was logged" notice without an id). A workout in progress survives a reload.
- **Files touched:**
  - New, `src/app/features/workout/`: `WorkoutScreen`, `StartWorkout`, `RecentWorkouts`, `RecentWorkoutRow`, `ActiveWorkout` (+ `ActiveWorkoutBar`, `WorkoutTitle`, `ElapsedClock`, `ExerciseCard`, `ExerciseCardHeader`, `SetColumnHeader`, `SetRow`, `SetCell`, `ValueCell`, `CheckButton`, `SetKindMenu`, `UnitChip`, `NumberPad`, `PadButton`, `PadUnitToggle`, dialogs), `AddExerciseScreen`, `ExercisePicker`, `PickerListing`, `PickerRow`, `AddExerciseBar`, `WorkoutSummaryScreen`, `SavedWorkoutSummary`, `SummaryStat`. Logic: `useActiveWorkout`, `useCellEditor`, `workoutActions`, `LoggingActionQueue`, `loggingQueue`, `numberDraft`, `padRange`, `padTitle`, `setCellText`, `setValues`, `cellOrder`, `confirmation`, `typoPrompt`, `workoutName`, `workoutPaths`, `liveWorkoutLookup`, `trackingKinds`, with tests for each pure helper.
  - New, shared: `src/app/design/components/` `ActionMenu` (+ `ActionMenuRow`), `ErrorBanner`, `SwipeToDelete`; `src/app/format/clockText.ts`.
  - Edited: `src/worker/WorkerApi.ts` (block `Workout (T-024)`), `src/app/App.tsx` (two routes), `Screen.tsx` (title may be any node), `ConfirmDialog.tsx` (`cancelLabel`), `Button.module.css` (gap), `format/setText.ts` (`rpeNumberText`).
- **Decisions taken:**
  - **Writes are serialised** by `LoggingActionQueue` (one promise chain for the whole app). A cell edit reads the saved set inside the queue (`workoutActions.editSet`) because `updateSet` replaces every field.
  - **The pad draft starts at the first key**, so a cell shows the saved value until then. Switching kg/lb from the pad saves the draft first, switches the exercise and, for a completed set, also that set's unit.
  - **The typo check runs inside the queue** on the saved values, so an edit made just before the tap is judged. Sets with 0 reps (and all timed sets) skip it. Escape on the dialog means Fix.
  - **`WorkerApi.startWorkout(name, exerciseIds)` and `addExercises(workoutId, ids)`** take several exercises and notify once (the brief says one method per logger action); also added `activeWorkoutId()` and `finishedWorkoutSummary()`.
  - Delete a set by swiping left or from the set-label menu (the swipe is hard to discover). Menus close on an outside press (`pointerdown`), not with a backdrop, because a fixed element inside the blurred top bar is sized to the bar.
  - The picker reuses `ExerciseFilters`, `exerciseBrowseState`, `exerciseSections`, `NoMatch` and `ExerciseSearch`, but not the Exercises tab's remembered state.
- **Open questions / left over:**
  - **Lead: concept table** (`docs/ARCHITECTURE.md`) could gain rows: "Serialised logging writes" (`LoggingActionQueue`), "Number pad draft and steps" (`numberDraft.ts`, `padRange.ts`), "Set cell text" (`setCellText.ts`), "Clock text" (`format/clockText.ts`).
  - The tab bar does not highlight Workout on `/workout/add` and `/workout/summary` (`TabBar` matches `/` exactly; out of scope).
  - The DATA.md line about a "back up" reminder on the finish summary when the last backup is over 7 days old is not built (not in this brief).
  - Core gap: no way to update one field of a set or fetch one set, so the queue reads the whole workout before each edit (cheap, but a `getSet` would be tidier).
  - A half-typed cell is lost if the app is killed before Done/Next (it is saved on every other action).
  - Returning to the tab shows "Loading…" for a moment before the workout (the query state resets on remount).
  - Timed exercises (`duration`, `weight-duration`) and bodyweight "BW" display are covered by unit tests only, not seen on screen.
  - No React component tests (the app has none); Safari on the iPhone simulator was not run.
- **How it was verified:** `make verify`. Browser at 430 × 932, dark and light, dev server on 5179 with a synthetic Strong CSV (5 workouts, two exercises) imported through Settings: start empty, add two exercises from the picker (pre-filled from last time), complete a set in one tap, type 112.5 on the pad, step with +, toggle kg/lb, type 1100 lb and get "Is this right?", Fix reopens the pad, fix and complete, swipe a set to delete it, Move up through the exercise menu, Finish with 3 planned sets (confirm text), summary (duration, sets, volume load 1,769 kg checked by hand), repeat a past workout, RPE 7.3 refused with a message, rename dialog, discard confirm, reload keeps the workout.
