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

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
