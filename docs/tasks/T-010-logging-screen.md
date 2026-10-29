# T-010: Workout tab: log a workout live

- **Milestone:** M3
- **Depends on:** T-008 (done), T-004 (done)
- **Model tier:** mid (the most important screen in the app: follow the spec closely)

## Goal

The owner logs a gym session on the iPhone, replacing Strong. Logging a set takes 2–3 taps, and last session's numbers are always visible on the same row. Each exercise is logged in its own unit (kg or lb), switchable with one tap.

## Read first

- `AGENTS.md`.
- `docs/DESIGN.md`: all of it, especially *Units* and *Layout principles*.
- `docs/DATA.md` → *Logging state*.
- `docs/DECISIONS.md` → "Planned sets are real rows".
- Core API, all in `Packages/WorkoutCore/Sources/WorkoutCore/`:
  - `Logging/WorkoutLogger.swift`: `start`, `finish`, `discard`, `update`, `addExercise`, `removeExercise`, `moveExercise`, `addSet`, `updateSet`, `setCompleted`, `deleteSet`, `setEntryUnit`, and `activeWorkoutID`.
  - `Queries/LiveWorkout.swift`: `observeActiveWorkoutID`, `observe(workoutID:in:)`, and `Snapshot` / `Entry`, where `previous` is matched to rows by index.
  - `Queries/WorkoutHistory.swift`: `summaries`, used for "Repeat a past workout".
  - `Units/Weight.swift` and `WeightUnit.swift`, plus `App/DesignSystem/WeightFormatting.swift`. Use `Weight(value, unit:)` to convert typed values and `weight.number(in:)` / `formatted(in:)` to display. Never multiply by 0.4536 yourself.
  - `Library/ExerciseSearch.swift` and `Queries/ExerciseCatalog.swift`, for the add-exercise picker.
- `App/AppEnvironment.swift` exposes `workoutLogger`, `database`, `library` and `exercises` (`ExercisesModel`). Style references: `App/Features/Exercises/*` and `App/Features/History/WorkoutDetailView.swift`.

## Scope

- **Create:**
  - `App/Features/Workout/`: `WorkoutTabModel.swift`, `WorkoutTabView.swift`, `ActiveWorkoutModel.swift`, `ActiveWorkoutView.swift`, `ExerciseLogCard.swift`, `SetRowView.swift`, `NumberPad.swift`, `ExercisePickerView.swift`, `FinishSummaryView.swift`.
  - Small reusable pieces go in `App/DesignSystem/Components/` if they are generic.
- **Edit:** `App/RootView.swift` (the Workout tab only) and `App/AppEnvironment.swift` (one stored model or a factory).
- **Do not touch:** WorkoutCore (report gaps in the handoff), Settings, Import, History, Exercises, Matching.

## Specification

**WorkoutTabView**, with no active workout:
- A primary button "Start empty workout" (accent, full width). It asks for nothing and names the workout from the time of day: "Morning", "Afternoon" or "Evening" workout.
- Section "REPEAT A PAST WORKOUT": the last 6 finished workouts, showing name, date and exercise count. Tapping one starts a workout with that name and adds the same exercises in the same order. Use `WorkoutHistory.detail` to read them, `start`, then `addExercise` for each. Sets pre-fill from each exercise's last session automatically.

**ActiveWorkoutView**, while a workout is in progress:
- **Top bar:**
  - The workout name; tap to rename via an alert.
  - The elapsed time as `mm:ss` or `h:mm:ss`, monospaced, ticking with `TimelineView`.
  - A "Finish" button in accent.
  - A "…" menu with "Discard workout", confirmed: "Discard this workout? Nothing logged in it will be kept."
