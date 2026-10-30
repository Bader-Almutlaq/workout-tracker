# T-049: Import from Hevy, FitNotes and Fitbod (same review as Strong)

- **Milestone:** wave 3 · **Depends on:** T-048 (merged) · **Model tier:** strong (Codex Sol: tolerant parsers for formats we have no real sample of). Runs in parallel with T-047 (library), so don't touch the library, migrations, or the matching screen beyond what is listed.

## Goal

Other people (and the owner's friends) come from other apps. Import the main ones through the **existing** Strong pipeline: each app gets an adapter that turns its CSV into the same normalised rows (`StrongRow`). Units review, flagged sets, **Leave out all**, exercise matching and idempotent re-import then work identically, with no second pipeline.

## Read first

- `AGENTS.md`; `docs/DATA.md` (Strong export, typo checks, Export); `src/core/import/StrongRow.ts` (the normalised row), `StrongWorkoutsFile.ts` (`parseStrongWorkoutsFile`), `CsvTable.ts`, `StrongTimestamp.ts`, `parseDecimal.ts`, `StrongImportPlan.ts`, `StrongImporter.ts` (`sourceKey` idempotency), `ExportUnitResolver.ts`.
- App: `src/app/features/import/*` (pick → review → result).

## Scope

- **Create:**
  - `src/core/import/formats/` with `detectWorkoutFileFormat(text)` (+ test), returning `'strong' | 'hevy' | 'fitnotes' | 'fitbod' | 'unknown'`, decided from the header row
  - one adapter per app: `HevyWorkoutsFile.ts`, `FitNotesWorkoutsFile.ts`, `FitbodWorkoutsFile.ts` (+ tests with small synthetic fixtures), each returning `StrongRow[]`
- **Edit:**
  - The import screen: title "Import workouts". Accept any supported file, show "Detected: Hevy export", keep Strong's measurement files. Rename only visible text: the Settings entry becomes "Import from Strong, Hevy, FitNotes or Fitbod…".
  - The worker import entry, so it detects the format first.
  - The `sourceKey` prefix per format (e.g. `hevy:<start>`), so files from two apps never collide.
  - `docs/DATA.md` → *Other apps* (each format's columns, mapping, and that it is **unverified against a real file** until the owner or a user supplies one).
- **Do not touch:** migrations, the library, the matching UI internals, charts, export.

## Formats (documented from public parsers; the parsers must be tolerant)

Detect columns **by header name**, case-insensitive. Ignore unknown columns. Accept both kg and lb variants of a column and convert as the existing pipeline expects (kg values stay kg; lb columns set that exercise's export unit to lb).

- **Hevy:** `title, start_time, end_time, description, exercise_title, superset_id, exercise_notes, set_index, set_type, weight_kg | weight_lbs, reps, distance_km | distance_miles, duration_seconds, rpe`.
  - `set_type`: normal → working, warmup, dropset → drop, failure.
  - Times are like `26 Oct 2024, 18:00` (also accept ISO 8601), in local time.
  - Workout key: `start_time`.
  - `description` → workout notes; `exercise_notes` → a note row.
- **FitNotes:** `Date, Exercise, Category, Weight (kgs) | Weight (lbs), Reps, Distance, Distance Unit, Time, Comment`.
  - There are no workout times: one workout per date (name "FitNotes workout", start 12:00 local), set order by row order.
  - `Time` is `HH:MM:SS` → seconds; `Comment` → set note.
- **Fitbod:** `Date, Exercise, Reps, Weight(kg) | Weight(lb), Duration(s), Distance(m), Incline, Resistance, isWarmup, Note, multiplier`.
  - `Date` has a time.
  - One workout per distinct start minute, else per date.
  - `isWarmup` true → W; `multiplier` (2 for dumbbell pairs in some exports) is **not** applied: weights stay as entered (document it).

Unknown or missing required columns → a readable `ImportError` naming the missing column. `unknown` format → "This file isn't a Strong, Hevy, FitNotes or Fitbod workout export."

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Detector tests for each header (and lookalikes).
- [ ] Per-adapter tests: kinds, units, notes, times (including DST-safe local parsing with a pinned TZ), quoting, missing column errors.
- [ ] An end-to-end test per format: synthetic CSV → plan → importer into a fresh DB → expected workouts and sets. Importing twice adds nothing.
- [ ] A Strong file still imports exactly as before (existing tests untouched and passing).
- [ ] DATA.md *Other apps* section, with the "unverified against a real file" note.

## Handoff

- **Status:** Implementation complete; ready for lead review. Changes left uncommitted; board unchanged as instructed.
- **What was done:** Added header detection and three tolerant CSV adapters feeding the existing Strong review/import pipeline. Explicit units bypass Strong's numerical inference; review overrides, corrections, exclusion/reset and re-import work through the existing plan. Worker detection retains measurement files and snapshot-before-import. Updated visible import copy and detected-format label. Documented mappings and real-file limitations in DATA.md.
- **Files touched:**
  - New `src/core/import/formats/`: `detectWorkoutFileFormat.ts`, `HevyWorkoutsFile.ts`, `FitNotesWorkoutsFile.ts`, `FitbodWorkoutsFile.ts` and adjacent tests; shared `WorkoutFileTable.ts`, `WorkoutFileUnits.ts`, `parseWorkoutTimestamp.ts`; synthetic `fixtures/WorkoutFileFixtures.ts`; end-to-end `WorkoutFormats.test.ts`.
  - `src/core/import/StrongRow.ts`, `StrongImportPlan.ts`, `ImportError.ts`; `src/worker/WorkerApi.ts` and new `WorkerApi.importFormats.test.ts`.
  - `src/app/features/import/{StrongImportScreen,ImportPickStep,ImportReviewStep,PoundExercisesSection}.tsx`; `src/app/features/settings/SettingsScreen.tsx`; `docs/DATA.md`; this Handoff only.
- **Public API:** `detectWorkoutFileFormat(text): WorkoutFileFormat`; `parseHevyWorkoutsFile`, `parseFitNotesWorkoutsFile`, `parseFitbodWorkoutsFile` each return `StrongRow[]`. Optional `StrongRow.sourceFormat`/`exportUnit`, optional `StrongImportPlan.sourceFormat`, and `ImportError.kind = unsupportedWorkoutFile`. Existing worker method names and importer signatures are retained. Shared adapter helpers export `WorkoutFileTable`, `WorkoutFileUnits` and `parseWorkoutTimestamp` for reuse within formats.
- **Decisions taken:**
  - Required columns are identity columns: Hevy title/start_time/exercise_title; FitNotes and Fitbod Date/Exercise. Optional numeric columns may be absent for bodyweight/timed rows. Header signatures distinguish formats, including sufficiently recognizable damaged exports so adapters can name a missing column.
  - Explicit kg/lb values retain their column unit as entryUnit, even when Strong's numerical heuristic would infer another unit. With both variants present, populated kg wins, otherwise lb; per-row units are retained. A user override applies to the whole exercise.
  - Hevy uses raw start_time as key, deduplicates repeated exercise notes and defaults unknown set labels to working. FitNotes groups all rows per date at local noon. Fitbod groups by the parsed start minute (date-only fallback at local noon), does not apply multiplier, and accepts true/false, 1/0 and yes/no warmup flags. Set order follows file order; no supersets/incline/resistance fields are invented.
  - Source-key prefixes isolate apps; existing schema source=`strong` remains the external-import category so exercise matching continues unchanged. No migration, library, matching internals, charts or export changes.
- **Open questions / left over:** All three formats remain **unverified against a real file**. Fitbod minute grouping can merge sessions sharing a minute; cross-app duplicate workouts are intentionally separate. Visual dark/light/430 × 932 inspection could not run: `make dev` fails with sandbox `listen EPERM` and the browser tool reports its access host unavailable. Lead should inspect the revised copy in Settings, pick/review and error states. Lead owns any concept-table/decision-log additions outside this task's scope; adapter ownership is `src/core/import/formats/`.
- **How it was verified:** `make format` then `make verify` passed: **932 tests in 126 files**, lint, strict type checks and production build. New coverage includes all detector headers/lookalikes, per-adapter kinds/units/notes/quoting/missing columns, pinned-TZ DST gaps/folds/noon, CSV → plan → migrated real in-memory SQLite per app, idempotency, source-key isolation, review decisions, worker dispatch, measurement coexistence, snapshot failure and stale-plan rejection. Existing Strong tests were untouched and pass. Build emits a nonfatal chunk-size warning (main bundle just over 500 kB).
