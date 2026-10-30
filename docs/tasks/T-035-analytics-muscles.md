# T-035: Analytics tab: weekly sets per muscle

- **Milestone:** W6 · **Depends on:** T-033 (merged) · **Model tier:** mid

## Goal

The Analytics tab shows, for a chosen week (default: this week), the fractional hard sets each muscle received: horizontal bars sorted by value, direct sets and indirect (secondary) sets stacked, with the evidence zones as faint background bands and their labels. A row of chips picks the week (This week, Last week, 4-week average). Tapping a muscle shows its last 12 weeks as small bars. Descriptive only: the zones are labelled with their ranges, never "too little" or "too much".

## Read first

- `AGENTS.md`, `docs/DESIGN.md` → *Charts* (volume per muscle: horizontal bars, 2 pt gap between stacked segments, zones as faint bands with text labels; categorical palette; "Show as table"), *Layout principles*.
- `src/core/queries/WeeklyMuscleVolume.ts`, `src/core/analytics/MuscleVolume.ts` (zones), `HardSets.ts`, `src/core/library/Muscle.ts` (display names, regions), `src/worker/WorkerApi.ts`.

## Scope

- **Create:** `src/app/features/analytics/` (screen, week chips, muscle bars, zone bands, muscle history sheet, table view), pure helpers with tests (bar layout: sort, scale to the max, zone positions; week choice).
- **Edit:** `AnalyticsScreen.tsx` (replace the placeholder), `WorkerApi.ts` (block `// Analytics (T-035)`: weekly muscle volume for a range of weeks).
- **Do not touch:** `src/app/design/charts/` and the exercise detail screen (another task builds the shared chart pieces in parallel; build these bars with plain SVG or CSS in your own folder, and the lead will consolidate later), core.

## Specification

- Direct segment in `--color-accent`, indirect segment in the accent at 45% opacity, 2 pt gap between them; value label at the bar end in `--color-text-secondary`, tabular digits ("12.5").
- Muscles with zero sets are listed at the bottom in a quiet "Not trained this week" line, not as empty bars.
- Empty state (no workouts yet): "Import or log workouts to see your weekly sets."
- `make format`; `make verify` must pass.

## Acceptance criteria

- [ ] Tests for the pure helpers.
- [ ] UI at 430 × 932, dark and light, with imported synthetic data spanning 3+ weeks: this week, last week, 4-week average, a muscle's history, table view, empty state.

## Handoff

- **Status:** · **What was done:** · **Files touched:** · **Decisions taken:** · **Open questions / left over:** · **How it was verified:**
