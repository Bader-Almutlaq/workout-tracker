# T-027: Rest timer on the logging screen

- **Milestone:** W3 · **Depends on:** T-024 (merged), migration `v2-exercise-rest-target` (merged) · **Model tier:** mid

## Goal

After the owner completes a set, a compact rest bar appears above the tab bar: time since that set, counting up, and a countdown to the exercise's rest target. The target is the owner's choice per exercise (±15 s buttons, remembered); the app never suggests one. When the countdown reaches zero the bar changes state quietly. The rest actually taken is already recorded on the next completed set (`restBeforeSeconds`).

## Read first

- `AGENTS.md` (measure, don't prescribe), `docs/DESIGN.md`, `docs/DECISIONS.md` (web limits: no alerts while the phone is locked, no vibration).
- `src/core/db/migrations.ts` → `v2-exercise-rest-target` (`exercise.restTargetSeconds`, NULL = app default), `src/core/models/Exercise.ts`, `src/core/logging/WorkoutLogger.ts` (`restBeforeSeconds`), `src/core/queries/LiveWorkout.ts`.
- `src/app/features/workout/` (especially `ActiveWorkout.tsx`, `useActiveWorkout.ts`, `NumberPad.tsx`, `useElapsedSeconds.ts`, `ElapsedClock.tsx`), `src/app/format/clockText.ts`, `src/worker/WorkerApi.ts` → `// Workout (T-024)`.

## Scope

- **Create:** `src/core/logging/RestTimer.ts` (+ test): `RestTimerDefaults` (`targetSeconds: 120`, `stepSeconds: 15`, minimum and maximum; doc comment marked `Heuristic:`: a starting value the owner overrides, not a recommendation), `restTarget(exercise)`, `setRestTarget(db, exerciseId, seconds)`, and a pure `restState(lastCompletedAt, targetSeconds, now)` returning elapsed, remaining and whether the target is reached. `LiveWorkout` (or the worker) exposes the last completed set's time and the exercise's target. `RestBar.tsx` (+ CSS module) and a small hook in `src/app/features/workout/`.
- **Edit:** `LiveWorkout.ts` only if needed to expose `completedAt` and `restTargetSeconds`; `WorkerApi.ts` (one method `setRestTarget` in the `// Workout (T-024)` block, notifying listeners); `ActiveWorkout.tsx` (render the bar).
- **Do not touch:** the finish summary files (`WorkoutSummaryScreen.tsx`, `SavedWorkoutSummary.tsx`: another task edits them), migrations, search.

## Specification

- The bar sits above the tab bar and below the content, never covering the number pad: when the pad is open the bar hides.
- Shows "Rest 1:24 / 2:00", a −15 s and +15 s button, and a dismiss (×). At zero it reads "Rest 2:00 ✓" in the secondary colour. No sound, no vibration, no celebration.
- Survives a reload (derived from the last completed set's time, not from a running JS timer).
- `make format`; `make verify` must pass.

## Acceptance criteria

- [ ] Tests for `restState` and `setRestTarget`.
- [ ] UI at 430 × 932, dark and light: complete a set, the bar counts; ±15 s changes and is remembered for that exercise; reload keeps the bar; it hides while the pad is open.

## Handoff

- **Status:** done, in review.
- **What was done:** The rest bar sits above the tab bar once a set is completed: "Rest 1:24 / 2:00", −15 s and +15 s, and a dismiss cross. When the target is reached it reads "Rest 2:00 ✓" in the secondary colour, with no sound or vibration. The countdown comes from the last completed set's saved time, so it survives a reload. The target is stored per exercise in `exercise.restTargetSeconds`. The bar hides while the number pad is open, and a spacer keeps the last rows clear of it.
- **Files touched:** new `src/core/logging/RestTimer.ts` (+ test); in `src/app/features/workout/`: `RestBar.tsx`, `RestBar.module.css`, `RestBarButton.tsx`, `RestBarButton.module.css`, `RestReadout.tsx`, `RestReadout.module.css`, `RestBarModel.ts`, `useRestBar.ts`, `useClock.ts`, `latestCompletion.ts` (+ test). Edited: `ActiveWorkout.tsx` (renders the bar), `workoutActions.ts` (`setRestTarget` action), `useElapsedSeconds.ts` (now built on `useClock`, so there is one ticking clock), `WorkerApi.ts` (`setRestTarget` in its own `// Rest timer (T-027)` block). `LiveWorkout.ts` needed no change: the snapshot already carries each set's `completedAt` and each exercise's `restTargetSeconds`.
- **Decisions taken:** (1) Past the target the time keeps counting up and shows with the check mark ("Rest 2:20 ✓"), so the rest actually taken stays visible. The brief's "Rest 2:00 ✓" is what it reads at the moment of reaching. (2) Limits are 15 s to 30 min; `setRestTarget` rounds and clamps. A missing exercise throws `WorkoutLoggerError('exerciseNotFound')`. (3) The timer counts from the latest completed set in the whole workout and uses that set's exercise target. (4) Dismiss hides the bar until the next set is completed; it is not stored, so a reload brings the bar back. (5) A step starts from the last chosen value (kept in a ref), because quick taps arrive before the saved value comes back from the worker.
- **Open questions / left over:** The `DECISIONS.md` and concept table (`docs/ARCHITECTURE.md`: "rest target / rest state → `RestTimer.ts`") rows are for the lead to add. On the light theme, the existing "Add exercise" button renders near-black; that is not from this task. Nothing in this task lets the owner clear a target back to the app default.
- **How it was verified:** `make verify` passes. At 430 × 932 in dark and light: completed a set and the bar counted; +15 s / −15 s changed the target and it was remembered per exercise (one exercise at 0:15, another still at the 2:00 default); reload kept the bar and the target; opening the number pad hid the bar and Done brought it back; the reached state (check mark, secondary colour) and the disabled −15 s at the minimum; dismiss hid the bar.