- **Exercise cards:** one `Card` per exercise, in position order.
  - **Card header:**
    - The exercise name (`AppFont.headline`).
    - A unit chip showing "kg" or "lb"; tapping it calls `setEntryUnit` with the other unit.
    - A "…" menu: Move up, Move down, Remove exercise (confirm if any set is completed).
  - **Column header** in `SectionLabel` style: `SET   PREVIOUS   KG|LB   REPS   RPE   ✓`.
  - **Set rows** (SetRowView):
    - **Set label:** "W", "D" or "F" for warm-up, drop and failure, or the working-set number counting only non-warm-up sets. Tap it to pick a kind from a menu.
    - **Previous:** `previous[index]` formatted as "135 lb × 8" in `textSecondary`, or "—".
    - **Weight, reps and RPE:** tappable value cells showing the set's current values. Weight is shown in the set's `entryUnit` via `number(in:)`, so 61.23 kg shows as 135 when the unit is lb. A cell being edited gets a `borderStrong` outline.
    - **Check button:** toggles `setCompleted`. A completed row gets an `accentSubtle` background and a filled check in accent.
    - **Swipe to delete** a set.
  - **Below the rows:** "+ Add set" (`addSet`).
- **Bottom of the list:** "+ Add exercise" opens ExercisePickerView, a sheet with search (`ExerciseSearch.results`) and muscle and equipment chips like the Exercises tab. Multi-select with checkmarks; "Add (n)" appends them in the order picked.
- **Tracking kinds:**
  - `bodyweightReps`: the weight column header reads "+KG" or "+LB" and 0 shows as "BW".
  - `duration`: the reps cell shows seconds as `m:ss`, entered as seconds, and `updateSet` passes `durationSeconds`, with reps 0.
  - `weightAndDuration`: both weight and duration.

**NumberPad**, a custom keypad shown as a bottom panel (not the system keyboard) while a cell is being edited:
- Digits, ".", backspace; "−" and "+" step buttons; "Next" and "Done".
- **Steps:** 2.5 for kg, 5 for lb, 1 for reps, 0.5 for RPE. Put these in a named constants enum with a doc comment.
- **Next** moves weight → reps → RPE → the next row's weight.
- **Done** closes the pad.
- **Saving:** a value is written with `updateSet` when the owner moves to another cell or closes the pad, not on every keystroke.
- **Units:** weight is typed in the set's entry unit and stored with `Weight(value, unit: entryUnit)`.
- **RPE:** accepts 1–10 in 0.5 steps, or empty (nil).
- **Errors:** a `WorkoutLoggerError` shows its message in a small inline banner above the pad, and the value is not saved.

**Finish:**
- If planned (uncompleted) sets remain, confirm: "3 sets weren’t completed and will be discarded."
- Then call `finish`.
- Show FinishSummaryView as a sheet: duration, completed sets, tonnage (Σ weight × reps of non-warm-up sets, in kg; label it "Volume load"), and the exercises with their set counts. One "Done" button. No celebration, confetti or praise.
- If `finish` returns `workoutID == nil` (nothing completed), show "Nothing was logged, so the workout was discarded." instead.

**General:**
- Observe `LiveWorkout.observe` in `ActiveWorkoutModel`. Every user action calls `WorkoutLogger` on a background task and errors surface in a banner. The UI updates from the observation, never optimistically from local state, so what's on screen is what's saved.
- Previews for the empty tab, an active workout with 2 exercises (create them in the preview database through the logger), and the number pad.
- Design tokens only. Monospaced digits for every number. Dark and light both checked.

## Acceptance criteria

- [ ] `make verify` passes with no new warnings.
- [ ] Previews render.
- [ ] Simulator check, if a runtime is installed: start a workout, add Bench Press (Barbell) and Lateral Raise (Dumbbell), switch one to lb, type weights, complete sets, delete one, finish, and see the summary and the workout in History. Take screenshots in dark and light. If there is no runtime, say so in the handoff.
- [ ] Handoff filled in, including any WorkoutCore gaps.

## Handoff

