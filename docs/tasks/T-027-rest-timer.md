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

- **Status:** · **What was done:** · **Files touched:** · **Decisions taken:** · **Open questions / left over:** · **How it was verified:**
