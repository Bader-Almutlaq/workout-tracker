# T-013: Port units, row types and app settings to WorkoutCore

- **Milestone:** W1
- **Depends on:** none (W0 is done)
- **Model tier:** mid

## Goal

WorkoutCore gets the small building blocks every later task uses: kg/lb conversion with the native app's exact rounding and unit inference, one TypeScript type per database table, and key–value settings. Behaviour matches the native app exactly.

## Read first

- `AGENTS.md` (TypeScript style, tests), `docs/ARCHITECTURE.md` (layers, concept table), `docs/DATA.md` → *Units*.
- `src/core/db/Database.ts`, `src/core/db/migrations.ts` (the schema the row types must match), `src/core/db/Database.test.ts` (test style).
- Native spec, in `reference/native/Packages/WorkoutCore/`:
  - `Sources/WorkoutCore/Units/WeightUnit.swift`, `Units/Weight.swift` and `Tests/WorkoutCoreTests/Units/*`
  - `Sources/WorkoutCore/Models/*.swift` (row types and their enums: `SetKind`, `SetSide`, `RecordSource`)
  - `Sources/WorkoutCore/Database/AppSetting.swift` and its tests in `Tests/WorkoutCoreTests/Database/`

## Scope

- **Create:** `src/core/units/WeightUnit.ts`, `src/core/units/Weight.ts` (+ tests); `src/core/models/<Type>.ts` for each table (`Exercise`, `ExerciseMuscle`, `ExerciseAlias`, `Workout`, `WorkoutExercise`, `WorkoutSet`, `BodyMeasurement`) plus the small enums (`SetKind`, `SetSide`, `RecordSource`) in their own files; `src/core/db/AppSetting.ts` (+ test).
- **Edit:** nothing else.
- **Do not touch:** `migrations.ts`, `Database.ts`, anything in `src/app` or `src/worker`, docs other than this file's Handoff and the board row.

## Specification

- **Units.** `WeightUnit` is the string union `'kg' | 'lb'` (the values stored in `entryUnit` / `defaultEntryUnit`) with the constant `KILOGRAMS_PER_POUND = 0.45359237` (exact, by definition). Port every function of `Weight.swift` as plain functions taking and returning numbers (kilograms in, display value out, etc.), keeping names in full words (`displayValue(kilograms, unit)`, `inferEntryUnit(kilograms)`…). Port the rounding and the inference tolerance constants into a named `as const` object with the native doc comments. Every Swift test case becomes a Vitest case with the same inputs and expected outputs.
- **Row types.** One `interface` per table, `readonly` fields named exactly as the columns in `v1-schema`. Booleans are `number` columns in SQLite: expose them as `boolean` in the interface and give each file a `from<Type>Row(row)` function that converts a raw row (0/1 → boolean). Enums are string unions with an exported `readonly` array of all values (for validation and pickers). Timestamps are ISO strings (`string`); do not convert to `Date` in the types.
- **AppSetting.** `getSetting(db, key): string | undefined` and `setSetting(db, key, value): void` (upsert), plus the known keys as a constant object (`AppSettingKey.seededLibraryVersion = 'seededLibraryVersion'`), as in the Swift file.
- Each enum's `displayName` that the native app had in core moves too (as a `Record<SetKind, string>` etc.).

## Acceptance criteria

- [ ] `make verify` passes.
- [ ] Tests: every case from the native `Units` and `AppSetting` tests, ported; a test per `from<Type>Row` converting a row read back from a migrated in-memory database.
- [ ] No `any`, no `!`, no `console`; every export has a doc comment.
- [ ] Docs: in your handoff, list the concept-table rows the lead should change from *(to port)* to done.

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:** done, in review. Branch `task/T-013-units-models-settings`.
- **What was done:** Ported `WeightUnit` and `Weight` to plain functions (`toKilograms`, `valueIn`, `displayValue`, `inferEntryUnit`, `toggledWeightUnit`, constants `KILOGRAMS_PER_POUND`, `WEIGHT_UNITS`, `WeightTolerance`). One row type per table with a `from<Type>Row` converter (0/1 to boolean), the enums `RecordSource`, `SetKind` (+ `isWorkSetKind`) and `SetSide`, and `getSetting`/`setSetting`/`AppSettingKey`. Every Swift `WeightTests` case is ported with the same inputs and expected values (the Swift suite has no `AppSetting` tests, so those three are new).
- **Files touched:** `src/core/units/{WeightUnit,Weight}.ts` + `.test.ts`; `src/core/models/{Exercise,ExerciseMuscle,ExerciseAlias,Workout,WorkoutExercise,WorkoutSet,BodyMeasurement,RecordSource,SetKind,SetSide}.ts` + `Models.test.ts`; `src/core/db/AppSetting.ts` + `.test.ts`; this file; `docs/tasks/BOARD.md`.
- **Decisions taken:**
  - `inferEntryUnit(value, columnUnit)` keeps the Swift signature (it needs the column unit; the brief's `inferEntryUnit(kilograms)` was only an example) and returns `undefined` for Swift's `nil`.
  - Swift's `rounded()` rounds halves away from zero; JS `Math.round` does not for negatives, so a private helper reproduces Swift. Results are identical for all non-negative weights.
  - `WeightUnit.symbol` (identity on the raw value) is not ported; with a string union it would be dead code.
  - `Exercise.equipment/movementPattern/mechanic/tracking` and `ExerciseMuscle.muscleId/role` are plain `string`: their enums belong to the W2 library port (concept table), and duplicating them here would break "one concept, one place". W2 should narrow these types.
  - Nullable columns are `T | null` (what SQLite returns), not `undefined`. Row ids are `number`, not optional (a read row always has one).
  - `AppSettingKey.seededLibraryVersion` stores the string `'seededLibraryVersion'` as the brief says; the Swift file used `'seeded-library-version'`. No web data uses either yet.
  - Swift `BodyMeasurement.bodyweightSite` became `BodyMeasurementSite.bodyweight`. The Swift enums had no `displayName`, so there are none to port.
  - `RecordSource` lists all four values; the schema CHECKs accept `library/custom/strong` on `exercise` and `app/strong` on `workout` and `bodyMeasurement`.
  - The row-conversion tests are in one file, `src/core/models/Models.test.ts`, because they share seeding helpers.
- **Open questions / left over:** none blocking. Concept-table rows in `docs/ARCHITECTURE.md` to change from *(to port)* to done: "Key–value app settings", "kg ↔ lb conversion, display rounding, original-unit inference", and "Stored record types (one per table)".
- **How it was verified:** `make verify` passes (eslint, `tsc -b`, 48 Vitest tests across 5 files, production build).
