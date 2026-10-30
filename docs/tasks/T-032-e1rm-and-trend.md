# T-032: Analytics engine part 1: effective reps, e1RM, session values and trend

- **Milestone:** W5 · **Depends on:** none (reads existing tables) · **Model tier:** strong (formulas; Codex Sol)

## Goal

WorkoutCore can answer "am I getting stronger at this exercise?": each qualifying set's effective reps and estimated one-rep max, the session value (best qualifying e1RM of the day), and a smoothed trend over time, exactly as the research report specifies. Pure, tested against the report's worked examples.

## Read first

- `AGENTS.md`: every formula cites the report in its doc comment or is marked `Heuristic:`; measure, don't prescribe.
- `reports/Workout tracker app research.md` → *The recommended algorithms, in one place*, items **1** (effective reps), **2** (estimated 1RM, including which sets qualify and the k categories), **4** (session value and trend, EWMA with α = 1 − e^(−days/τ), and holding sessions far off the trend), and section *1. Am I getting stronger?*.
- `docs/PLAN.md` → W5, `docs/ARCHITECTURE.md` (glossary: RIR, RPE, e1RM, hard set), `src/core/db/Database.ts`, `src/core/models/WorkoutSet.ts`, `src/core/library/MovementPattern.ts` / `Mechanic.ts` (to choose an exercise's k category; if the report's categories need a mapping, write it as a named, documented table).

## Scope

- **Create:** `src/core/analytics/EffectiveReps.ts`, `EstimatedOneRepMax.ts`, `StrengthTrend.ts` (pure functions), `src/core/queries/ExerciseStrength.ts` (reads an exercise's finished sets and returns session values and the trend series as plain data), each with tests.
- **Do not touch:** anything else (another agent is writing `src/core/analytics` volume files in parallel: don't create files with names about volume, sets per muscle or baselines).

## Specification

- Constants (k values, RIR for unknown effort, rep cap, RIR cap, τ, outlier hold threshold) in one `as const` object per file, each with the report citation.
- `ExerciseStrength.series(db, exerciseId, now)` → `{ sessions: [{ workoutId, date, e1rmKilograms, bestSet: { weightKilograms, reps, rpe } }], trend: [{ date, e1rmKilograms }], latest, changePerWeekPercent }`. Weights in kg (display conversion is the UI's job). Sessions that don't qualify are skipped, not zero.
- Tests reproduce every worked example in the report's items 1, 2 and 4, plus edges: no RPE, failure set, warm-ups excluded, reps above the cap, a single session, a gap of months.
- `make format`; `make verify` must pass.

## Handoff

- **Status:** Ready for review; changes left uncommitted as requested. Board unchanged.
- **What was done:** Added pure effective-reps, qualifying e1RM and time-based EWMA calculations, plus the read-only `ExerciseStrength.series(db, exerciseId, now)` query. Session estimates retain original kg/reps/RPE, choose the highest qualifying estimate rather than the heaviest load, and omit nonqualifying days. Active workouts and uncompleted sets are excluded. Held outliers remain in the raw series without changing the trend.
- **Files touched:** `src/core/analytics/EffectiveReps.ts`, `EstimatedOneRepMax.ts`, `StrengthTrend.ts`, their three adjacent test files, `src/core/queries/ExerciseStrength.ts`, its adjacent test file, and this Handoff only.
- **Public API:** `effectiveReps(set)` returns E, RIR and trend weight, or `null` for invalid input. `estimatedOneRepMax(set, exercise)` returns unrounded kg, effort information and the E > 10 confidence flag, or `null` when not qualifying/classifiable. `strengthTrend(observations, now)` returns trend points (including `isHeld`), latest smoothed kg and recent percent/week; an observation's `isConfirmed: true` bypasses the hold. `ExerciseStrength.series` returns exactly the specified sessions/trend/latest/changePerWeekPercent shape. Each calculation file exports its documented defaults object and result/input types.
- **Decisions taken / interpretations:**
  - The report's items 1–2 contain one numerical worked example: 100 kg × 5 at RPE 8 gives E = 7 and exactly `100 * (1 + 6 / 29)`, displayed as 120.7 kg. Item 4 has an equation but no separate numerical worked example; tests apply that equation at irregular intervals with independent expected values.
  - Heuristic: unknown effort uses RIR 2 and half the EWMA alpha; it does not reduce the raw e1RM or alter the choice of daily maximum. Failure establishes known RIR 0 even if RPE is absent or conflicts.
  - Heuristic: normal τ is 21 days, shortened to 14 after at least 21 days since the last accepted observation. The first observation seeds the trend. Held points do not advance that clock; even a months-long break does not bypass the report's >15% hold. No decay or extrapolation between sessions.
  - Heuristic: `%/week` is linear endpoint change divided by elapsed weeks between the first and last accepted trend points within the trailing 28 days at `now`. It is `null` without two distinct observation times; held points do not supply rate endpoints. `latest` means the latest smoothed kg, or `null` without data.
  - Interpreted "best ... of the day" literally: one maximum per UTC day (YYYY-MM-DD), across repeated exercise entries and multiple workouts. `workoutId` identifies the winning set's workout; ties keep the earliest logged set. UTC grouping is deterministic across travel/time-zone changes; `now` filters workout start times and supplies the rate window.
  - The named equipment/pattern mapping is inside `EstimatedOneRepMaxDefaults`: bar variants use barbell categories; squat/lunge/hinge/hip-thrust are lower-body; horizontal/vertical presses/pulls are upper-body; Smith/plate-loaded use machine k; kettlebells use dumbbell k. Isolation takes k = 15 regardless of equipment. No guessed k for unclassified compounds or missing mechanic. Only positive-load `weight-reps` exercises qualify; bodyweight/assisted/weighted-bodyweight and timed tracking need separate total-mass handling.
- **Open questions / left over:** Lead should review UTC versus local-day grouping, the documented heuristic defaults/rate window, and omitted equipment categories. No persistent outlier confirmation field or confirmation UI exists in this scope: the pure trend API accepts confirmation, but the database query always holds unconfirmed >15% deviations. Lead should add the four concept owners to `docs/ARCHITECTURE.md` and record accepted non-obvious choices in `docs/DECISIONS.md`; those shared files were deliberately not edited. Update the board during review.
- **How it was verified:** `make format`, then `make verify` passed (format check, ESLint, all TypeScript projects, **538 tests in 78 files**, production/PWA build). **67 new tests:** effective reps 15, e1RM 29, trend 14, query 9. Database tests use `Database.openInMemory()` plus `migrate(db)` and synthetic records only. Coverage includes all five k values and mapped variants, true singles, unknown effort, failure override, warm-ups, E/RIR caps and confidence boundaries, invalid inputs, single-session history, daily maxima/ties, unfinished/future data, irregular spacing, exact 15% boundaries, confirmation, long breaks, stale rates, and an invalid-timestamp sorting regression. `git diff --check` passed. No UI, worker wiring, migration or real export access was needed.
