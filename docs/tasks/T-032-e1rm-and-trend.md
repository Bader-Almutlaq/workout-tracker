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

- **Status:** · **What was done:** · **Files touched:** · **Decisions taken:** · **Open questions / left over:** · **How it was verified:**
