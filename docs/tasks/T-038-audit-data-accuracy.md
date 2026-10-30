# T-038: Audit: data accuracy

- **Milestone:** quality · **Depends on:** none · **Model tier:** strong (Codex Sol)
- **Runs in parallel with:** T-037 (no data loss). Stay inside your file areas below; if a fix needs a file outside them, describe it in the Handoff instead of editing.

## Goal

The owner asked for proof that every number the app shows is right: imported history matches Strong, weights are stored exactly as typed, and every calculation (e1RM, hard sets, volume, recent vs baseline, daily/weekly grouping) is correct. Check each against hand-worked examples and the research report, prove any error with a failing test, fix it, and leave a written verdict per area.

## Read first

- `AGENTS.md` (units rule: kilograms stored exactly as entered, with the entry unit; conversion only for display), `docs/DATA.md` (Strong export quirks), `docs/ARCHITECTURE.md` → *Concept ownership*, `reports/Workout tracker app research.md` (formulas and worked examples).
- `src/core/import/` parsers and plan (`CsvTable`, `StrongWorkoutsFile`, `StrongRow`, `StrongTimestamp`, `StrongMeasurementsFile`, `ExportUnitResolver`, `StrongImportPlan`, `StrongImportOptions`, `parseDecimal`), `src/core/validation/` (typo/outlier checks), `src/core/units/`, `src/core/analytics/*`, `src/core/queries/*`, `src/core/support/localDate.ts`, `src/app/format/` (read only, to see how numbers reach the screen).

## Scope (your file areas)

- **May edit and add tests in:** `src/core/import/` except `StrongImporter*` (T-037 owns it), `src/core/units/`, `src/core/validation/`, `src/core/analytics/`, `src/core/queries/`, `src/core/support/`.
- **Do not touch:** `src/app/` (no UI or chart changes: the owner put charts on hold; if a display formatter is wrong, describe it in the Handoff), `src/worker/`, `src/core/db/`, logging, templates, backup, migrations. Never read or copy `export_data/` (the owner's real data); use synthetic fixtures only.

## What to check (each needs at least one test with hand-computed expected values)

1. **Import parsing:** both Strong layouts, quoted fields with commas and newlines, set-order codes (W, D, F, numbers), RPE blanks, durations, distances, seconds, notes, measurements file, BOM and CRLF, time zones (local timestamps), duplicate rows.
2. **Units:** lb → kg → lb round-trips display exactly what was typed (e.g. 135 lb, 225 lb, 2.5 lb plates); per-exercise unit inference; no rounding at storage; display rounding rules.
3. **e1RM and effective reps:** worked examples from the report; RPE missing; reps above the formula's valid range; warm-ups and incomplete sets excluded; bodyweight and timed exercises excluded.
4. **Hard sets and volume:** warm-ups excluded everywhere (hard sets, volume, tonnage); drop and failure sets counted per the report; fractional primary 1 / secondary 0.5; one set never counted twice for the same muscle.
5. **Dates:** grouping by the phone's local day and Monday-start weeks across DST changes and around midnight; workouts spanning midnight.
6. **Recent vs baseline and range statistics:** window edges, zero baselines (no Infinity/NaN), missing days zero-filled.
7. **History totals:** per-workout set counts and volume match the sets shown.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Each error found has a regression test and a fix inside your areas (or a precise description in the Handoff if outside).
- [ ] Handoff lists, per numbered area above: **verdict** (correct / fixed / wrong outside my area), the tests that prove it, and any formula choice that is a judgement call rather than a cited rule.

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **Findings by area (1–7):**
- **Files touched:**
- **Open questions / left over:**
- **How it was verified:**
