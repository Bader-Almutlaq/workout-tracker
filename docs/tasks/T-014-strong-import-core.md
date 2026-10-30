# T-014: Port the Strong importer and typo checks; `make import-report`

- **Milestone:** W1
- **Depends on:** T-013 (units, row types)
- **Model tier:** mid (the lead reviews closely: this path writes the owner's 4 years of data)

## Goal

WorkoutCore can read the owner's Strong export (both CSV layouts and the body-measurement files), work out which exercises were logged in pounds, flag likely typos for review, and write everything to the database in one transaction: safely, repeatably, and with the exact totals the native app produced.

## Read first

- `AGENTS.md`, `docs/DATA.md` → *Strong export* and *Typo and outlier checks* (the verified totals you must reproduce), `docs/ARCHITECTURE.md` → concept table.
- Your T-013 output: `src/core/units/`, `src/core/models/`.
- Native spec in `reference/native/Packages/WorkoutCore/`:
  - `Sources/WorkoutCore/Import/*.swift` (CSV table, Strong row, both file formats, timestamps, unit resolver, import plan and options, importer, errors)
  - `Sources/WorkoutCore/Validation/SetPlausibility.swift`
  - `Sources/WorkoutCore/Library/ExerciseNameResolver.swift` (the importer resolves names through it)
  - `Sources/StrongImportReport/main.swift` (the report tool)
  - Tests: `Tests/WorkoutCoreTests/Import/*`, `Tests/WorkoutCoreTests/Validation/SetPlausibilityTests.swift`, `Tests/WorkoutCoreTests/Fixtures/StrongFixtures.swift`

## Scope

- **Create:** `src/core/import/` (one file per Swift type, same names: `CsvTable.ts`, `StrongRow.ts`, `StrongWorkoutsFile.ts`, `StrongMeasurementsFile.ts`, `StrongTimestamp.ts`, `ExportUnitResolver.ts`, `StrongImportPlan.ts`, `StrongImportOptions.ts`, `StrongImporter.ts`, `ImportError.ts`) with tests; `src/core/import/fixtures/` (synthetic CSV strings, ported from `StrongFixtures.swift`); `src/core/validation/SetPlausibility.ts` (+ test); `src/core/library/ExerciseNameResolver.ts` (+ test); `tools/import-report.ts`.
- **Edit:** nothing else.
- **Do not touch:** migrations, `src/app`, `src/worker`, `export_data/` contents (read-only, and only from `tools/import-report.ts`).

## Specification

- Port behaviour exactly, including every constant (as named `as const` objects with the native doc comments and citations) and every test case. Where Swift used `Date`, use ISO strings in UTC; Strong timestamps are local time: interpret them in the device's time zone, as the native app did, and keep a test that pins the zone (`process.env.TZ` set in the test file) so results don't depend on the Mac's zone.
- **The importer is a pure function of `(db, plan, options, now)`.** It does not take a snapshot itself: the worker does that before calling it (documented on the function). Everything happens in one `db.transaction`. Re-importing the same file adds nothing (`sourceKey`), as in the native tests.
- Errors are `ImportError` with a `kind` and a message the owner can read, mirroring `ImportError.swift`.
- `tools/import-report.ts` (run by `make import-report` via `tsx`) reads every `.csv` in `export_data/`, builds the plan without a database, and prints the same report as the native tool. It is the only code that reads `export_data/`.
- **Correctness bar:** on the owner's export, `make import-report` must print 983 workouts, 23,199 sets (22,848 non-warm-up), 89 measurements across 15 sites, tonnage 9,568,149.54 kg, 54 flagged sets, and the 5 pound-unit exercises listed in `docs/DATA.md`. Paste the report's totals (not any rows) into your handoff.

## Acceptance criteria

- [ ] `make verify` passes.
- [ ] Every native test case in the files listed above is ported and passing; add a test for anything you had to interpret.
- [ ] `make import-report` totals match `docs/DATA.md` exactly.
- [ ] No owner data in fixtures, tests or docs.

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:** done, ready for review.
- **What was done:** Ported the Strong importer (CSV table, both file layouts, measurement files, timestamps, per-exercise unit resolver, import plan and options, importer, errors), `SetPlausibility` (typo checks), `ExerciseNameResolver`, and `tools/import-report.ts`. Every native test case is ported with the same inputs and expected outputs, plus extra tests for the interpreted behaviour below. `make import-report` on the owner's export prints: 983 workouts; 23,199 sets (22,848 excluding warm-ups); 89 measurements across 15 sites; volume 9,568,149.54 kg; 54 suspicious sets; the same 5 pound-unit exercises as `docs/DATA.md` (Seated Leg Curl 0/804, Reverse Fly 0/564, Standing Calf Raise 0/163, Lateral Raise (Machine) 0/196, Chest Fly 0/155); no kg exercise has any lb vote. A throwaway run (not committed) imported the real plan into an in-memory database: 983 workouts, 23,199 sets, 85 exercises, 89 measurements, stored volume 9,568,149.54, 5 lb exercises, re-import adds nothing; it took about 5 s in Node.
- **Files touched:** `src/core/import/*` (CsvTable, ExportUnitResolver, ImportError, StrongImportOptions, StrongImportPlan, StrongImporter, StrongMeasurementsFile, StrongRow, StrongTimestamp, StrongWorkoutsFile, plus small helpers `parseDecimal.ts` and `trimWhitespace.ts`, each with a test; `fixtures/StrongFixtures.ts`, `fixtures/expectImportError.ts`), `src/core/validation/SetPlausibility.ts` (+ test), `src/core/library/ExerciseNameResolver.ts` (+ test), `src/core/support/groupBy.ts` (+ test), `tools/import-report.ts`, this file and the board.
- **Decisions taken:**
  - Public API names: `parseStrongWorkoutsFile`, `parseStrongMeasurementsFile`, `makeStrongImportPlan(rows, measurements, options)`, `importStrongPlan(db, plan, now)`, `resolveExportUnit`, `findImplausibleSets`, `exerciseIdNamed(db, name)`. `checkSet` and `SessionSummary` are exported because live logging (`LiveSetCheck`, W3) calls them in the native code.
  - The importer takes `(db, plan, now)`, not `(db, plan, options, now)`: the owner's decisions (unit overrides, corrections, confirmed lines) are already applied when the plan is built, so a separate `options` parameter would be unused. `now` stamps `createdAt` of new exercises. It takes no snapshot (documented on the function); the worker must snapshot first. The native test "a snapshot is taken before importing" therefore became "a failure rolls back everything".
  - Time zone: timestamps are read in the process/device zone (no `timeZone` parameter, unlike native). Tests pin it with `vi.stubEnv('TZ', …)`, including New York (daylight saving) and Riyadh cases. A skipped DST hour moves forward; a repeated hour takes the first occurrence. Timestamps may have 1 or 2 digit month/day/time parts; years need 4 digits; impossible dates (30 Feb) are rejected.
  - Numbers: a strict decimal parser rejects `NaN`, `Infinity` and hex, which Swift's `Double(_)` would have accepted; reps round half away from zero, as Swift does.
  - Native order-dependence made deterministic: Swift built exercise overviews and sessions from `Dictionary` iteration (random order), then sorted. Here groups keep first-appearance order and the sort is stable, so equal set counts or equal timestamps keep file order.
  - `StrongRow.line` keeps the native meaning (row index + 2, blank lines not counted), so it can differ from the physical line when a quoted value spans lines. It is only an identifier for the review.
  - `INSERT OR IGNORE` for measurements also ignores rows that violate a CHECK constraint (same as native `.ignore`).
  - Added `src/core/support/groupBy.ts` (outside the brief's file list) because `Map.groupBy` is not in the ES2023 lib and two modules need ordered grouping.
  - The tool takes an optional folder argument (default `export_data`), prints errors to stderr and exits 1. The git-ignored `export_data/` does not exist inside a worktree, so run with the main checkout's path there.
- **Open questions / left over:**
  - Import speed: each row is a separate `db.run` (about 5 s for the real file in Node). On the phone it will be slower. A prepared-statement API on `Database` (a lead-owned file) would speed it up; the T-017 import screen should show progress or a spinner.
  - Two workouts with identical start timestamps that are not adjacent in the file would collapse into one `sourceKey` and the second would be skipped (native behaviour). The owner's file has 983 distinct timestamps and 983 groups, so it does not occur.
- **How it was verified:** `make verify` (lint, typecheck, tests, build); `make import-report` against the owner's export (totals above); throwaway in-memory import of the real plan as described.
