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

- **Status:** done, in review (branch `task/T-019-library-and-search-core`).
- **What was done:** ported the whole pure library and search layer to `src/core/library/`: the seven vocabularies, `LibraryFile` (hand-written parser), `LibraryExercise`, `ExerciseLibrary`, `ExerciseLibraryError`, `SearchText`, `GymSlang` and `ExerciseSearch`. Every case in the three Swift test files is ported with the same inputs and expected outputs, plus the muscle-rows test against a migrated in-memory database and extra tests for the parser. `library.json` is untouched.
- **Files touched:** all new, under `src/core/library/`: `Muscle.ts`, `MuscleRegion.ts`, `MuscleRole.ts`, `Equipment.ts`, `MovementPattern.ts`, `Mechanic.ts`, `ExerciseTracking.ts`, `LibraryFile.ts`, `LibraryExercise.ts`, `ExerciseLibrary.ts`, `ExerciseLibraryError.ts`, `SearchText.ts`, `GymSlang.ts`, `ExerciseSearch.ts`, plus tests `Muscle.test.ts`, `LibraryFile.test.ts`, `ExerciseLibrary.test.ts`, `SearchText.test.ts`, `ExerciseSearch.test.ts`. Also this file and the board row.
- **Concept-table rows the lead should mark done (`docs/ARCHITECTURE.md` → *Concept ownership*):**
  - Muscle taxonomy and regions: `Muscle.ts`, `MuscleRegion.ts` (`MuscleRole.ts` for primary/secondary).
  - Equipment, movement patterns, mechanic, tracking kinds: `Equipment.ts`, `MovementPattern.ts`, `Mechanic.ts`, `ExerciseTracking.ts`.
  - The built-in exercise list: `library.json`, loaded by `ExerciseLibrary.ts` (via `LibraryFile.ts`).
  - Exercise naming and stable keys: `ExerciseLibrary.exerciseName` and `ExerciseLibrary.key`.
  - Search text normalisation, slang, typo distance: `SearchText.ts`, `GymSlang.ts`.
  - Exercise search and import-name suggestions: `ExerciseSearch.ts`.
  - Not done (later tasks): seeder, name resolver, editor.
- **Decisions taken / interpretations:**
  - Enums are `as const` arrays (`MUSCLES`, `EQUIPMENT`, `MOVEMENT_PATTERNS`, `MECHANICS`, `EXERCISE_TRACKINGS`, `MUSCLE_REGIONS`, `MUSCLE_ROLES`) with a derived string-union type, and `*_DISPLAY_NAMES` records. A muscle's region is `MUSCLE_REGION_OF[muscle]`; Swift's `Comparable` is `compareMuscles`.
  - `ExerciseLibrary.name(movement, equipment)` is called `ExerciseLibrary.exerciseName(...)`: a static method called `name` is a TypeScript error (it clashes with `Function.name`). `ExerciseLibrary.key(name)` and `fromJson(text)` are as briefed; `bundled()` is synchronous.
  - `ExerciseLibraryError` has a `kind`: `malformed` (new: bad JSON, missing field, wrong type, unknown slug; the message gives the path, for example `library.json.families[3].primary[0]`), `duplicateName`, `noPrimaryMuscle`, `muscleListedTwice`. The Swift `resourceMissing` is gone because the JSON is imported at build time.
  - `ExerciseSearch`: `new ExerciseSearch(entries)`, `results(query, filter, now)` (filter is `{}` for none; `now` is a `Date`, required), `suggestions(name, limit = 3)`. Entry ids are `number`, `lastUsedAt` is `Date | null`, `equipment` is `Equipment | null`; the entry type is `ExerciseSearchEntry` and the filter `ExerciseSearchFilter`, both exported from `ExerciseSearch.ts` (nested types in Swift). `T-013`'s row types can map onto these; if the lead prefers ISO strings for `lastUsedAt`, only `popularityScore` changes.
  - `SearchTuning` has the Swift constants, plus three I added: `fuzzyMatchScore` (10), `prefixMatchScore` (20), `exactMatchScore` (30), which were the raw values of Swift's `MatchKind`. `recencyWindow` (30 days in seconds) became `recencyWindowDays: 30`.
  - `GymSlang.expansions` is a `Map`, not an object, so a query like "constructor" cannot hit an inherited property (tested).
  - `SearchText` gained `words(text)` (fold, split on non-alphanumerics) so `ExerciseLibrary.key` and `tokens` share one implementation of folding and splitting. `key("Farmer's Walk")` still splits at the apostrophe (`farmer-s-walk`), while `tokens` drops it (`farmer`, `walk`), exactly as in Swift.
  - Sorting by name uses `Intl.Collator('en', { sensitivity: 'accent' })`, the nearest match to Foundation's `localizedCaseInsensitiveCompare`.
  - The speed test declares `performance` locally (`declare const performance`) because `src/core`'s tsconfig has no DOM or Node types; it averages 7 queries after a warm-up pass.
- **Open questions / left over:**
  - T-013 may have typed `exercise.equipment`, `mechanic` and `tracking` loosely; at merge they should use `Equipment`, `Mechanic` and `ExerciseTracking` from here.
  - Only the muscle vocabulary is compared with the database. Equipment and pattern have no CHECK constraint in `v1-schema`; mechanic and tracking do and the values match by inspection (no test).
- **How it was verified:** `make verify` passes (lint, typecheck, 57 new tests, production build).
