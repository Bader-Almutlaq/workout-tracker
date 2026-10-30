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

- **Status:** Ready for review; changes left uncommitted as requested.
- **What was done:** Ported logging actions, previous performance, live workout snapshots and the live plausibility check, including all 24 named native test cases.
- **Files touched:** Five scoped implementation files and their five adjacent test files in `src/core/logging`, `src/core/queries`, and `src/core/validation`; this handoff.
- **Decisions taken:** Dates supplied by the caller become UTC ISO timestamps; logger weights are supplied as kilograms, consistent with the existing unit functions. Query results use `undefined` for missing values, as existing TypeScript queries do. Native observers are omitted as specified.
- **Open questions / left over:** `SetPlausibility` keeps session summarization private, so the live check reproduces its top-weight and median-reps reduction while reusing `checkSet`. The lead should consider exposing the existing summarizer in a follow-up to restore one implementation of that reduction; that file is outside this task's scope. Worker integration is outside scope.
- **How it was verified:** `make format` and `make verify` passed; 320 tests across 41 files, including 27 new tests (24 native cases and 3 focused module tests).
