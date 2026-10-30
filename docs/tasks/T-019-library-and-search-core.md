# T-019: Port the exercise library, muscle taxonomy and search (pure part)

- **Milestone:** W2 (started early: it needs nothing from W1)
- **Depends on:** none
- **Model tier:** mid

## Goal

WorkoutCore can load and validate the curated library of 421 exercises, knows the 23 muscles and the other exercise vocabularies, and can search exercises the way the native app did: slang ("rdl", "ohp"), plurals, prefixes, typo tolerance, and ranking by the owner's usage and recency. Everything in this task is pure: no database.

## Read first

- `AGENTS.md`, `docs/ARCHITECTURE.md` (concept table rows for the library and search), `docs/DECISIONS.md` (curated library; in-memory search).
- `src/core/library/library.json` (the data; don't change it unless a validation test proves an error, and say so in the handoff).
- Native spec in `reference/native/Packages/WorkoutCore/`:
  - `Sources/WorkoutCore/Library/`: `Muscle`, `MuscleRegion`, `MuscleRole`, `Equipment`, `MovementPattern`, `Mechanic`, `ExerciseTracking`, `LibraryFile`, `LibraryExercise`, `ExerciseLibrary`, `ExerciseLibraryError`, `SearchText`, `GymSlang`, `ExerciseSearch`.
  - Tests: `Tests/WorkoutCoreTests/Library/ExerciseLibraryTests.swift`, `SearchTextTests.swift`, `ExerciseSearchTests.swift`.

## Scope

- **Create:** one file per Swift type above under `src/core/library/` (same names, `.ts`), each with its tests.
- **Do not touch:** `library.json` (see above), migrations, `src/core/models` and `src/core/units` (another agent is writing them now), `ExerciseNameResolver` (T-014), the seeder and editor (later task), anything outside `src/core/library/`.

## Specification

- Enums become string unions whose values are exactly the strings in `library.json` and in the `v1-schema` CHECK constraints, each with an exported `readonly` array of all values and a `Record<…, string>` of display names (ported from Swift). `Muscle` must list the same 23 ids as the `INSERT INTO muscle` rows in `migrations.ts`: add a test that reads them from a migrated in-memory database and compares.
- `LibraryFile` decoding: a variant is either an equipment string or an override object, as in Swift. Use a hand-written parser with clear `ExerciseLibraryError` messages (no validation library).
- `ExerciseLibrary`: `bundled()` imports `library.json` (JSON import is enabled), `fromJson(text)`, `name(movement, equipment)`, `key(name)`, and the same validation rules and errors.
- `ExerciseSearch`: same `Entry`, `Filter`, `results(query, filter, now)` and `suggestions(name, limit)` behaviour and the same `Tuning` constants (as an `as const` object with the doc comments). `now` is passed in; never read the clock inside core.
- These types are the single owners of these vocabularies. T-013 may have typed `exercise.equipment` etc. loosely; the lead reconciles at merge, so don't edit `src/core/models`.

## Acceptance criteria

- [ ] `make verify` passes.
- [ ] Every native test case in the three test files is ported and passing, plus the muscle-rows test.
- [ ] Search on 421 exercises runs in under 5 ms per query in a test (`performance.now()` is available in Node).

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