- **Status:** Implemented; ready for review. `make verify` passes (125 WorkoutCore tests, app builds for the simulator with no warnings). Not run in a simulator (see below).
- **What was done:** The Workout tab. With no workout: "Start empty workout" (named Morning/Afternoon/Evening workout) and the last 6 finished workouts to repeat. With a workout: top bar (rename on tap, ticking timer, Finish, "…" > Discard), a card per exercise (unit chip, move/remove menu, column header, set rows with swipe-to-delete, "Add set"), "Add exercise" sheet (search, muscle/equipment chips, multi-select, "Add (n)"), a custom number pad (digits, ".", backspace, − / +, Next, Done), finish confirmation, and a finish sheet (duration, sets, volume load, exercises) or "Nothing was logged, so the workout was discarded." All writes go through `WorkoutLogger`; the screen only changes through `LiveWorkout.observe`.
- **Files touched:**
  - New, `App/Features/Workout/`: `WorkoutTabModel`, `WorkoutTabView`, `ActiveWorkoutModel`, `ActiveWorkoutView`, `ExerciseLogCard`, `SetRowView`, `NumberPad`, `ExercisePickerView`, `FinishSummaryView`, plus helpers `LoggingActionQueue`, `NumberDraft`, `NumberPadSteps`, `SetFormatting`, `FinishSummary`, `FinishOutcome`, `ExercisePickerModel`, `ExerciseFilterRow`, `WorkoutPreviewData` (DEBUG only).
  - New, `App/DesignSystem/`: `DurationFormatting.swift` (`clockText`), `Motion.swift`, `Components/ErrorBanner`, `Components/PrimaryButtonStyle`, `Components/SwipeToDelete`.
  - Edited: `App/AppEnvironment.swift` (stored `workoutTab`), `App/RootView.swift` (Workout tab only).
- **Decisions taken:**
  - **Writes are serialised.** `LoggingActionQueue` runs every logger call off the main thread, strictly in tap order, so "save weight" can't overtake "complete set". Errors land in one banner (above the pad while it is open).
  - **Cell edits read the saved set when the write runs** (`ActiveWorkoutModel.editSet`), because `updateSet` replaces every field; building it from the on-screen set could undo a queued edit. Needed `WorkoutHistory.detail` inside the queued action, since the App can't import GRDB.
  - **Set numbering** counts working sets only (as `WorkoutDetailView` does); W/D/F rows show their letter and aren't counted.
  - **Timed exercises:** `duration` hides the weight cell and unit chip; reps/seconds accept whole numbers only (seconds, shown as m:ss).
  - **RPE** typed off the half-step grid (7.3) is refused with a message before reaching the core.
  - **Previous column** is shown in the row's own entry unit (so it matches the weight cell). A completed set typed in the other unit shows its unit next to the number.
  - **Tab bar is hidden while the pad is open**, so the pad takes its place.
  - **Swipe to delete** is a custom drag (`SwipeToDelete`), because `swipeActions` only works in a `List` and the spec asks for `Card`s.
  - Finish summary reads volume load from `WorkoutHistory.summaries` so it keeps one definition.
  - `ExerciseFilterRow` duplicates the chips in `ExercisesView` (out of scope to touch). `ExercisesView` can adopt it later.
  - `ExercisePickerModel` was added though not listed in Scope (the picker needs its own query, filter and selection; `ExercisesModel`'s are shared with the Exercises tab).
- **Open questions / left over:**
  - **Not seen on a screen.** No simulator runtime is installed, so no screenshots (dark/light), no tap-through, and no preview was rendered. Previews are written and compile. The swipe gesture, scroll-to-edited-row and pad layout in particular need a look in T-007.
  - **WorkoutCore gaps (not touched):**
    1. `addExercise` and `addSet` don't copy `durationSeconds`, so planned sets of timed exercises start at 0:00 instead of last session's time.
    2. A `WorkoutHistory.summary(workoutID:)` (one workout's totals) would avoid fetching every summary for the finish sheet.
    3. A way to update one field of a set (or fetch one set) would remove the "read the whole workout inside the queued action" workaround.
    4. `SetPlausibility` isn't wired into the live pad (that is T-009; the pad shows core errors only).
  - After a cell is saved it shows the old value for the few milliseconds until the observation delivers (by design: no optimistic UI).
  - Lead: `docs/ARCHITECTURE.md` concept table could gain rows for "Elapsed/clock text" (`DurationFormatting`), "Serialised logging writes" (`LoggingActionQueue`), and "Number pad draft" (`NumberDraft`).
  - The App has no test target, so `NumberDraft` was checked with a throwaway script only (typing replaces the old value, "." once, steps, clamping). A test target needs a `project.yml` change (lead only).
- **How it was verified:** `make verify` (tests pass; build succeeded with no warnings from the app target after a forced full recompile). No simulator runtime (`simctl list runtimes` is empty), so UI checks were skipped.
