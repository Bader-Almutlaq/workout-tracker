# T-048: Export workouts as Strong CSV (importable by Hevy and Strong) and measurements as CSV

- **Milestone:** wave 3 · **Depends on:** none (no schema change; parallel with T-044) · **Model tier:** mid (Codex Terra)

## Goal

The owner can take their data to other apps. Hevy's help centre says Hevy imports **only Strong-format CSV**, so one exporter in Strong's workout CSV format serves Strong, Hevy and most apps that accept Strong files. Measurements export as one CSV. Our own Strong importer must read both exports back exactly: that round trip is the proof.

## Read first

- `AGENTS.md`; `docs/DATA.md` → *Strong export* (the layouts our importer reads); `src/core/import/StrongWorkoutsFile.ts`, `StrongRow.ts`, `StrongTimestamp.ts`, `StrongMeasurementsFile.ts`, `CsvTable.ts` (match its quoting rules), `src/core/import/fixtures/StrongFixtures.ts` (the older comma layout header).
- `src/core/models/*`; the measurement core (`src/core/measurements/`); Settings → Backups (`useBackupFile.ts` shows how a file is shared or downloaded).

## Scope

- **Create:** `src/core/export/StrongCsvExport.ts` and `MeasurementsCsvExport.ts` (+ tests), a Settings → **Export** section (two buttons) using the same share/download path as backups.
- **Edit:** `WorkerApi.ts` (block `// Export (T-048)`), SettingsScreen, `docs/DATA.md` (an Export section).
- **Do not touch:** the importers' behaviour (tests may call them), migrations, charts, workout logging, warm-ups (T-044 is running in parallel).

## Specification

**Workouts:** use the **older comma layout** that our fixtures call `OLDER_HEADER`:

`Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE`

- One row per set, finished workouts only, ordered by start time, then exercise position, then set position.
- **Date:** local time `YYYY-MM-DD HH:mm:ss`.
- **Duration:** Strong style, e.g. `1h 7m`, `59m`, or empty when the end is unknown.
- **Set Order:** `W` warm-up, `D` drop, `F` failure, otherwise the 1-based count of non-warm-up sets.
- **Weight:** kilograms (state this in DATA.md; Hevy asks for the unit at import).
- **Reps;** Distance in metres; Seconds.
- **Notes:** the set note; the exercise note goes on the first set row only if there is no set note. Document this.
- **Workout Notes** on the first row of each workout. RPE empty when not logged.
- Quote fields per RFC 4180 (commas, quotes, newlines). UTF-8 without a BOM.
- File name: `JEM-workouts-YYYY-MM-DD.csv`.
- Exercise names are ours. They are already Strong-style "Movement (Equipment)".

**Measurements:**
- One CSV, `Date,Measurement Type,Value,Unit`.
- Measurement Type uses Strong's labels for Strong's sites ("Left Bicep", "Waist", "Weight" for bodyweight) and the site name otherwise.
- Unit is `cm` or `kg`.
- Add a `State` column only when a flexed entry exists. Document that Strong and Hevy ignore it.
- File name: `JEM-measurements-YYYY-MM-DD.csv`.

**Round trip (the acceptance test):**
- Build a synthetic database with: kg and lb sets, warm-up, drop and failure kinds, RPE, notes with commas, quotes and newlines, a workout spanning midnight, a timed set and a distance set.
- Export it, import it into a fresh database with the existing Strong importer and default options (kg), and compare every workout, set (kind, weight within 1e-9 kg, reps, RPE, duration, distance, notes) and measurement.
- Document any field that can't round-trip (e.g. the entry unit, since Strong CSV carries no per-set unit) and assert exactly that list.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Unit tests for each column's formatting (duration text, set order, quoting).
- [ ] The round-trip test above.
- [ ] DATA.md Export section; Settings → Export works (share sheet or download).

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
