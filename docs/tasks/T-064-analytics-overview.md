# T-064: Analytics tab: views, period and the Overview

- **Milestone:** W6 / R5 (analytics redesign) · **Depends on:** T-055 (long-range chart), T-062 (deload stages), T-063 (machine brands) · **Model tier:** mid (Codex Terra)
- **Runs in parallel with T-065**, which builds the Muscles coverage and Intensity sections in their own new files. Don't create or edit T-065's files; the lead wires them in after both merge.

## Goal

The Analytics tab becomes the **overview hub** for training as a whole (`docs/design/PAGES-2026-10-31.md` → Tab bar; `docs/design/PROPOSALS.md` §7 → Overview). Each exercise's, workout's and plan's own analytics stay on their pages. Today the tab shows only the 7-day vs 28-day card and weekly sets per muscle.

Product rule: **measure, don't prescribe.** Every label is descriptive ("+8% vs previous 12 weeks"), never a verdict.

## Read first

- `AGENTS.md`; `docs/DESIGN.md` (charts, long-range charts); `docs/design/PROPOSALS.md` §7; `reports/Workout tracker app research.md` → section 12 (formulas; cite them).
- Core: `src/core/analytics/` (`HardSets`, `EstimatedOneRepMax`, `StrengthTrend`, `TimeBuckets`), `src/core/queries/WeeklyMuscleVolume.ts` (Monday weeks, local dates), `ExerciseSeries.ts`, `WorkoutHistory.ts`.
- App: `src/app/features/analytics/` (all of it), `src/app/design/charts/LongRangeChart*`, `src/app/design/components/SegmentedControl.tsx`, `ToggleChip.tsx`, `src/app/features/exercises/` (how `?tab=` is read from the URL).

## Scope

- **Create:**
  - `src/core/queries/TrainingSummary.ts` (+ test)
  - `src/core/queries/LiftTrends.ts` (+ test)
  - `src/app/features/analytics/analyticsPeriod.ts` (+ test)
  - `src/app/features/analytics/AnalyticsOverview.tsx`, `AnalyticsMuscles.tsx`, `PeriodChips.tsx`, `SummaryTiles.tsx`, `LiftTrendList.tsx`, plus CSS modules as needed
- **Edit:** `AnalyticsScreen.tsx` and its CSS module, the worker API (an Analytics overview section), docs (ARCHITECTURE rows, DESIGN: the Analytics tab).
- **Do not touch:** migrations, existing formulas, the exercise/plan/measure pages, import/export, Dropbox, and T-065's files (`MuscleCoverage*`, `IntensityMix*`, `AnalyticsIntensity*`, `MuscleProminence*`).

## Specification

1. **Layout:**
   - The header keeps the title and the Settings gear.
   - Under it, a `SegmentedControl` with **Overview · Muscles**, stored in the URL as `?view=` (default Overview). The lead adds a third view, Intensity, after T-065.
   - Under that, `PeriodChips`: **4W · 12W · 6M · 1Y · All**, stored as `?period=` (default 12W). It applies to every section of every view.
2. **Periods** (`analyticsPeriod.ts`, pure):
   - Each period is whole Monday-based local weeks ending with the current week: 4, 12, 26 or 52 weeks.
   - **All** starts at the Monday of the first finished workout.
   - It also gives the **previous period** of the same length, for comparisons. All has none.
3. **Overview**, top to bottom:
   - **Summary tiles** (2 × 2), from `TrainingSummary(db, from, to)` over finished workouts:
     - workouts per week
     - hard sets per week (working sets that qualify as hard by `HardSets`; whole sets, not fractional)
     - time trained per week (mean workout duration × workouts, in h:mm)
     - volume per week (tonnage in kg; secondary, smaller text)
     - Each tile shows its change vs the previous period, e.g. "+8% vs previous 12 weeks", or nothing for All or no previous data.
     - Deload sessions count normally here.
   - **The 7-day vs 28-day card** (the existing `SignatureCard`), unchanged.
   - **Workouts per week:** a `LongRangeChart` of finished workouts per bucket (sum aggregation) over the period, with deload marks where a week had a deload session.
   - **Lift trends:** from `LiftTrends(db, from, to)`.
     - Up to 8 weight-and-reps exercises with the most sessions in the period, each needing at least 3 sessions with qualifying sets.
     - Each row: the name, the current e1RM trend (display unit), and the **block change** (report §12: trend at period end ÷ trend at period start − 1) as "+4.1%".
     - Also a small inline sparkline of the trend (SVG, `d3-shape`, no axes).
     - **Deload sessions are excluded** from the trend observations (PROPOSALS §7).
     - When the period's sessions span two or more machine brands, the row says "mixed machines".
     - Tapping a row opens that exercise's page on its Charts tab.
     - Empty state: "Log at least 3 sessions of a lift in this period to see its trend."
4. **Muscles view:** the current weekly-sets content (week chips, bars or table, muscle history sheet) moves unchanged into `AnalyticsMuscles.tsx`.
   - Its week chips keep working as today.
   - The period chips set the history range of its muscle history sheet.
5. **States:** a loading state, an error state that shows the message, and empty states with plain text for no workouts. Works at 430 × 932 in dark and light.

## Acceptance criteria

- [ ] `make format`; `make verify` passes.
- [ ] `analyticsPeriod` tests: each period's from/to on Monday weeks, the previous period, All from the first workout, a week crossing a year end.
- [ ] `TrainingSummary` tests: per-week figures, hard-set counting excludes warm-ups and RIR > 4, unfinished workouts excluded, change vs previous period, no previous data.
- [ ] `LiftTrends` tests: ranking by sessions, the 3-session minimum, block change hand-computed, deload sessions excluded, mixed machines flagged, bodyweight and time exercises left out.
- [ ] Component tests: the view and period read from and written to the URL; tiles show the change text; a lift row links to the exercise Charts tab.
- [ ] Docs updated. Don't commit (the lead commits). No attribution or mention of tools/agents anywhere.

## Handoff

_Filled in by the implementer when stopping or finishing._
