# T-023: Port the logging core (live workout, previous performance, live typo check)

- **Milestone:** W3
- **Depends on:** T-013, T-014, T-019, T-020 (all merged)
- **Model tier:** mid

## Goal

WorkoutCore can run a workout as it happens, exactly as the native app did: start one, add exercises with sets pre-filled from last time, complete and edit sets, reorder, switch an exercise's unit, finish (dropping what wasn't done) or discard. It also answers "what did I do last time?" and flags a suspicious set while logging.

## Read first

- `AGENTS.md`, `docs/DATA.md` → *Logging state*, `docs/DECISIONS.md` → planned sets are real rows.
- Existing: `src/core/db/Database.ts`, `src/core/models/*`, `src/core/units/*`, `src/core/validation/SetPlausibility.ts` (`checkSet`, `SessionSummary`), `src/core/queries/WorkoutHistory.ts` (`workoutSummary`).
- Native spec (read-only) in `reference/native/Packages/WorkoutCore/`: `Sources/WorkoutCore/Logging/WorkoutLogger.swift`, `WorkoutLoggerError.swift`, `Sources/WorkoutCore/Queries/PreviousPerformance.swift`, `LiveWorkout.swift`, `Sources/WorkoutCore/Validation/LiveSetCheck.swift`, and tests `Tests/WorkoutCoreTests/Logging/*`, `Tests/WorkoutCoreTests/Validation/LiveSetCheckTests.swift`.

## Scope

- **Create:** `src/core/logging/WorkoutLogger.ts`, `WorkoutLoggerError.ts`, `src/core/queries/PreviousPerformance.ts`, `LiveWorkout.ts`, `src/core/validation/LiveSetCheck.ts`, each with tests.
- **Do not touch:** anything else (another agent is editing the worker API and screens).

## Specification

- Port behaviour, constants (named `as const` objects with the native doc comments) and every test case. Functions take `db: Database` first and `now: Date` where the Swift read the clock.
- Each logger method is one `db.transaction`. Position renumbering goes through negative values to avoid the unique-constraint clash, as in Swift.
- `LiveWorkout.snapshot(db)` returns plain data (it will cross threads). The native `observe` functions are not ported: the worker re-runs queries after each write instead.
- Run `make format`; `make verify` must pass.

## Acceptance criteria

- [ ] `make verify` passes.
- [ ] Every native test case in the listed files is ported and passing.

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
