# T-043b: Body screen polish

- **Milestone:** R1 · **Depends on:** T-043 (merged) · **Model tier:** mid (Codex Terra). Runs in parallel with T-044, so stay inside the files below.

## Goal

The Body screen works but is cluttered: every site is a big card even with no data ("—", "No comparison in 4 weeks", a separate "X · History" button), the unit pickers take the top of the screen, and "+0.5 cm in 4 weeks" is shown when the reference entry is really three months old. Make it a calm, compact list that reads honestly.

## Scope

- **May edit:** `src/app/features/body/**`, `src/core/measurements/MeasurementChange.ts` and `MeasurementQueries.ts` (and their tests) for the change-label data, `src/app/features/settings/SettingsScreen.tsx` plus a new small settings section component for units, `docs/DATA.md` (one line).
- **Do not touch:** migrations, workout/logging, exercises, analytics Training content, charts' shared pieces (`src/app/design/charts/`), WorkerApi beyond the existing measurement block.

## Changes

1. **Compact list.**
   - One row per group, using the existing row style: name on the left, latest value(s) on the right (pairs "L 38.5 · R 38.9 cm"), and the change caption beneath.
   - The whole row opens the detail. Drop the separate "X · History" buttons.
   - Sites with no entries go into a collapsed **Not measured yet (N)** section at the bottom. Its rows show only the name and open the detail, so a first entry can be logged.
2. **Units move to Settings → Units.** Length (cm/in) and body weight (kg/lb). Remove the pickers from the Body screen.
3. **Honest change labels.**
   - The reference is the newest entry on or before (latest − 4 weeks), as now, but the label states the reference date: "−1 cm since Sep 1".
   - If there is no entry that old: "first entry Oct 1" (no change).
   - Detail keeps 4 weeks / 12 weeks / since first, each labelled with its reference date.
   - Use a real minus sign (−).
4. **Pairs open one detail.**
   - Tapping a left/right group opens a group detail with both sides as two series (L, R) on one chart.
   - A **Relaxed | Flexed** switch appears when the group supports flexed.
   - The guide note is shown once per group; left and right share the group's guide in the UI. Edit writes to both sites.
5. **Detail clean-up.** Remove the redundant lines ("History · cm", the lone "Relaxed", "Touch the chart to inspect…"); the chart and its legend carry that. Keep the guide note, **Log**, chart, changes and history with edit/delete.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] Tests for the change-label text (reference date, first entry, minus sign) and the not-measured grouping.

## Handoff

_Filled in by the implementer when stopping or finishing._

- **Status:**
- **What was done:**
- **Files touched:**
- **Decisions taken:**
- **Open questions / left over:**
- **How it was verified:**
